import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { helptext_sharing_iscsi } from 'app/helptext/sharing';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService, IscsiService } from 'app/services';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-iscsi-fibre-channel-port',
  templateUrl: './fibre-channel-port.component.html',
  styleUrls: ['./fibre-channel-port.component.scss', '../../../../common/entity/entity-form/entity-form.component.scss'],
  providers: [IscsiService],
})
export class FibreChannelPortComponent implements OnInit {
  @Input() config: any;
  @Input() parent: any;

  fieldSets: FieldSet[] = [
    {
      name: '',
      class: '',
      label: true,
      width: '50%',
      config: [
        {
          type: 'radio',
          name: 'mode',
          placeholder: helptext_sharing_iscsi.fc_mode_placeholder,
          tooltip: helptext_sharing_iscsi.fc_mode_tooltip,
          options: [
            {
              label: 'Initiator',
              value: 'INITIATOR',
            },
            {
              label: 'Target',
              value: 'TARGET',
            },
            {
              label: 'Disabled',
              value: 'DISABLED',
            },
          ],
        },
      ],
    },
    {
      name: '',
      class: '',
      label: true,
      width: '50%',
      config: [
        {
          type: 'select',
          name: 'target',
          placeholder: helptext_sharing_iscsi.fc_target_placeholder,
          tooltip: helptext_sharing_iscsi.fc_target_tooltip,
          options: [{
            label: '---------',
            value: null,
          }],
          value: null,
        },
        {
          type: 'textarea',
          name: 'initiators',
          placeholder: helptext_sharing_iscsi.fc_initiators_placeholder,
          tooltip: helptext_sharing_iscsi.fc_initiators_tooltip,
        },
      ],
    },
  ];
  fieldConfig: FieldConfig[] = [];
  formGroup: FormGroup;

  constructor(
    private ws: WebSocketService,
    private entityFormService: EntityFormService,
    private iscsiService: IscsiService,
  ) {
    const targetField = _.find(this.fieldSets[1].config, { name: 'target' });
    this.iscsiService.getTargets().pipe(untilDestroyed(this)).subscribe((targets) => {
      for (let i = 0; i < targets.length; i++) {
        targetField.options.push({
          label: targets[i].name,
          value: targets[i].id,
        });
      }
    },
    (err) => {
      new EntityUtils().handleWSError(this, err, this.parent.dialogService);
    });
  }

  ngOnInit(): void {
    for (let i = 0; i < this.fieldSets.length; i++) {
      const fieldset = this.fieldSets[i];
      if (fieldset.config) {
        this.fieldConfig = this.fieldConfig.concat(fieldset.config);
      }
    }
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);

    const targetField = _.find(this.fieldConfig, { name: 'target' });
    this.formGroup.controls['mode'].valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      targetField.required = res == 'TARGET';
      if (res == 'TARGET') {
        this.formGroup.controls['target'].setValidators([Validators.required]);
        this.formGroup.controls['target'].updateValueAndValidity();
      } else {
        this.formGroup.controls['target'].clearValidators();
        this.formGroup.controls['target'].updateValueAndValidity();
      }
    });
    for (const i in this.config) {
      if (this.formGroup.controls[i]) {
        this.formGroup.controls[i].setValue(this.config[i]);
      }
    }
  }

  isShow(field: string): boolean {
    if (field === 'target' || field == 'initiators') {
      return this.formGroup.controls['mode'].value == 'TARGET';
    }
    return true;
  }

  onSubmit(): void {
    const value = _.cloneDeep(this.formGroup.value);
    delete value['initiators'];

    if (value['mode'] != 'TARGET') {
      value['target'] = null;
    }
    this.parent.loader.open();
    this.ws.call('fcport.update', [this.config.id, value]).pipe(untilDestroyed(this)).subscribe(
      () => {
        this.parent.loader.close();
        this.parent.dialogService.Info(T('Updated'), T('Fibre Channel Port ') + this.config.name + ' update successful.');
      },
      (err) => {
        this.parent.loader.close();
        this.parent.dialogService.errorReport(err.trace.class, err.reason, err.trace.formatted);
      },
    );
  }
}
