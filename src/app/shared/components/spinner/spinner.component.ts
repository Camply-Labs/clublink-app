import { Component, input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: true,
  styleUrl: 'spinner.component.scss',
  template: `
    <div class="spinner-wrap">
      <div class="spinner" [class.spinner-sm]="small()"></div>
      @if (label()) { <span class="spinner-label">{{ label() }}</span> }
    </div>
  `,
})
export class SpinnerComponent {
  readonly small = input(false);
  readonly label = input('');
}
