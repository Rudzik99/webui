import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { RestService, WebSocketService, NetworkService, StorageService, SystemGeneralService } from '../../../services';
import { PreferencesService} from 'app/core/services/preferences.service';
import { FormGroup, Validators, ValidationErrors, FormControl } from '@angular/forms';
import { Wizard } from '../../common/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from '../../common/entity/entity-wizard/entity-wizard.component';
import { MessageService } from '../../common/entity/entity-form/services/message.service';
import { ModalService } from 'app/services/modal.service';
import * as _ from 'lodash';

import { VmService } from '../../../services/vm.service';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { MatDialog } from '@angular/material/dialog';
import { T } from '../../../translate-marker';
import { DialogService } from '../../../services/dialog.service';
import helptext from '../../../helptext/vm/vm-wizard/vm-wizard';
import add_edit_helptext from '../../../helptext/vm/devices/device-add-edit';
import { catchError, filter, map } from 'rxjs/operators';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { forbiddenValues } from 'app/pages/common/entity/entity-form/validators/forbidden-values-validation';
import globalHelptext from './../../../helptext/global-helptext';
import { combineLatest, forkJoin, Observable } from 'rxjs';
import { Formconfiguration } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { MatStepper } from '@angular/material/stepper';

@Component({
  selector: 'app-vm-wizard',
  template: '<entity-wizard [conf]="this"></entity-wizard>',
  providers : [ VmService ]
})
export class VMWizardComponent {

  protected addWsCall = 'vm.create';
  public summary = {};
  isLinear = true;
  firstFormGroup: FormGroup;
  protected dialogRef: any;
  objectKeys = Object.keys;
  summaryTitle = T("VM Summary");
  public namesInUse = [];
  public statSize: any;
  public displayPort: number;
  public vcpus: number = 1;
  public cores: number = 1;
  public threads: number = 1;
  public mode: string;
  public model: string | null;
  private currentStep = 0;
  public title = helptext.formTitle;
  public hideCancel = true;
  private maxVCPUs = 16;
  private gpus: any;

  entityWizard: EntityWizardComponent;
  public res: any;
  private productType: string = window.localStorage.getItem('product_type');

