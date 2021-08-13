import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { Dataset, ExtraDatasetQueryOptions } from 'app/interfaces/dataset.interface';
import { CoreEvent } from 'app/interfaces/events';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { User } from 'app/interfaces/user.interface';
import { WebSocketService } from 'app/services/ws.service';
import { CoreService } from './core-service/core.service';

export interface ApiCall {
  namespace: ApiMethod; // namespace for ws and path for rest
  args?: any;
  responseEvent?: string;// The event name of the response this service will send
  errorResponseEvent?: string;// The event name of the response this service will send in case it fails
}

interface ApiDefinition {
  apiCall: ApiCall;
  preProcessor?: (def: ApiCall) => ApiCall;
  postProcessor?: (res: unknown, callArgs: unknown, core: CoreService) => unknown;
}

@UntilDestroy()
@Injectable()
export class ApiService {
  private apiDefinitions: { [eventName: string]: ApiDefinition } = {
    UserAttributesRequest: {
      apiCall: {
        namespace: 'user.query',
        args: [] as any[], // eg. [["id", "=", "foo"]]
        responseEvent: 'UserAttributes',
      },
      preProcessor(def: ApiCall) {
        const clone = { ...def };
        clone.args = [[['id', '=', 1]]];
        return clone;
      },
      postProcessor(res: User[]) {
        const cloneRes = { ...res };
        return cloneRes[0].attributes;
      },
    },
    UserDataRequest: {
      apiCall: {
        namespace: 'user.query',
        args: [] as any[], // eg. [["id", "=", "foo"]]
        responseEvent: 'UserData',
      },
    },
    UserDataUpdate: {
      apiCall: {
        namespace: 'user.set_attribute',
        args: [] as any[],
      },
      preProcessor(def: ApiCall) {
        const uid = 1;
        const redef = { ...def };
        redef.args = [uid, 'preferences', def.args];
        return redef;
      },
      postProcessor(res: any, callArgs: any, core: any) {
        const cloneRes = { ...res };
        if (res == 1) {
          core.emit({ name: 'UserDataRequest', data: [[['id', '=', 1]]] });
        }
        return cloneRes;
      },
    },
    VolumeDataRequest: {
      apiCall: {
        namespace: 'pool.dataset.query',
        args: [[], { extra: { retrieve_children: false } }] as QueryParams<Dataset, ExtraDatasetQueryOptions>,
        responseEvent: 'VolumeData',
      },
    },
    DisksRequest: {
      apiCall: {
        args: [] as QueryParams<Disk>[],
        namespace: 'disk.query',
        responseEvent: 'DisksData',
      },
    },
    MultipathRequest: {
      apiCall: {
        args: [] as any[],
        namespace: 'multipath.query',
        responseEvent: 'MultipathData',
      },
    },
    EnclosureDataRequest: {
      apiCall: {
        namespace: 'enclosure.query',
        responseEvent: 'EnclosureData',
      },
    },
    SetEnclosureLabel: {
      apiCall: {
        args: [] as any[],
        namespace: 'enclosure.update',
        responseEvent: 'EnclosureLabelChanged',
      },
      preProcessor(def: ApiCall) {
        const redef = { ...def };
        const args = [def.args.id, { label: def.args.label }];
        redef.args = args;
        return redef;
      },
      postProcessor(res: any, callArgs: any) {
        return { label: res.label, index: callArgs.index, id: res.id };
      },
    },
    SetEnclosureSlotStatus: {
      apiCall: {
        args: [] as any[],
        namespace: 'enclosure.set_slot_status',
        responseEvent: 'EnclosureSlotStatusChanged',
      },
    },
    PoolDataRequest: {
      apiCall: {
        args: [] as any[],
        namespace: 'pool.query',
        responseEvent: 'PoolData',
      },
    },
    PoolDisksRequest: {
      apiCall: {
        namespace: 'pool.get_disks',
        args: [] as any[],
        responseEvent: 'PoolDisks',
      },
      preProcessor(def: ApiCall) {
        const redef = { ...def };
        redef.responseEvent = def.args.length > 0 ? def.responseEvent + def.args.join() : def.responseEvent;
        return redef;
      },
      postProcessor(res: any, callArgs: any) {
        let cloneRes = { ...res };
        cloneRes = { callArgs, data: res };
        return cloneRes;
      },
    },
    NicInfoRequest: {
      apiCall: {
        namespace: 'interface.query',
        args: [] as any[],
        responseEvent: 'NicInfo',
      },
    },
    UpdateCheck: {
      apiCall: {
        namespace: 'update.check_available',
        args: [] as any[],
        responseEvent: 'UpdateChecked',
      },
    },
    VmStop: {
      apiCall: {
        namespace: 'vm.stop',
        args: [] as any,
        responseEvent: 'VmProfiles',
        errorResponseEvent: 'VmStopFailure',
      },
      postProcessor(res: any, callArgs: any) {
        let cloneRes = { ...res };
        cloneRes = { id: callArgs[0] }; // res:boolean
        return cloneRes;
      },
    },
    ReportingGraphsRequest: {
      apiCall: {
        namespace: 'reporting.graphs',
        args: [] as any,
        responseEvent: 'ReportingGraphs',
      },
    },
    SensorDataRequest: {
      apiCall: {
        namespace: 'sensor.query',
        responseEvent: 'SensorData',
      },
    },
  };

