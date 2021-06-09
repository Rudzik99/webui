import {
  Component, OnInit,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { Field } from 'app/pages/common/entity/entity-form/models/field.interface';

@Component({
  selector: 'form-colorpicker',
  templateUrl: './form-colorpicker.component.html',
  styleUrls: ['./form-colorpicker.component.scss'],
})
export class FormColorpickerComponent implements Field, OnInit {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  picker = false;
  private _textInput = '';

  get textInput(): string {
    return this._textInput;
  }

  set textInput(val: string) {
    this._textInput = val;
  }

  get colorProxy(): string {
    return this.group.value[this.config.name];
  }

  set colorProxy(val: string) {
    this.group.controls[this.config.name].setValue(val);
  }

  ngOnInit(): void {
    this.config.value = this.group.value[this.config.name];
  }

  cpListener(evt: string, data: any): void {
    this.group.value[this.config.name] = data;
  }

  inputListener(evt: string, data: any): void {
    this.group.value[this.config.name] = data;
  }

  togglePicker(): void {
    this.picker = !this.picker;
  }
}