  protected wizardConfig: Wizard[] = [
    {
      label: helptext.os_label,
      fieldConfig: [
        {
          type: 'select',
          name: 'os',
          required: true,
          placeholder: helptext.os_placeholder,
          tooltip: helptext.os_tooltip,
          options: helptext.os_options,
          validation : helptext.os_validation,
        },
      { type: 'input',
        name : 'name',
        placeholder : helptext.name_placeholder,
        tooltip : helptext.name_tooltip,
        validation : [Validators.required,Validators.pattern('^[a-zA-Z0-9\_]*$'), forbiddenValues(this.namesInUse)],
        required: true
      },
      { type: 'input',
        name : 'description',
        placeholder : helptext.description_placeholder,
        tooltip : helptext.description_tooltip,
      },
      {
        name: 'time',
        type: 'select',
        placeholder: helptext.time_placeholder,
        tooltip: helptext.time_tooltip,
        validation: [Validators.required],
        required: true,
        value: 'LOCAL',
        options: [{ label: helptext.time_local_text, value: 'LOCAL' }, { label: 'UTC', value: 'UTC' }]
      },
      { type: 'select',
        name : 'bootloader',
        placeholder : helptext.bootloader_placeholder,
        tooltip : helptext.bootloader_tooltip,
        options: []
      },
      { type: 'input',
        name : 'shutdown_timeout',
        inputType: 'number',
        value: 90,
        placeholder : helptext.shutdown_timeout.placeholder,
        tooltip : helptext.shutdown_timeout.tooltip,
        validation: helptext.shutdown_timeout.validation
      },
      { type: 'checkbox',
        name : 'autostart',
        placeholder : helptext.autostart_placeholder,
        tooltip : helptext.autostart_tooltip,
        value: true
      },
      {
        type: 'checkbox',
        name : 'enable_display',
        placeholder : helptext.enable_display_placeholder,
        tooltip : helptext.enable_display_tooltip,
        value: true,
        isHidden: false
      },
      {
        name : 'wait',
        placeholder : add_edit_helptext.wait_placeholder,
        tooltip : add_edit_helptext.wait_tooltip,
        type: 'checkbox',
        value: false
      },
      {
        type: 'select',
        name : 'display_type',
        placeholder : T("Display Type"),
        options: [{label: 'VNC', value: 'VNC'}, {label: 'SPICE', value: 'SPICE'}],
        required: true,
        value: "VNC",
        validation: [Validators.required],
      },
      {
        type: 'select',
        name : 'bind',
        placeholder : helptext.display_bind_placeholder,
        tooltip : helptext.display_bind_tooltip,
        options: [],
        required: true,
        validation: [Validators.required],
      },
      ]
    },
    {
      label: helptext.vcpus_label,
      fieldConfig: [
        {
          type: 'paragraph',
          name: 'vcpu_limit',
          paraText: ''
        },
        {
          type: 'input',
          name: 'vcpus',
          placeholder: helptext.vcpus_placeholder,
          inputType: 'number',
          min: 1,
          required: true,
          validation : [ this.cpuValidator('threads'), Validators.required, Validators.min(1) ],
          tooltip: helptext.vcpus_tooltip,
        },
        {
          type: 'input',
          name: 'cores',
          placeholder: helptext.cores.placeholder,
          inputType: 'number',
          required: true,
          validation : [ this.cpuValidator('threads'), Validators.required, Validators.min(1) ],
          tooltip: helptext.cores.tooltip
        },
        {
          type: 'input',
          name: 'threads',
          placeholder: helptext.threads.placeholder,
          inputType: 'number',
          required: true,
          validation : [ 
            this.cpuValidator('threads'),
            Validators.required, 
            Validators.min(1)
          ],
          tooltip: helptext.threads.tooltip,
        },
        {
          type: 'select',
          name: 'cpu_mode',
          placeholder: helptext.cpu_mode.placeholder,
          tooltip: helptext.cpu_mode.tooltip,
          options: helptext.cpu_mode.options,
          isHidden: true,
          value: helptext.cpu_mode.options[0].value
        },
        {
          type: 'select',
          name: 'cpu_model',
          placeholder: helptext.cpu_model.placeholder,
          tooltip: helptext.cpu_model.tooltip,
          options: [
            { label: '---', value: ''}
          ],
          value: '',
          isHidden: true
        },
        {
          type: 'input',
          name: 'memory',
          placeholder: helptext.memory_placeholder,
          inputType: 'text',
          validation : [
            ...helptext.memory_validation,
            this.memoryValidator('memory'),
            (control: FormControl): ValidationErrors => {
              const config = this.wizardConfig.find(c => c.label === helptext.vcpus_label).fieldConfig.find(c => c.name === 'memory');
              const errors = control.value && isNaN(this.storageService.convertHumanStringToNum(control.value))
                ? { invalid_byte_string: true }
                : null

              if (errors) {
                config.hasErrors = true;
                config.errors = globalHelptext.human_readable.input_error;
              } else {
                config.hasErrors = false;
                config.errors = '';
              }

              return errors;
            }
          ],
          value: '',
          required: true,
          blurStatus: true,
          blurEvent: this.blurEventForMemory,
          parent: this,
          tooltip: helptext.memory_tooltip,
        },
        {
          type: 'paragraph',
          name: 'memory_warning',
          paraText: helptext.memory_warning
        }
      ]
    },
    {
      label: helptext.disks_label,
      fieldConfig: [
        {
          type: 'radio',
          name: 'disk_radio',
          options: [
            {
              label: helptext.disk_radio_options_new_label, 
              value: true,
              tooltip: helptext.disk_radio_tooltip
            },
            {
              label: helptext.disk_radio_options_existing_label, 
              value: false
            }
          ],          
          value: true,
        },
        {
          type: 'select',
          name: 'hdd_type',
          placeholder: helptext.hdd_type_placeholder,
          tooltip: helptext.hdd_type_tooltip,
          options : helptext.hdd_type_options,
          value: helptext.hdd_type_value
        },
        {
          type: 'select',
          name: 'datastore',
          tooltip: helptext.datastore_tooltip,
          placeholder: helptext.datastore_placeholder,
          blurStatus: true,
          blurEvent: this.blueEventForVolSize,
          options: [],
          isHidden: false,
          validation: [Validators.required],
          required: true
        },
        {
          type: 'input',
          name: 'volsize',
          inputType: 'text',
          placeholder : helptext.volsize_placeholder,
          tooltip: helptext.volsize_tooltip,
          isHidden: false,
          blurStatus: true,
          blurEvent: this.blueEventForVolSize,
          parent: this,
          validation : [
            ...helptext.volsize_validation,
            this.volSizeValidator('volsize'),
            (control: FormControl): ValidationErrors => {
              const config = this.wizardConfig.find(c => c.label === helptext.disks_label).fieldConfig.find(c => c.name === 'volsize');
              const errors = control.value && isNaN(this.storageService.convertHumanStringToNum(control.value, false, 'mgtp'))
                ? { invalid_byte_string: true }
                : null

              if (errors) {
                config.hasErrors = true;
                config.errors = globalHelptext.human_readable.input_error;
              } else {
                config.hasErrors = false;
                config.errors = '';
              }

              return errors;
            }
          ],
          relation : [
            {
              action : 'DISABLE',
              when : [ {
                name : 'datastore',
                value : undefined,
              } ]
            },
          ],
          required: true
        },
        {
          type: 'select',
          name: 'hdd_path',
          placeholder: helptext.hdd_path_placeholder,
          tooltip: helptext.hdd_path_tooltip,
          isHidden: true,
          options:[]
        },
      ]
    },
    {
      label: helptext.NIC_label,
      fieldConfig: [
        {
          name : 'NIC_type',
          placeholder : helptext.NIC_type_placeholder,
          tooltip : helptext.NIC_type_tooltip,
          type: 'select',
          options : [],
          validation : helptext.NIC_type_validation,
          required: true,
        },
        {
          name : 'NIC_mac',
          placeholder : helptext.NIC_mac_placeholder,
          tooltip : helptext.NIC_mac_tooltip,
          type: 'input',
          value : helptext.NIC_mac_value,
          validation : helptext.NIC_mac_validation,
        },
        {
          name : 'nic_attach',
          placeholder : helptext.nic_attach_placeholder,
          tooltip : helptext.nic_attach_tooltip,
          type: 'select',
          options : [],
          validation : helptext.nic_attach_validation,
          required: true,
        },
      ]
    },
    {
      label: helptext.media_label,
      fieldConfig: [
        {
          type: 'explorer',
          name: 'iso_path',
          placeholder : helptext.iso_path_placeholder,
          initial: '/mnt',
          tooltip: helptext.iso_path_tooltip,
        },
        {
          type: 'checkbox',
          name: 'upload_iso_checkbox',
          placeholder : helptext.upload_iso_checkbox_placeholder,
          tooltip: helptext.upload_iso_checkbox_tooltip,
          value: false,
        },
        {
          type: 'explorer',
          name: 'upload_iso_path',
          placeholder : helptext.upload_iso_path_placeholder,
          initial: '/mnt',
          tooltip: helptext.upload_iso_path_tooltip,
          explorerType: 'directory',
          isHidden: true,
        },
        {
          type: 'upload',
          name: 'upload_iso',
          placeholder : helptext.upload_iso_placeholder,
          tooltip: helptext.upload_iso_tooltip,
          isHidden: true,
          acceptedFiles: '.img,.iso',
          fileLocation: '',
          validation : helptext.upload_iso_validation,
          message: this.messageService
        },
      ]
    },
    {
      label: T("GPU"),
      fieldConfig: [
        {
          type: 'checkbox',
          name: 'hide_from_msr',
          placeholder: T('Hide from MSR'),
          value: false
        },
        {
          type: 'select',
          placeholder: T("Isolated GPU PCI Id's"),
          name: 'isolated_gpu_pci_ids',
          multiple: true,
          options: []
        },
        {
          type: 'select',
          placeholder: T("GPU"),
          name: 'gpu',
          options: [],
          required: true
        }
      ]
    }
  ]

