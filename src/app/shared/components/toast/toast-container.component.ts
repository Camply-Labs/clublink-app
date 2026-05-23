import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  styleUrl: 'toast-container.component.scss',
  template: `
    <div class="toast-container">
      @for (t of toastSvc.toasts(); track t.id) {
        <div class="toast toast-{{ t.type }}" (click)="toastSvc.dismiss(t.id)">
          <span>{{ icons[t.type] }}</span>
          <span>{{ t.message }}</span>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  readonly toastSvc = inject(ToastService);
  readonly icons    = { success: '✓', error: '✕', info: 'ℹ' } as const;
}
