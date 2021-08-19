import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { helptext_sharing_iscsi } from 'app/helptext/sharing';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import {
  IscsiService, WebSocketService, AppLoaderService, ModalService,
} from 'app/services';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-iscsi-target-form',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [IscsiService],
})
export class TargetFormComponent implements FormConfiguration {
  queryCall: 'iscsi.target.query' = 'iscsi.target.query';
  addCall: 'iscsi.target.create' = 'iscsi.target.create';
  editCall: 'iscsi.target.update' = 'iscsi.target.update';
  customFilter: any[] = [[['id', '=']]];
  isEntity = true;

  fieldSets: FieldSet[] = [
    {
      name: helptext_sharing_iscsi.fieldset_target_basic,
      label: true,
      class: 'basic',
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'name',
          placeholder: helptext_sharing_iscsi.target_form_placeholder_name,
          tooltip: helptext_sharing_iscsi.target_form_tooltip_name,
          required: true,
          validation: helptext_sharing_iscsi.target_form_validators_name,
        },
        {
          type: 'input',
          name: 'alias',
          placeholder: helptext_sharing_iscsi.target_form_placeholder_alias,
          tooltip: helptext_sharing_iscsi.target_form_tooltip_alias,
        },
        {
          type: 'select',
          name: 'mode',
          placeholder: helptext_sharing_iscsi.target_form_placeholder_mode,
          tooltip: helptext_sharing_iscsi.target_form_tooltip_mode,
          options: [
            {
              label: 'iSCSI',
              value: 'ISCSI',
            },
            {
              label: 'Fibre Channel',
              value: 'FC',
            },
            {
              label: 'Both',
              value: 'BOTH',
            },
          ],
          value: 'ISCSI',
          isHidden: true,
        },
      ],
    },
    {
      name: helptext_sharing_iscsi.fieldset_target_group,
      label: true,
      class: 'group',
      width: '100%',
      config: [
        {
          type: 'list',
          name: 'groups',
          width: '100%',
          templateListField: [
            {
              type: 'select',
              name: 'portal',
              placeholder: helptext_sharing_iscsi.target_form_placeholder_portal,
              tooltip: helptext_sharing_iscsi.target_form_tooltip_portal,
              value: '',
              options: [],
              required: true,
              validation: helptext_sharing_iscsi.target_form_validators_portal,
              class: 'inline',
              width: '50%',
            },
            {
              type: 'select',
              name: 'initiator',
              placeholder: helptext_sharing_iscsi.target_form_placeholder_initiator,
              tooltip: helptext_sharing_iscsi.target_form_tooltip_initiator,
              value: null,
              options: [],
              class: 'inline',
              width: '50%',
            },
            {
              type: 'select',
              name: 'authmethod',
              placeholder: helptext_sharing_iscsi.target_form_placeholder_authmethod,
              tooltip: helptext_sharing_iscsi.target_form_tooltip_authmethod,
              value: 'NONE',
              options: [
                {
                  label: 'None',
                  value: 'NONE',
                },
                {
                  label: 'CHAP',
                  value: 'CHAP',
                },
                {
                  label: 'Mutual CHAP',
                  value: 'CHAP_MUTUAL',
                },
              ],
              class: 'inline',
              width: '50%',
            },
            {
              type: 'select',
              name: 'auth',
              placeholder: helptext_sharing_iscsi.target_form_placeholder_auth,
              tooltip: helptext_sharing_iscsi.target_form_tooltip_auth,
              value: null,
              options: [],
              class: 'inline',
              width: '50%',
            },
          ],
          listFields: [],
        },
      ],
    },
  ];
  fieldConfig: FieldConfig[];
  title = T('Add ISCSI Target');
  pk: any;
  protected entityForm: EntityFormComponent;
  constructor(protected router: Router,
    protected aroute: ActivatedRoute,
    protected iscsiService: IscsiService,
    protected loader: AppLoaderService,
    public translate: TranslateService,
    protected ws: WebSocketService,
    private modalService: ModalService) {
    this.modalService.getRow$.pipe(untilDestroyed(this)).subscribe((rowId: string) => {
      this.customFilter = [[['id', '=', rowId]]];
      this.pk = rowId;
    });
    const basicFieldset = _.find(this.fieldSets, { class: 'basic' });
    this.ws.call('system.info').pipe(untilDestroyed(this)).subscribe(
      (systemInfo) => {
        if (systemInfo.license && systemInfo.license.features.indexOf(LicenseFeature.FibreChannel) > -1) {
          _.find(basicFieldset.config, { name: 'mode' }).isHidden = false;
        }
      },
    );
  }

  async prerequisite(): Promise<boolean> {
    const targetGroupFieldset = _.find(this.fieldSets, { class: 'group' });
    const portalGroupField = _.find(targetGroupFieldset.config, { name: 'groups' }).templateListField[0];
    const initiatorGroupField = _.find(targetGroupFieldset.config, { name: 'groups' }).templateListField[1];
    const authGroupField = _.find(targetGroupFieldset.config, { name: 'groups' }).templateListField[3];
    const promise1 = new Promise((resolve) => {
      this.iscsiService.listPortals().toPromise().then(
        (portals) => {
          for (let i = 0; i < portals.length; i++) {
            let label = String(portals[i].tag);
            if (portals[i].comment) {
              label += ' (' + portals[i].comment + ')';
            }
            portalGroupField.options.push({ label, value: portals[i].id });
          }
          resolve(true);
        },
        () => {
          resolve(false);
        },
      );
    });
    const promise2 = new Promise((resolve) => {
      this.iscsiService.listInitiators().toPromise().then(
        (initiatorsRes) => {
          initiatorGroupField.options.push({ label: 'None', value: null });
          for (let i = 0; i < initiatorsRes.length; i++) {
            const optionLabel = initiatorsRes[i].id
              + ' ('
              + (initiatorsRes[i].initiators.length === 0 ? 'ALL Initiators Allowed' : initiatorsRes[i].initiators.toString())
              + ')';
            initiatorGroupField.options.push({ label: optionLabel, value: initiatorsRes[i].id });
          }
          resolve(true);
        },
        () => {
          resolve(false);
        },
      );
    });
    const promise3 = new Promise((resolve) => {
      this.iscsiService.getAuth().toPromise().then(
        (accessRecords) => {
          const tags = _.uniq(accessRecords.map((item) => item.tag));
          authGroupField.options.push({ label: 'None', value: null });
          for (const tag of tags) {
            authGroupField.options.push({ label: tag, value: tag });
          }
          resolve(true);
        },
        () => {
          resolve(false);
        },
      );
    });

    return Promise.all([promise1, promise2, promise3]).then(
      () => true,
    );
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.fieldConfig = entityForm.fieldConfig;
    this.title = entityForm.isNew ? T('Add ISCSI Target') : T('Edit ISCSI Target');
  }

  customEditCall(value: any): void {
    this.loader.open();
    this.ws.call(this.editCall, [this.pk, value]).pipe(untilDestroyed(this)).subscribe(
      () => {
        this.loader.close();
        this.modalService.close('slide-in-form');
      },
      (res) => {
        this.loader.close();
        new EntityUtils().handleWSError(this.entityForm, res);
      },
    );
  }

  afterSubmit(): void {
    this.modalService.close('slide-in-form');
  }
}