  protected releaseField: any;
  protected currentServerVersion: any;
  private nicAttach: any;
  private nicType:  any;
  private bootloader: any;

  constructor(protected rest: RestService, protected ws: WebSocketService,
    public vmService: VmService, public networkService: NetworkService,
    protected loader: AppLoaderService, protected dialog: MatDialog,
    public messageService: MessageService,
    private dialogService: DialogService, private storageService: StorageService,
    protected prefService: PreferencesService, private translate: TranslateService,
    protected modalService: ModalService, private systemGeneralService: SystemGeneralService) {

  }

  preInit(entityWizard: EntityWizardComponent){
    this.entityWizard = entityWizard;
    this.ws.call('vm.maximum_supported_vcpus').subscribe(max => {
      this.maxVCPUs = max;
      const vcpuLimitConf = _.find(this.wizardConfig[1].fieldConfig, {'name' : 'vcpu_limit'});
      vcpuLimitConf.paraText = helptext.vcpus_warning + ` ${this.maxVCPUs} ` + helptext.vcpus_warning_b;
    })

    this.ws.call("device.gpu_pci_ids_choices").subscribe((pci_choices: Object) => {
      const isolatedGpuPciIdsConf = _.find(this.wizardConfig[5].fieldConfig, {name : "isolated_gpu_pci_ids"});
      for(let key in pci_choices) {
        isolatedGpuPciIdsConf.options.push({label: key, value: pci_choices[key]})
      }
    })

    this.ws.call("device.get_gpus").subscribe((gpus) => {
      this.gpus = gpus;
      const gpu = _.find(this.wizardConfig[5].fieldConfig, {name : "gpu"});
      for(let item of gpus) {
        gpu.options.push({label: item.description, value: item.addr.pci_slot})
      }
    })

    this.systemGeneralService.getAdvancedConfig.subscribe((res) => {
      this.getFormControlFromFieldName('isolated_gpu_pci_ids').setValue(res.isolated_gpu_pci_ids)
    });

  }

  customNext(stepper: MatStepper) {
    stepper.next();
    this.currentStep = stepper.selectedIndex;
    if (this.currentStep === 2) {
      this.setValuesFromPref(2, 'datastore', 'vm_zvolLocation');
    }
    if (this.currentStep === 3) {
      this.setValuesFromPref(3, 'NIC_type', 'vm_nicType', 0);
      this.setValuesFromPref(3, 'nic_attach', 'vm_nicAttach', 0);
    }
  }

  setValuesFromPref(stepNumber: number, fieldName: string, prefName: string, defaultIndex?: number) {
    const field = this.getFormControlFromFieldName(fieldName);
    const options = _.find(this.wizardConfig[stepNumber].fieldConfig, {name : fieldName}).options; 
    const storedValue = this.prefService.preferences.storedValues[prefName];
    if (storedValue) {
      const valueToSet = options.find(o => o.value === storedValue);
      if (valueToSet) { 
        field.setValue(valueToSet.value)
      }
      else if (defaultIndex) {
        field.setValue(options[defaultIndex].value)
      }
    } else {
      field.setValue(options[defaultIndex].value)
    }
  }

