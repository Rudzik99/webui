import { Injectable } from '@angular/core';

import { WebSocketService } from '../../../../services';

export interface TreeNode {
  children?: TreeNode[];
  data?: any;
  expanded?: boolean;
  indexPath?: number[];
}

@Injectable()
export class EntityTreeTableService {
  constructor(private ws: WebSocketService) {}

  // Do we still need this?
  buildTree(data) {
    const tree: TreeNode[] = [];
    for (let i = 0; i < data.length; i++) {
      const node = this.getNode(data[i]);
      tree.push(node);
    }
    return tree;
  }

  buildTable(data, expandAll = false) {
    // Converts a Tree structure to a flat list
    const flatList: TreeNode[] = [];

    // Walk to get the children
    const rootIndexPath = [0];
    this.walk(data, flatList, null, expandAll);

    return flatList;
  }

  walk(tree: TreeNode[], rows: TreeNode[], parentIndexPath?: number[], expandAll?: boolean) {
    tree.forEach((node, nodeIndex) => {
      if (expandAll && node.children.length > 0) {
        node.expanded = true;
      }

      if (node.expanded && node.expanded.toString() !== 'true') {
        node.expanded = false;
      }

      node.indexPath = !parentIndexPath && rows.length == 0 ? [nodeIndex] : parentIndexPath.concat([nodeIndex]);
      rows.push(node);

      if (node.children.length > 0 && node.expanded && node.expanded.toString() == 'true') {
        // ...but the Children!
        this.walk(node.children, rows, node.indexPath, expandAll);
      }
    });
  }

  findNode(indexPath: number[], treeData: TreeNode[]) {
    let currentNode;
    indexPath.forEach((tier, index) => {
      currentNode = index == 0 ? treeData[0] : currentNode.children[tier];
    });

    return currentNode;
  }

  findParents(indexPath: number[], data: TreeNode[], asObject = true) {
    const output = asObject ? {} : [];
    const path = Object.assign([], indexPath);

    for (let i = indexPath.length - 1; i >= 0; i--) {
      const node = this.findNode(path, data);
      output[node.data.id] = true;
      path.pop();
    }

    return output;
  }

  editNode(prop: string, value: any, indexPath: number[], treeData: TreeNode[]) {
    const node = this.findNode(indexPath, treeData);

    // Clone the data
    const clone = Object.assign([], treeData);

    node[prop] = value;

    return clone;
  }

  filteredTable(key, value, data, preserveExpansion = false) {
    // Fully expanded and flattened list
    const args = preserveExpansion ? [data] : [data, true];
    // let flattened = this.buildTable(...args); // ES6 way not working?
    const flattened = preserveExpansion ? this.buildTable(data) : this.buildTable(data, true);

    // Parents we need to keep
    let preserve = {};

    for (let index = flattened.length - 1; index >= 0; index--) {
      const row = flattened[index];
      if (row.data[key].includes(value)) {
        const node = this.findNode(row.indexPath, data);

        // Log ancestors so we know which ones to keep
        const parents = this.findParents(row.indexPath, data);
        preserve = Object.assign(preserve, parents);
      } else if (row.children.length == 0 || !preserve[row.data.id]) {
        flattened.splice(index, 1);
      }
    }

    return flattened;
  }

  // Do we still need this?
  getNode(item) {
    const nodeData = {};
    for (const prop in item) {
      nodeData[prop] = item[prop];
    }

    const nodeChildren = [];
    for (const child in item.children) {
      nodeChildren.push(this.getNode(item.children[child]));
    }

    const node: TreeNode = {};
    node.data = nodeData;
    node.expanded = true;
    node.children = nodeChildren;
    return node;
  }
}