  constructor(
    protected core: CoreService,
    protected ws: WebSocketService,
  ) {
    this.ws.authStatus.pipe(untilDestroyed(this)).subscribe((evt) => {
      this.core.emit({ name: 'UserDataRequest', data: [[['id', '=', 1]]] });
      this.core.emit({ name: 'Authenticated', data: evt, sender: this });
    });
    this.registerDefinitions();
  }

  registerDefinitions(): void {
    // DEBUG: console.log("APISERVICE: Registering API Definitions");
    for (const def in this.apiDefinitions) {
      // DEBUG: console.log("def = " + def);
      this.core.register({ observerClass: this, eventName: def }).pipe(untilDestroyed(this)).subscribe(
        (evt: CoreEvent) => {
          // Process Event if CoreEvent is in the api definitions list
          // TODO: Proper type:
          const name = evt.name as keyof ApiService['apiDefinitions'];
          if (this.apiDefinitions[name]) {
            // DEBUG: console.log(evt);
            const apiDef = this.apiDefinitions[name];
            // DEBUG: console.log(apiDef)
            // let call = this.parseCoreEvent(evt);
            this.callWebsocket(evt, apiDef);
          }
        },
        () => {
          // DEBUG: console.log(err)
        },
      );
    }
  }

  async callWebsocket(evt: CoreEvent, def: ApiDefinition): Promise<void> {
    const cloneDef = { ...def };
    const asyncCalls = [
      'vm.start',
      'vm.delete',
    ];

    if (evt.data) {
      cloneDef.apiCall.args = evt.data;

      if (def.preProcessor && !asyncCalls.includes(def.apiCall.namespace)) {
        cloneDef.apiCall = def.preProcessor(def.apiCall);
      }

      // PreProcessor: ApiDefinition manipulates call to be sent out.
      if (def.preProcessor && asyncCalls.includes(def.apiCall.namespace)) {
        cloneDef.apiCall = await def.preProcessor(def.apiCall);
        if (!cloneDef.apiCall) {
          this.core.emit({ name: 'VmStopped', data: { id: evt.data[0] } });
          return;
        }
      }

      const call = cloneDef.apiCall;// this.parseEventWs(evt);
      this.ws.call(call.namespace, call.args).pipe(untilDestroyed(this)).subscribe((res) => {
        // PostProcess
        if (def.postProcessor) {
          res = def.postProcessor(res, evt.data, this.core);
        }
        // this.core.emit({name:call.responseEvent, data:res, sender: evt.data}); // OLD WAY
        if (call.responseEvent) {
          this.core.emit({ name: call.responseEvent, data: res, sender: this });
        }
      },
      (error) => {
        error.id = call.args;
        if (call.errorResponseEvent) {
          this.core.emit({ name: call.errorResponseEvent, data: error, sender: this });
        }
        this.core.emit({ name: call.responseEvent, data: error, sender: this });
      });
    } else {
      // PreProcessor: ApiDefinition manipulates call to be sent out.
      if (def.preProcessor) {
        cloneDef.apiCall = def.preProcessor(def.apiCall);
      }

      const call = cloneDef.apiCall;// this.parseEventWs(evt);
      this.ws.call(call.namespace, call.args || []).pipe(untilDestroyed(this)).subscribe((res) => {
        // PostProcess
        if (def.postProcessor) {
          res = def.postProcessor(res, evt.data, this.core);
        }

        if (call.responseEvent) {
          this.core.emit({ name: call.responseEvent, data: res, sender: this });
        }
      }, (error) => {
        console.error(error);
      });
    }
  }
}
