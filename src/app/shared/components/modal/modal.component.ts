import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  styleUrl: 'modal.component.scss',
  template: `
    <div class="modal-overlay" [class.open]="open()" (click)="onOverlayClick($event)">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">{{ title() }}</h3>
          <button class="modal-close" (click)="closed.emit()">✕</button>
        </div>
        <ng-content />
      </div>
    </div>
  `,
})
export class ModalComponent {
  readonly open   = input(false);
  readonly title  = input('');
  readonly closed = output<void>();

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closed.emit();
    }
  }
}
