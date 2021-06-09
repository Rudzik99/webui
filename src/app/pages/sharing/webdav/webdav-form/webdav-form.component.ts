import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptext_sharing_webdav, shared } from 'app/helptext/sharing';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-user-form',
  template: '<entity-form [conf]="this"></entity-form>',
})

export class WebdavFormComponent implements FormConfiguration {
  queryCall: 'sharing.webdav.query' = 'sharing.webdav.query';
  queryKey = 'id';
  addCall: 'sharing.webdav.create' = 'sharing.webdav.create';
  editCall: 'sharing.webdav.update' = 'sharing.webdav.update';
  isEntity = true;
  title = T('Add WebDAV');
  confirmSubmit = true;
  confirmSubmitDialog = {
    title: helptext_sharing_webdav.warning_dialog_title,
    message: helptext_sharing_webdav.warning_dialog_message,
    hideCheckbox: false,
  };

  fieldConfig: FieldConfig[] = [];
  fieldSetDisplay = 'default';
  fieldSets: FieldSet[] = [
    {
      name: helptext_sharing_webdav.fieldset_name,
      class: 'webdav-configuration-form',
      label: true,
      config: [
        {
          type: 'input',
          name: 'name',
          placeholder: helptext_sharing_webdav.placeholder_name,
          tooltip: helptext_sharing_webdav.tooltip_name,
          required: true,
          validation: helptext_sharing_webdav.validator_name,
        },
        {
          type: 'input',
          name: 'comment',
          placeholder: helptext_sharing_webdav.placeholder_comment,
          tooltip: helptext_sharing_webdav.tooltip_comment,
        },
        {
          type: 'explorer',
          initial: '/mnt',
          name: 'path',
          explorerType: 'directory',
          placeholder: helptext_sharing_webdav.placeholder_path,
          tooltip: helptext_sharing_webdav.tooltip_path,
          required: true,
          validation: helptext_sharing_webdav.validator_path,
        },
        {
          type: 'checkbox',
          name: 'ro',
          placeholder: helptext_sharing_webdav.placeholder_ro,
          tooltip: helptext_sharing_webdav.tooltip_ro,
        },
        {
          type: 'checkbox',
          name: 'perm',
          value: true,
          placeholder: helptext_sharing_webdav.placeholder_perm,
          tooltip: helptext_sharing_webdav.tooltip_perm,
        },
        {
          type: 'checkbox',
          name: 'enabled',
          value: true,
          placeholder: helptext_sharing_webdav.placeholder_enabled,
          tooltip: helptext_sharing_webdav.tooltip_enabled,
        },
      ],
    }];

  constructor(
    protected router: Router,
    protected ws: WebSocketService,
    private dialog: DialogService,
    private loader: AppLoaderService,
  ) {}

  afterInit(entityForm: EntityFormComponent): void {
    entityForm.formGroup.controls['perm'].valueChanges.pipe(untilDestroyed(this)).subscribe((value: any) => {
      value ? this.confirmSubmit = true : this.confirmSubmit = false;
    });
    this.title = entityForm.isNew ? T('Add WebDAV') : T('Edit WebDAV');
  }

  afterSave(): void {
    this.ws.call('service.query', [[]]).pipe(untilDestroyed(this)).subscribe((res) => {
      const service = _.find(res, { service: ServiceName.WebDav });
      if (!service.enable) {
        this.dialog.confirm(shared.dialog_title, shared.dialog_message,
          true, shared.dialog_button).pipe(untilDestroyed(this)).subscribe((dialogRes: boolean) => {
          if (dialogRes) {
            this.loader.open();
            this.ws.call('service.update', [service.id, { enable: true }]).pipe(untilDestroyed(this)).subscribe(() => {
              this.ws.call('service.start', [service.service]).pipe(untilDestroyed(this)).subscribe(() => {
                this.loader.close();
                this.dialog.Info(T('WebDAV') + shared.dialog_started_title, T('The WebDAV') + shared.dialog_started_message, '250px')
                  .pipe(untilDestroyed(this)).subscribe(() => {});
              }, (err) => {
                this.loader.close();
                this.dialog.errorReport(err.error, err.reason, err.trace.formatted);
              });
            }, (err) => {
              this.loader.close();
              this.dialog.errorReport(err.error, err.reason, err.trace.formatted);
            });
          }
        });
      }
    });
  }
}
