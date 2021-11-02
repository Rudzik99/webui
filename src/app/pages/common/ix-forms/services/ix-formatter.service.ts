import { Injectable } from '@angular/core';
import { StorageService } from 'app/services';

@Injectable()
export class IxFormatterService {
  constructor(
    private storageService: StorageService,
  ) {}

  memorySizeFormatting: (val: string | number) => string = (value: string | number) => {
    value = value.toString();
    if (!value) {
      return '';
    }
    let formatted = '';
    const memoryInNumbers = this.storageService.convertHumanStringToNum(value);
    if (Number.isNaN(memoryInNumbers)) {
      console.error(memoryInNumbers);
    } else if (value.replace(/\s/g, '').match(/[^0-9]/g) === null) {
      formatted = this.storageService.convertBytestoHumanReadable(value.replace(/\s/g, ''), 0);
    } else {
      formatted = this.storageService.humanReadable;
    }
    return formatted;
  };

  memorySizeParsing: (val: string) => number = (value: string) => {
    value = value.toString();
    if (!value) {
      return NaN;
    }
    return this.storageService.convertHumanStringToNum(value);
  };
}