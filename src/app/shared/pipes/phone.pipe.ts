import { Pipe, PipeTransform } from '@angular/core';
import { StringHelper } from '../helpers/string.helper';

@Pipe({
  name: 'phone'
})
export class PhonePipe implements PipeTransform {

  transform(value: string | null | undefined): string {
    if (!value || value.trim() === '') {
      return value || '';
    }

    return StringHelper.formatPhoneNumber(value);
  }

}