  afterInit(entityWizard: EntityWizardComponent) {
    this.ws.call('vm.query').subscribe((res) => {
      res.forEach(i => this.namesInUse.push(i.name));
    })

    this.ws.call('vm.device.bind_choices').subscribe((res) => {
        if(res && Object.keys(res).length > 0) {
        const bind = _.find(this.wizardConfig[0].fieldConfig, {'name' : 'bind'});
        Object.keys(res).forEach((address) => {
          bind.options.push({label : address, value : address});
        });
        this.getFormControlFromFieldName('bind').setValue(res['0.0.0.0']);
      }
    });

    if (this.productType === 'SCALE' || this.productType === 'SCALE_ENTERPRISE') {
      _.find(this.wizardConfig[0].fieldConfig, {name : 'wait'})['isHidden'] = true;
      _.find(this.wizardConfig[1].fieldConfig, {name : 'cpu_mode'})['isHidden'] = false;
      const cpuModel = _.find(this.wizardConfig[1].fieldConfig, {name : 'cpu_model'});
      cpuModel.isHidden = false;

      this.vmService.getCPUModels().subscribe(models => {
        for (let model in models) {
          cpuModel.options.push(
            {
              label : model, value : model
            }
          );
        };
      });
    }

    this.ws
      .call("pool.filesystem_choices", [["FILESYSTEM"]])
      .pipe(map(new EntityUtils().array1DToLabelValuePair))
      .subscribe(options => {
        this.wizardConfig[2].fieldConfig.find(config => config.name === "datastore").options = options;
      });

    this.ws.call("pool.dataset.query",[[["type", "=", "VOLUME"]]]).subscribe((zvols)=>{
      zvols.forEach(zvol => {
        _.find(this.wizardConfig[2].fieldConfig, {name : 'hdd_path'}).options.push(
          {
            label : zvol.id, value : zvol.id
          }
        );
      });
    });

    this.getFormControlFromFieldName('bootloader').valueChanges.subscribe((bootloader) => {
      if(!this.productType.includes('SCALE') && bootloader !== 'UEFI'){
        _.find(this.wizardConfig[0].fieldConfig, {name : 'enable_display'})['isHidden'] = true;
        _.find(this.wizardConfig[0].fieldConfig, {name : 'wait'})['isHidden'] = true;
        _.find(this.wizardConfig[0].fieldConfig, {name : 'bind'}).isHidden = true;
        _.find(this.wizardConfig[0].fieldConfig, {name : 'display_type'}).isHidden = true;
      } else {
        _.find(this.wizardConfig[0].fieldConfig, {name : 'enable_display'})['isHidden'] = false;
        _.find(this.wizardConfig[0].fieldConfig, {name : 'bind'}).isHidden = false;
        _.find(this.wizardConfig[0].fieldConfig, {name : 'display_type'}).isHidden = false;
        if (!this.productType.includes('SCALE')) {
          _.find(this.wizardConfig[0].fieldConfig, {name : 'wait'})['isHidden'] = false;
        }
      } 
    });

    this.getFormControlFromFieldName('enable_display').valueChanges.subscribe((res) => {
      if (!this.productType.includes('SCALE')) {
        _.find(this.wizardConfig[0].fieldConfig, {name : 'wait'}).isHidden = !res;   
      }
      _.find(this.wizardConfig[0].fieldConfig, {name : 'display_type'}).isHidden = !res;
      _.find(this.wizardConfig[0].fieldConfig, {name : 'bind'}).isHidden = !res;
      if (res) {
        this.ws.call('vm.port_wizard').subscribe(({port}) => {
          this.displayPort = port;
        })
        if (!this.productType.includes('SCALE')) {
          this.getFormControlFromFieldName('wait').enable();
        }
        this.getFormControlFromFieldName('bind').enable();
        this.getFormControlFromFieldName('display_type').enable();
      } else {
        this.getFormControlFromFieldName('wait').disable();
        this.getFormControlFromFieldName('display_type').disable();
        this.getFormControlFromFieldName('bind').disable();
      }
    });


    this.getFormControlFromFieldName('os').valueChanges.subscribe((res) => {
      this.summary[T('Guest Operating System')] = res;
      this.getFormControlFromFieldName('name').valueChanges.subscribe((name) => {
        this.summary[T('Name')] = name;
      });
      this.getFormControlFromFieldName('vcpus').valueChanges.subscribe((vcpus) => {
        this.vcpus = vcpus;
        this.summary[T('Number of CPUs')] = vcpus;
      });
      this.getFormControlFromFieldName('cores').valueChanges.subscribe((cores) => {
        this.cores = cores;
        this.summary[T('Number of Cores')] = cores;
      });
      this.getFormControlFromFieldName('threads').valueChanges.subscribe((threads) => {
        this.threads = threads;
        this.summary[T('Number of Threads')] = threads;
      });

      if (this.productType.includes('SCALE')) {
        this.getFormControlFromFieldName('cpu_mode').valueChanges.subscribe((mode) => {
          this.mode = mode;
          this.summary[T('CPU Mode')] = mode;
        });
        this.getFormControlFromFieldName('cpu_model').valueChanges.subscribe((model) => {
          this.model = model;
          this.summary[T('CPU Model')] = model !== '' ? model : 'null';
        });
      }

      this.getFormControlFromFieldName('memory').valueChanges.subscribe((memory) => {
        this.summary[T('Memory')] =
          isNaN(this.storageService.convertHumanStringToNum(memory))
            ? '0 MiB'
            : this.storageService.humanReadable;
      });

      this.getFormControlFromFieldName('volsize').valueChanges.subscribe((volsize) => {
        this.summary[T('Disk Size')] = volsize ;
      });

      this.getFormControlFromFieldName('disk_radio').valueChanges.subscribe((disk_radio)=>{
        if(this.summary[T('Disk')] || this.summary[T('Disk Size')]){
          delete this.summary[T('Disk')];
          delete this.summary[T('Disk Size')];
        }
        if(disk_radio) {
          this.summary[T('Disk Size')] = this.getFormControlFromFieldName('volsize').value;
          this.getFormControlFromFieldName('volsize').valueChanges.subscribe((volsize) => {
              this.summary[T('Disk Size')] = volsize;
            });
        } else {
          this.summary[T('Disk')] = this.getFormControlFromFieldName('hdd_path').value;
          this.getFormControlFromFieldName('hdd_path').valueChanges.subscribe((existing_hdd_path)=>{
              this.summary[T('Disk')] = existing_hdd_path;
            })
        }
      });

      const isolatedGpuPciIdsControl = this.getFormControlFromFieldName('isolated_gpu_pci_ids');
      isolatedGpuPciIdsControl.valueChanges.subscribe((isolatedPciIdsValue) => {
        const isolatedGpuPciIdsConf = _.find(this.wizardConfig[5].fieldConfig, {name : "isolated_gpu_pci_ids"});
        if(isolatedPciIdsValue.length >= isolatedGpuPciIdsConf.options.length) {
          isolatedGpuPciIdsConf.warnings = "A minimum of 2 GPUs are required in the host to ensure that host has at least 1 GPU available.";
          isolatedGpuPciIdsControl.setErrors({ maxPCIIds: true})
        } else if(isolatedPciIdsValue.length > 0) {
          isolatedGpuPciIdsConf.warnings = null;
          isolatedGpuPciIdsControl.setErrors(null);
        } else {
          isolatedGpuPciIdsConf.warnings = null;
          isolatedGpuPciIdsControl.setErrors(null);
          isolatedGpuPciIdsControl.setErrors({required: true});
        }
      });

      this.getFormControlFromFieldName('datastore').valueChanges.subscribe((datastore) => {
        if(datastore !== undefined && datastore !== "" && datastore !== "/mnt") {
          _.find(this.wizardConfig[2].fieldConfig, {'name' : 'datastore'}).hasErrors = false;
          _.find(this.wizardConfig[2].fieldConfig, {'name' : 'datastore'}).errors = null;
          const volsize = this.storageService.convertHumanStringToNum(this.getFormControlFromFieldName('volsize').value.toString());
          this.ws.call('filesystem.statfs',[`/mnt/${datastore}`]).subscribe((stat)=> {
            this.statSize = stat;
            _.find(this.wizardConfig[2].fieldConfig, {'name' : 'volsize'})['hasErrors'] = false;
            _.find(this.wizardConfig[2].fieldConfig, {'name' : 'volsize'})['errors'] = '';
            if (stat.free_bytes < volsize ) {
              this.getFormControlFromFieldName('volsize').setValue(Math.floor(stat.free_bytes / (1073741824)) + " GiB");
            } else if (stat.free_bytes > 40*1073741824) {
              const vmOs = this.getFormControlFromFieldName('os').value;
              if (vmOs === "Windows"){
                this.getFormControlFromFieldName('volsize').setValue(this.storageService.convertBytestoHumanReadable(volsize, 0));
              } else {
                this.getFormControlFromFieldName('volsize').setValue(this.storageService.convertBytestoHumanReadable(volsize, 0)); 
              };
            } else if (stat.free_bytes > 10*1073741824) {
              this.getFormControlFromFieldName('volsize').setValue((this.storageService.convertBytestoHumanReadable(volsize, 0))); 
            }
          });
        } else {
          if(datastore === '/mnt'){
            this.getFormControlFromFieldName('datastore').setValue(null);
            _.find(this.wizardConfig[2].fieldConfig, {'name' : 'datastore'}).hasErrors = true;
            _.find(this.wizardConfig[2].fieldConfig, {'name' : 'datastore'}).errors = T(`Virtual machines cannot be stored in an unmounted mountpoint: ${datastore}`);
          }
          if(datastore === ''){
            this.getFormControlFromFieldName('datastore').setValue(null);
            _.find(this.wizardConfig[2].fieldConfig, {'name' : 'datastore'}).hasErrors = true;
            _.find(this.wizardConfig[2].fieldConfig, {'name' : 'datastore'}).errors = T(`Please select a valid path`);
          }
        }
        this.getFormControlFromFieldName('NIC_type').valueChanges.subscribe((res) => {
          this.prefService.preferences.storedValues.vm_nicType = res;
          this.prefService.savePreferences();
        });

        this.prefService.preferences.storedValues.vm_zvolLocation = this.getFormControlFromFieldName('datastore').value;
        this.prefService.savePreferences();

      });
      this.getFormControlFromFieldName('iso_path').valueChanges.subscribe((iso_path) => {
        if (iso_path && iso_path !== undefined){
          this.summary[T('Installation Media')] = iso_path;
        } else {
          delete this.summary[T('Installation Media')];
        }
        
      });
      this.messageService.messageSourceHasNewMessage$.subscribe((message)=>{
        this.getFormControlFromFieldName('iso_path').setValue(message);
      })
      this.res = res;
      const grub = this.bootloader.options.find(o => o.value === 'GRUB');
      const grubIndex = this.bootloader.options.indexOf(grub);
      if (res === 'Windows') {
        if (grub) {
          this.bootloader.options.splice(grubIndex, 1);
        }
        this.getFormControlFromFieldName('vcpus').setValue(2);
        this.getFormControlFromFieldName('cores').setValue(1);
        this.getFormControlFromFieldName('threads').setValue(1);
        this.getFormControlFromFieldName('memory').setValue('4 GiB');
        this.getFormControlFromFieldName('volsize').setValue('40 GiB');
      }
      else {
        if (!grub && !this.productType.includes('SCALE')) {
          this.bootloader.options.push({label : 'Grub bhyve (specify grub.cfg)', value : 'GRUB'});
        }
        this.getFormControlFromFieldName('vcpus').setValue(1);
        this.getFormControlFromFieldName('cores').setValue(1);
        this.getFormControlFromFieldName('threads').setValue(1);
        this.getFormControlFromFieldName('memory').setValue('512 MiB');
        this.getFormControlFromFieldName('volsize').setValue('10 GiB');
      }
    });
    this.getFormControlFromFieldName('disk_radio').valueChanges.subscribe((res) => {
      if (res){
        _.find(this.wizardConfig[2].fieldConfig, {name : 'volsize'}).isHidden = false;
        _.find(this.wizardConfig[2].fieldConfig, {name : 'datastore'}).isHidden = false;
        _.find(this.wizardConfig[2].fieldConfig, {name : 'hdd_path'}).isHidden = true;
        entityWizard.setDisabled('datastore', false, '2');

      } else {
        _.find(this.wizardConfig[2].fieldConfig, {name : 'volsize'}).isHidden = true;
        _.find(this.wizardConfig[2].fieldConfig, {name : 'datastore'}).isHidden = true;
        _.find(this.wizardConfig[2].fieldConfig, {name : 'hdd_path'}).isHidden = false;
        entityWizard.setDisabled('datastore', true, '2');
      }

    });
    this.getFormControlFromFieldName('upload_iso_checkbox').valueChanges.subscribe((res) => {
      if (res){
        _.find(this.wizardConfig[4].fieldConfig, {name : 'upload_iso'})['isHidden'] = false;
        _.find(this.wizardConfig[4].fieldConfig, {name : 'upload_iso_path'})['isHidden'] = false;
      } else {
        _.find(this.wizardConfig[4].fieldConfig, {name : 'upload_iso'})['isHidden'] = true;
        _.find(this.wizardConfig[4].fieldConfig, {name : 'upload_iso_path'})['isHidden'] = true;
      }

    });
    this.getFormControlFromFieldName('upload_iso_path').valueChanges.subscribe((res) => {
      if (res){
        _.find(this.wizardConfig[4].fieldConfig, {name : 'upload_iso'}).fileLocation = res;
      }

    });

    this.networkService.getVmNicChoices().subscribe((res) => {
      this.nicAttach = _.find(this.wizardConfig[3].fieldConfig, {'name' : 'nic_attach'});
      this.nicAttach.options = Object.keys(res || {}).map(nicId => ({
        label: nicId,
        value: nicId
      }));
      
      this.getFormControlFromFieldName('nic_attach').valueChanges.subscribe((res) => {
        this.prefService.preferences.storedValues.vm_nicAttach = res;
        this.prefService.savePreferences();
      });
      
      this.ws.call('vm.random_mac').subscribe((mac_res)=>{
        this.getFormControlFromFieldName('NIC_mac').setValue(mac_res);
      });

    });
        this.nicType = _.find(this.wizardConfig[3].fieldConfig, {name : "NIC_type"});
        this.vmService.getNICTypes().forEach((item) => {
          this.nicType.options.push({label : item[1], value : item[0]});
        });
        
        this.getFormControlFromFieldName('NIC_type').valueChanges.subscribe((res) => {
          this.prefService.preferences.storedValues.vm_nicType = res;
          this.prefService.savePreferences();
        });

      this.bootloader = _.find(this.wizardConfig[0].fieldConfig, {name : 'bootloader'});

      this.vmService.getBootloaderOptions().subscribe(options => {
        for (const option in options) {
          this.bootloader.options.push({ label: options[option], value: option});
        }
        this.getFormControlFromFieldName('bootloader').setValue(
          this.bootloader.options[0].label
        )
      });

      setTimeout(() => {
        let globalLabel, globalTooltip;
        this.translate.get(helptext.memory_placeholder).subscribe(mem => {
          this.translate.get(helptext.global_label).subscribe(gLabel => {
            this.translate.get(helptext.global_tooltip).subscribe(gTooltip => {
              this.translate.get(helptext.memory_tooltip).subscribe(mem_tooltip => {
                this.translate.get(helptext.memory_unit).subscribe(mem_unit => {
                  globalLabel = gLabel;
                  globalTooltip = gTooltip;
                  _.find(this.wizardConfig[1].fieldConfig, { name: 'memory' }).placeholder = `${mem} ${globalLabel}`;
                  _.find(this.wizardConfig[1].fieldConfig, { name: 'memory' }).tooltip = 
                  `${mem_tooltip} ${globalTooltip} ${mem_unit}`;
                })
              })
            })
          })
        });
        this.translate.get(helptext.volsize_placeholder).subscribe(placeholder => {
          this.translate.get(helptext.volsize_tooltip).subscribe(tooltip => {
            this.translate.get(helptext.volsize_tooltip_B).subscribe(tooltipB => {
              _.find(this.wizardConfig[2].fieldConfig, { name: 'volsize' }).placeholder = `${placeholder} ${globalLabel}`;
              _.find(this.wizardConfig[2].fieldConfig, { name: 'volsize' }).tooltip = 
                `${tooltip} ${globalLabel} ${tooltipB}`;
            })
          })
        })
      }, 2000)

  }

