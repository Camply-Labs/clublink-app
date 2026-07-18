import { Component, input, inject } from '@angular/core';
import { CustomizationService }  from '../../../core/services/customization.service';

@Component({
  selector: 'app-club-logo',
  standalone: true,
  styles: `
    .club-logo {
      filter: drop-shadow(0 0 8px rgba(201,168,76,0.6));
    }
  `,
  template: `
    <img class="club-logo" [src]="_customization.getValueOrDefault('logoUrl')" alt="Logo do Clube" [style.width.px]="size()" [style.height.px]="size()" />
  `,
})
export class ClubLogoComponent {
  readonly size = input<number>(42);
  readonly _customization = inject(CustomizationService);
}
