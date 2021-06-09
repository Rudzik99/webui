import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { Field } from 'app/pages/common/entity/entity-form/models/field.interface';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';

@Component({
  selector: 'form-readfile',
  templateUrl: './form-readfile.component.html',
  styleUrls: ['../dynamic-field/dynamic-field.scss'],
})
export class FormReadFileComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  fileString: string | ArrayBuffer;

  constructor(private entityFormService: EntityFormService,
    public translate: TranslateService) {}

  changeListener($event: Event): void {
    this.readFile($event.target);
  }

  readFile(inputValue: any): any {
    const file: File = inputValue.files[0];
    const fReader: FileReader = new FileReader();
    fReader.onloadend = () => {
      this.fileString = fReader.result;
      this.contents(fReader.result);
    };
    return fReader.readAsText(file);
  }

  contents(result: any): void {
    this.group.controls[this.config.name].setValue(result);
  }
}
