import {ApplicationRef, Component, Injector} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { FormControl } from '@angular/forms';
import * as _ from 'lodash';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { T } from '../../../translate-marker';
import helptext from './../../../helptext/vm/vm-wizard/vm-wizard';
import globalHelptext from './../../../helptext/global-helptext';
import {WebSocketService, StorageService, VmService, ValidationService, AppLoaderService, DialogService, SystemGeneralService} from '../../../services/';
import { Validators } from '@angular/forms';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';

import { GpuDevice } from 'app/interfaces/gpu-device';
import { combineLatest, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EntityUtils } from 'app/pages/common/entity/utils';

@Component({
  selector : 'app-vm',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers: [StorageService]

})
export class VmFormComponent {
  protected queryCall = 'vm.query';
  protected editCall = 'vm.update';
  protected isEntity = true;
  protected route_success: string[] = [ 'vm' ];
  protected entityForm: EntityFormComponent;
  protected save_button_enabled: boolean;
  private rawVmData: any;
  public vcpus: number;
  public cores: number;
  public threads: number;
  private gpus: GpuDevice[];
  private isolatedGpuPciIds: string[];
  private maxVCPUs: number;
  private productType: string = window.localStorage.getItem('product_type');
  protected queryCallOption: Array<any> = [];

  public fieldConfig: FieldConfig[] = []
  public fieldSets: FieldSet[] = [
      {
        name: helptext.vm_settings_title,
        class: 'vm_settings',
        label:true,
        width: '49%',
        config:[
        { 
          type: 'input', 
          name: 'name', 
          placeholder: helptext.name_placeholder, 
          tooltip: helptext.name_tooltip
        },
        { 
          type: 'input', 
          name : 'description', 
          placeholder : helptext.description_placeholder, 
          tooltip: helptext.description_tooltip
        },
        {
          name: 'time',
          placeholder: helptext.time_placeholder,
          tooltip: helptext.time_tooltip,
          type: 'select',
          options: [{ label: helptext.time_local_text, value: 'LOCAL'}, { label: helptext.time_utc_text, value: 'UTC' }]
        },
        { 
          type: 'select', 
          name : 'bootloader', 
          placeholder : helptext.bootloader_placeholder, 
          tooltip: helptext.bootloader_tooltip,
          options: []
        },
        { 
          type: 'input', 
          name : 'shutdown_timeout', 
          inputType: 'number',
          placeholder : helptext.shutdown_timeout.placeholder, 
          tooltip: helptext.shutdown_timeout.tooltip,
          validation: helptext.shutdown_timeout.validation
        },
        { 
          type: 'checkbox', 
          name : 'autostart', 
          placeholder : helptext.autostart_placeholder, 
          tooltip: helptext.autostart_tooltip
        }
      ]
    },
    {
      name: 'spacer',
      class: 'spacer',
      label:false,
      width: '2%',
      config:[]
    },
    {
      name: helptext.vm_cpu_mem_title,
      class: 'vm_settings',
      label:true,
      width: '49%',
      config:[
        { 
          type : 'input', 
          name: 'vcpus',
          inputType: 'number',
          placeholder : helptext.vcpus_placeholder, 
          tooltip: helptext.vcpus_tooltip,
          validation: [Validators.required, Validators.min(1), this.cpuValidator('threads'),]
        },
        { 
          type : 'input', 
          name: 'cores',
          inputType: 'number',
          placeholder : helptext.cores.placeholder, 
          tooltip: helptext.cores.tooltip,
          validation: [Validators.required, Validators.min(1), this.cpuValidator('threads'),]
        },
        { 
          type : 'input', 
          name: 'threads',
          inputType: 'number',
          placeholder : helptext.threads.placeholder, 
          tooltip: helptext.threads.tooltip,
          validation: [Validators.required, Validators.min(1), this.cpuValidator('threads'),]
        },
        {
          type: 'select',
          name: 'cpu_mode',
          placeholder: helptext.cpu_mode.placeholder,
          tooltip: helptext.cpu_mode.tooltip,
          options: helptext.cpu_mode.options,
          isHidden: true
        },
        {
          type: 'select',
          name: 'cpu_model',
          placeholder: helptext.cpu_model.placeholder,
          tooltip: helptext.cpu_model.tooltip,
          options: [
            { label: '---', value: ''}
          ],
          isHidden: true
        },
        { 
          type: 'input', 
          name : 'memory', 
          placeholder : `${helptext.memory_placeholder} ${globalHelptext.human_readable.suggestion_label}`,
          tooltip: helptext.memory_tooltip,
          blurStatus : true,
          blurEvent : this.blurEvent,
          parent : this
        },

      ]
    },
    {
      name: 'spacer',
      class: 'spacer',
      label:false,
      width: '2%',
      config:[]
    },
    {
      name: T("GPU"),
      class: 'vm_settings',
      label:true,
      width: '49%',
      config: [
        {
          type: 'checkbox',
          name: 'hide_from_msr',
          placeholder: T('Hide from MSR'),
          value: false
        },
        {
          type: 'select',
          placeholder: T("GPU's"),
          name: 'gpus',
          multiple: true,
          options: [],
          required: true
        }
      ]
    }
  ]
  private bootloader: any;
  public bootloader_type: any[];

