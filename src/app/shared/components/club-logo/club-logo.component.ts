import { Component, input } from '@angular/core';

@Component({
  selector: 'app-club-logo',
  standalone: true,
  styles: `
    .club-logo {
      filter: drop-shadow(0 0 8px rgba(201,168,76,0.6));
    }
  `,
  template: `
    <img class="club-logo" src="img/club-logo.png" alt="Logo do Clube" [style.width.px]="size()" [style.height.px]="size()" />
  `,
})
export class ClubLogoComponent {
  readonly size = input<number>(42);
}