  getRndInteger(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
  }

  memoryValidator(name: string) {
    const self = this;
    return function validMem(control: FormControl) {
      const config = self.wizardConfig[1].fieldConfig.find(c => c.name === name);

      const errors = self.storageService.convertHumanStringToNum(control.value) < 268435456
      ? { validMem : true }
      : null;

      if (errors) {
        config.hasErrors = true;
        config.warnings = helptext.memory_size_err;
      } else {
        config.hasErrors = false;
        config.warnings = '';
      }

      return errors;
    }
  };

  cpuValidator(name: string) { 
    const self = this;
    return function validCPU(control: FormControl) {
      const config = self.wizardConfig[1].fieldConfig.find(c => c.name === name);
        setTimeout(() => {
          const errors = self.vcpus * self.cores * self.threads > self.maxVCPUs
          ? { validCPU : true }
          : null;

          if (errors) {
            config.hasErrors = true;
            self.translate.get(helptext.vcpus_warning).subscribe(warning => {
              config.warnings = warning + ` ${self.maxVCPUs}.`;
            })
          } else {
            config.hasErrors = false;
            config.warnings = '';
          }
          return errors;
        }, 100)
    }
  };

  volSizeValidator(name: string) {
    const self = this;
    return function validStorage(control: FormControl) {
      const config = self.wizardConfig[2].fieldConfig.find(c => c.name === name);

      if (control.value && self.statSize) {
        const requestedSize = self.storageService.convertHumanStringToNum(control.value);
        const errors = self.statSize.free_bytes < requestedSize
        ? { validStorage : true }
        : null;

        if (errors) {
          config.hasErrors = true;
          self.translate.get('Cannot allocate').subscribe(msg => {
            self.translate.get('to storage for this virtual machine.').subscribe(msg2 => {
            config.warnings = `${msg} ${self.storageService.humanReadable} ${msg2}`;  
            })
          })
        } else {
          config.hasErrors = false;
          config.warnings = '';
        }

        return errors;
      }
    }
  };

