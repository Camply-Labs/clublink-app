import { Injectable, signal } from '@angular/core';
import { ToastMessage } from '../models';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  readonly toasts = signal<ToastMessage[]>([]);

  show(message: string, type: ToastMessage['type'] = 'info', duration = 3500): void {
    const id = ++this.counter;
    this.toasts.update(list => [...list, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  success(message: string, duration?: number): void { this.show(message, 'success', duration); }
  error(message: string, duration?: number):   void { this.show(message, 'error',   duration); }
  info(message: string, duration?: number):    void { this.show(message, 'info',    duration); }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
