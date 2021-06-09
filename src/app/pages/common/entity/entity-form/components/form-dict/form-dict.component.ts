import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { Field } from 'app/pages/common/entity/entity-form/models/field.interface';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { FieldRelationService } from 'app/pages/common/entity/entity-form/services/field-relation.service';

@Component({
  selector: 'entity-form-dict',
  templateUrl: './form-dict.component.html',
  styleUrls: ['../dynamic-field/dynamic-field.scss'],
})
export class FormDictComponent implements Field, OnInit {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;

  dictFormGroup: FormGroup;

  constructor(private entityFormService: EntityFormService, protected fieldRelationService: FieldRelationService) {}

  ngOnInit(): void {
    this.dictFormGroup = this.group.controls[this.config.name] as FormGroup;
  }
}