  blurEventForMemory(parent: VMWizardComponent){
    const enteredVal = parent.getFormControlFromFieldName('memory', parent).value;
    const vmMemoryRequested = parent.storageService.convertHumanStringToNum(enteredVal);
    if (isNaN(vmMemoryRequested)) {
      console.error(vmMemoryRequested) // leaves form in previous error state
    } else if (enteredVal.replace(/\s/g, '').match(/[^0-9]/g) === null) {
      parent.getFormControlFromFieldName('memory', parent)
        .setValue(parent.storageService.convertBytestoHumanReadable(enteredVal.replace(/\s/g, ''), 0));
    } else {
      parent.getFormControlFromFieldName('memory', parent).setValue(parent.storageService.humanReadable);
      _.find(parent.wizardConfig[1].fieldConfig, {'name' : 'memory'})['hasErrors'] = false;
      _.find(parent.wizardConfig[1].fieldConfig, {'name' : 'memory'})['errors'] = '';
    }
  }

  blueEventForVolSize(parent: VMWizardComponent){
    const enteredVal = parent.getFormControlFromFieldName('volsize', parent).value;
    const volsize = parent.storageService.convertHumanStringToNum(enteredVal, false, 'mgtp');
    if (volsize >= 1048576 ) {
      parent.getFormControlFromFieldName('volsize', parent).setValue(parent.storageService.humanReadable);
      _.find(parent.wizardConfig[2].fieldConfig, {'name' : 'volsize'})['hasErrors'] = false;
      _.find(parent.wizardConfig[2].fieldConfig, {'name' : 'volsize'})['errors'] = '';
    } else if (isNaN(volsize)) {
      console.error(volsize) // leaves form in previous error state
    } else {
      parent.getFormControlFromFieldName('volsize').setValue('1 MiB');
    }
  }