  constructor(protected router: Router, private loader: AppLoaderService,
              protected ws: WebSocketService, protected storageService: StorageService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected vmService: VmService, protected route: ActivatedRoute,
              private translate: TranslateService, private dialogService: DialogService, private systemGeneralService: SystemGeneralService
              ) {}

  preInit(entityForm: EntityFormComponent) {

    this.entityForm = entityForm;
    this.route.params.subscribe(params => {
      if (params['pk']) {
        let opt = params.pk ? ['id', "=", parseInt(params.pk, 10)] : [];
        this.queryCallOption = [opt]
        }
      })
    this.ws.call('vm.maximum_supported_vcpus').subscribe(max => {
      this.maxVCPUs = max;
    })
  }

  afterInit(entityForm: EntityFormComponent) {
    this.bootloader =_.find(this.fieldConfig, {name : 'bootloader'});
    this.vmService.getBootloaderOptions().subscribe(options => {
      for(const option in options) {
        this.bootloader.options.push({label : options[option], value : option})
      }
    });

    entityForm.formGroup.controls['memory'].valueChanges.subscribe((value) => {
      const mem = _.find(this.fieldConfig, {name: "memory"});
      if (typeof(value) === 'number') {
        value = value.toString();
      }
      const filteredValue = this.storageService.convertHumanStringToNum(value);
      mem['hasErrors'] = false;
      mem['errors'] = '';
      if (isNaN(filteredValue)) {
          mem['hasErrors'] = true;
          mem['errors'] = globalHelptext.human_readable.input_error;
      };
    });

    entityForm.formGroup.controls['vcpus'].valueChanges.subscribe((value) => {
      this.vcpus = value;
    })
    entityForm.formGroup.controls['cores'].valueChanges.subscribe((value) => {
      this.cores = value;
    })
    entityForm.formGroup.controls['threads'].valueChanges.subscribe((value) => {
      this.threads = value;
    })

    if (this.productType.includes('SCALE')) {
      _.find(this.fieldConfig, {name : 'cpu_mode'})['isHidden'] = false;
      const cpuModel = _.find(this.fieldConfig, {name : 'cpu_model'});
      cpuModel.isHidden = false;

      this.vmService.getCPUModels().subscribe(models => {
        for (let model in models) {
          cpuModel.options.push(
            {
              label : model, value : models[model]
            }
          );
        };
      });
    }

    this.systemGeneralService.getAdvancedConfig.subscribe((res) => {
      this.isolatedGpuPciIds = res.isolated_gpu_pci_ids
    });
    

    const gpusFormControl = this.entityForm.formGroup.controls['gpus'];
    gpusFormControl.valueChanges.subscribe((gpusValue) => {
      const finalIsolatedPciIds = [...this.isolatedGpuPciIds];
      for(let gpuValue of gpusValue) {
        if(finalIsolatedPciIds.findIndex(pciId => pciId === gpuValue) === -1) {
          finalIsolatedPciIds.push(gpuValue)
        }
      }
      const gpusConf = _.find(this.entityForm.fieldConfig, {name : "gpus"});
      if(finalIsolatedPciIds.length >= gpusConf.options.length) {
        const prevSelectedGpus = [];
        for(let gpu of this.gpus) {
          if(this.isolatedGpuPciIds.findIndex(igpi => igpi === gpu.addr.pci_slot ) >= 0) {
            prevSelectedGpus.push(gpu)
          }
        }
        const listItems = "<li>" + prevSelectedGpus.map((gpu, index) => (index+1)+". "+gpu.description).join("</li><li>") + "</li>"
        gpusConf.warnings = "At least 1 GPU is required by the host for it’s functions.<p>Currently following GPU(s) have been isolated:<ol>"+listItems+"</ol></p><p>With your selection, no GPU is available for the host to consume.</p>";
        gpusFormControl.setErrors({ maxPCIIds: true})
      } else {
        gpusConf.warnings = null;
        gpusFormControl.setErrors(null);
      }
    });
  }

  blurEvent(parent){
    if (parent.entityForm) {
      parent.entityForm.formGroup.controls['memory'].setValue(parent.storageService.humanReadable)
      let valString = (parent.entityForm.formGroup.controls['memory'].value);
      let valBytes = Math.round(parent.storageService.convertHumanStringToNum(valString)/1048576);
      if (valBytes < 256) {
        const mem = _.find(parent.fieldConfig, {name: "memory"});
        mem['hasErrors'] = true;
        mem['errors'] = helptext.memory_size_err;
      }
    }
  }