  getFormControlFromFieldName(fieldName: string, parent: VMWizardComponent = this): FormControl {
    return (<FormGroup>parent.entityWizard.formArray.get([parent.getFormArrayIndexFromFieldName(fieldName, parent)])).get(fieldName) as FormControl;
  }

  getFormArrayIndexFromFieldName(fieldName: string, parent: VMWizardComponent = this): number {
    return parent.wizardConfig.findIndex((conf: Formconfiguration) => {
      return conf.fieldConfig.findIndex((fieldConf: FieldConfig) =>  fieldConf.name === fieldName) >= 0;
    });
  }

  async customSubmit(value: any) {
    let hdd;
    const vmPayload = {}
    const zvolPayload = {}

    

    if(value.datastore) {
      value.datastore = value.datastore.replace('/mnt/','')
      hdd = value.datastore+"/"+value.name.replace(/\s+/g, '-')+"-"+Math.random().toString(36).substring(7);
    }
    
    // zvol_payload only applies if the user is creating one
    zvolPayload['create_zvol'] = true
    zvolPayload["zvol_name"] = hdd
    zvolPayload["zvol_volsize"] = this.storageService.convertHumanStringToNum(value.volsize);

    if (this.productType.includes('SCALE')) {
      vmPayload["cpu_mode"] = value.cpu_mode;
      vmPayload["cpu_model"] = value.cpu_model === '' ? null : value.cpu_model;
    }

    vmPayload["memory"]= value.memory;
    vmPayload["name"] = value.name;
    vmPayload["description"] = value.description;
    vmPayload["time"]= value.time;
    vmPayload["vcpus"] = value.vcpus;
    vmPayload["cores"] = value.cores;
    vmPayload["threads"] = value.threads;
    vmPayload["memory"] = Math.ceil(this.storageService.convertHumanStringToNum(value.memory) / 1024**2); // bytes -> mb
    vmPayload["bootloader"] = value.bootloader;
    vmPayload["shutdown_timeout"]= value.shutdown_timeout;
    vmPayload["autoloader"] = value.autoloader;
    vmPayload["autostart"] = value.autostart;
    if ( value.iso_path && value.iso_path !== undefined) {
      vmPayload["devices"] = [
        {"dtype": "NIC", "attributes": {"type": value.NIC_type, "mac": value.NIC_mac, "nic_attach":value.nic_attach}},
        {"dtype": "DISK", "attributes": {"path": hdd, "type": value.hdd_type, 'physical_sectorsize': null, 'logical_sectorsize': null}},
        {"dtype": "CDROM", "attributes": {"path": value.iso_path}},
      ]
    } else {
      vmPayload["devices"] = [
        {"dtype": "NIC", "attributes": {"type": value.NIC_type, "mac": value.NIC_mac, "nic_attach":value.nic_attach}},
        {"dtype": "DISK", "attributes": {"path": hdd, "type": value.hdd_type, 'physical_sectorsize': null, 'logical_sectorsize': null}},
      ]
    }

    if(value.gpu) {
      const gpuIndex = this.gpus.findIndex(gpu => gpu.addr.pci_slot == value.gpu);
      vmPayload["devices"].push(...this.gpus[gpuIndex].devices.map(gpuDevice => {
        const device = {
          dtype: "PCI",
          attributes: {
            pptdev: gpuDevice.vm_pci_slot
          }
        };
        return device;
      }))
    }

    if (value.enable_display) {
      if (this.productType.includes('SCALE')) {
        vmPayload["devices"].push({
          "dtype": "DISPLAY", "attributes": {
            "port": this.displayPort,
            "bind": value.bind,
            "password": "",
            "web": true,
            "type":  value.display_type
          }
        });
      } else if (value.bootloader === 'UEFI') {
        vmPayload["devices"].push({
          "dtype": "DISPLAY", "attributes": {
            "wait": value.wait,
            "port": this.displayPort,
            "resolution": "1024x768",
            "bind": value.bind,
            "password": "",
            "web": true,
            "type": value.display_type
          }
        });
      }
    }
    
    this.loader.open();
    if(value.isolated_gpu_pci_ids && value.isolated_gpu_pci_ids.length) {
      this.ws.call('system.advanced.update', [{isolated_gpu_pci_ids: value.isolated_gpu_pci_ids}]).subscribe(
        (res) => res,
        (err) =>  new EntityUtils().handleWSError(this.entityWizard, err)
      );
    }
    if( value.hdd_path ){
      for (const device of vmPayload["devices"]){
        if (device.dtype === "DISK"){
          device.attributes.path = '/dev/zvol/'+ value.hdd_path;
        };
      };
      
      const devices = [...vmPayload["devices"]]
      delete vmPayload['devices'];
      this.ws.call('vm.create', [vmPayload]).subscribe(vm_res => {
        const observables: Observable<any>[] = [];
        for(const device of devices) {
          device.vm = vm_res.id;
          observables.push(this.ws.call('vm.device.create', [device]).pipe(
            map((res) => res),
            catchError(err => {
              err.device = {...device};
              throw err;
            })));
        }
        combineLatest(observables).subscribe(
          responses_array => {
            this.loader.close();
            this.modalService.close('slide-in-form');
          },
          error => {
            setTimeout(() => {
              this.ws.call('vm.delete', [vm_res.id, {zvols: false, force: false}]).subscribe(
                (res) => {
                  this.loader.close();
                  this.dialogService.errorReport(T("Error creating VM."), T("We ran into an error while trying to create the ")+error.device.dtype+" device.\n"+error.reason, error.trace.formatted);
                },
                (err) => {
                  this.loader.close();
                  this.dialogService.errorReport(T("Error creating VM."), T("We ran into an error while trying to create the ")+error.device.dtype+" device.\n"+error.reason, error.trace.formatted);
                  new EntityUtils().handleWSError(this, err, this.dialogService);
                }
              )
          }, 1000);
          }
        )
    },(error) => {
      this.loader.close();
      this.dialogService.errorReport(T("Error creating VM."), error.reason, error.trace.formatted);
    });

    } else {
      for (const device of vmPayload["devices"]){
        if (device.dtype === "DISK"){          
          const origHdd = device.attributes.path;
          const createZvol = zvolPayload['create_zvol']
          const zvolName = zvolPayload['zvol_name']
          const zvolVolsize = zvolPayload['zvol_volsize']

          device.attributes.path = '/dev/zvol/' + origHdd
          device.attributes.type = value.hdd_type;
          device.attributes.create_zvol = createZvol
          device.attributes.zvol_name = zvolName
          device.attributes.zvol_volsize = zvolVolsize
        };
      };
      
      const devices = [...vmPayload["devices"]]
      delete vmPayload['devices'];

      this.ws.call('vm.create', [vmPayload]).subscribe(vm_res => {
        const observables: Observable<any>[] = [];
        for(const device of devices) {
          device.vm = vm_res.id;
          observables.push(this.ws.call('vm.device.create', [device]).pipe(
            map((res) => res),
            catchError(err => {
              err.device = {...device};
              throw err;
            })));
        }

        combineLatest(observables).subscribe(
          responses_array => {
            this.loader.close();
            this.modalService.close('slide-in-form');
          },
          error => {
            setTimeout(() => {
              this.ws.call('vm.delete', [vm_res.id, {zvols: false, force: false}]).subscribe(
                (res) => {
                  this.loader.close();
                  this.dialogService.errorReport(T("Error creating VM."), T("Error while creating the ")+error.device.dtype+" device.\n"+error.reason, error.trace.formatted);
                },
                (err) => {
                  this.loader.close();
                  this.dialogService.errorReport(T("Error creating VM."), T("Error while creating the ")+error.device.dtype+" device.\n"+error.reason, error.trace.formatted);
                  new EntityUtils().handleWSError(this, err, this.dialogService);
                }
              )
            }, 1000);
          }
        )
    },(error) => {
        this.loader.close();
        this.dialogService.errorReport(T("Error creating VM."), error.reason, error.trace.formatted);
      });
    }
  }
}