  cpuValidator(name: string) { 
    const self = this;
    return function validCPU(control: FormControl) {
      const config = self.fieldConfig.find(c => c.name === name);
        setTimeout(() => {
          const errors = self.vcpus * self.cores * self.threads > self.maxVCPUs
          ? { validCPU : true }
          : null;
  
          if (errors) {
            config.hasErrors = true;
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

  resourceTransformIncomingRestData(vmRes) {
    this.rawVmData = vmRes;
    vmRes['memory'] = this.storageService.convertBytestoHumanReadable(vmRes['memory']*1048576, 0);
    this.ws.call("device.get_info", ["GPU"]).subscribe((gpus: GpuDevice[]) => {
      this.gpus = gpus;
      const vmPciSlots: string[] = vmRes.devices.filter(device => device.dtype === 'PCI').map(pciDevice => pciDevice.attributes.pptdev);
      const gpusConf = _.find(this.entityForm.fieldConfig, {name : "gpus"});
      for(let item of gpus) {
        gpusConf.options.push({label: item.description, value: item.addr.pci_slot})
      }
      const vmGpus = this.gpus.filter((gpu) => {
        for(let gpuPciDevice of gpu.devices) {
          if(!vmPciSlots.includes(gpuPciDevice.vm_pci_slot)) {
            return false;
          }
        }
        return true;
      });
      const gpuVmPciSlots = vmGpus.map(gpu => gpu.addr.pci_slot);
      this.entityForm.formGroup.controls['gpus'].setValue(gpuVmPciSlots);
    });
    return vmRes;
  }

  beforeSubmit(data) {
    if (data['memory'] !== undefined && data['memory'] !== null) {
      data['memory'] = Math.round(this.storageService.convertHumanStringToNum(data['memory'])/1048576);
    }

    return data;
  }


  customSubmit(updatedVmData) {
    const pciDevicesToCreate = [];
    const vmPciDeviceIdsToRemove = [];
    
    const prevVmPciDevices = this.rawVmData.devices.filter(device => device.dtype === 'PCI');
    const prevVmPciSlots: string[] = prevVmPciDevices.map(pciDevice => pciDevice.attributes.pptdev);
    const prevGpus = this.gpus.filter((gpu) => {
      for(let gpuPciDevice of gpu.devices) {
        if(!prevVmPciSlots.includes(gpuPciDevice.vm_pci_slot)) {
          return false;
        }
      }
      return true;
    });
    const currentGpusSelected = this.gpus.filter((gpu) => updatedVmData['gpus'].includes(gpu.addr.pci_slot));

    for(let currentGpu of currentGpusSelected) {
      let found = false;
      for(let prevGpu of prevGpus) {
        if(prevGpu.addr.pci_slot === currentGpu.addr.pci_slot) {
          found = true;
        }
      }
      if(!found) {
        const gpuPciDevices = currentGpu.devices.filter(gpuPciDevice => !prevVmPciSlots.includes(gpuPciDevice.vm_pci_slot));
        const gpuPciDevicesConverted = gpuPciDevices.map(pptDev => {
          return {
            dtype: "PCI",
            vm: this.rawVmData.id,
            attributes: {
              pptdev: pptDev.vm_pci_slot
            }
          };
        });
        pciDevicesToCreate.push(...gpuPciDevicesConverted);
      }
    }

    for(let prevGpu of prevGpus) {
      let found = false;
      for(let currentGpu of currentGpusSelected) {
        if(currentGpu.addr.pci_slot === prevGpu.addr.pci_slot) {
          found = true;
        }
      }
      if(!found) {
        const prevVmGpuPciDevicesPciSlots = prevGpu.devices.map(prevGpuPciDevice => prevGpuPciDevice.vm_pci_slot);
        const vmPciDevices = prevVmPciDevices.filter(prevVmPciDevice => prevVmGpuPciDevicesPciSlots.includes(prevVmPciDevice.attributes.pptdev));
        const vmPciDeviceIds = vmPciDevices.map(prevVmPciDevice => prevVmPciDevice.id);
        vmPciDeviceIdsToRemove.push(...vmPciDeviceIds);
      }
    }
    
    const observables: Observable<any>[] = [];
    if(updatedVmData.gpus) {
      const finalIsolatedPciIds = [...this.isolatedGpuPciIds];
      for(let gpuValue of updatedVmData.gpus) {
        if(finalIsolatedPciIds.findIndex(pciId => pciId === gpuValue) === -1) {
          finalIsolatedPciIds.push(gpuValue)
        }
      }
      observables.push(this.ws.call('system.advanced.update', [{isolated_gpu_pci_ids: finalIsolatedPciIds}]));
    }
    
    for(let deviceId of vmPciDeviceIdsToRemove) {
      observables.push(this.ws.call("datastore.delete", ["vm.device", deviceId]));
    }
    
    for(let device of pciDevicesToCreate) {
      observables.push(this.ws.call("vm.device.create", [device]));
    }

    
    
    delete updatedVmData['gpus'];
    this.loader.open();
    observables.push(this.ws.call("vm.update", [this.rawVmData.id, updatedVmData]));
    
    combineLatest(observables).subscribe(
      responses_array => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      },
      error => {
        this.loader.close();
        new EntityUtils().handleWSError(this, error, this.dialogService);
      }
    )
  }
}
