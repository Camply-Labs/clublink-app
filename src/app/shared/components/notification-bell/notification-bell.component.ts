import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { AppNotification } from '../../../core/models/notification.model';

const TYPE_ICON: Record<string, string> = {
  NOTICE:      '📌',
  APPOINTMENT: '✏️',
  AGENDA:      '📅',
  SYSTEM:      '⚙️',
};

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'notification-bell.component.scss',
  template: `
    <div class="bell-wrapper">
      <!-- Botão sino -->
      <button class="bell-btn"
              [class.has-unread]="notifSvc.unreadCount() > 0"
              (click)="togglePanel()"
              [attr.aria-label]="'Notificações — ' + notifSvc.unreadCount() + ' não lidas'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        @if (notifSvc.unreadCount() > 0) {
          <span class="bell-badge">
            {{ notifSvc.unreadCount() > 99 ? '99+' : notifSvc.unreadCount() }}
          </span>
        }
      </button>

      <!-- Painel de notificações -->
      @if (open()) {
        <div class="notif-panel">
          <div class="notif-panel-header">
            <span class="notif-panel-title">Notificações</span>
            @if (notifSvc.unreadCount() > 0) {
              <span class="notif-unread-count">
                {{ notifSvc.unreadCount() }} não lida(s)
              </span>
            }
          </div>

          @if (notifSvc.sorted().length === 0) {
            <div class="notif-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span>Nenhuma notificação</span>
            </div>
          } @else {
            <div class="notif-list">
              @for (n of notifSvc.sorted(); track n.id) {
                <button class="notif-item"
                        [class.unread]="!notifSvc.isRead(n.id)"
                        (click)="onNotifClick(n)">
                  <div class="notif-icon">{{ typeIcon(n.type) }}</div>
                  <div class="notif-body">
                    <div class="notif-title">{{ n.title }}</div>
                    <div class="notif-message">{{ n.message }}</div>
                    @if (n.createdAt) {
                      <div class="notif-date">{{ formatDate(n.createdAt) }}</div>
                    }
                  </div>
                  @if (!notifSvc.isRead(n.id)) {
                    <div class="notif-dot" aria-label="Não lida"></div>
                  }
                </button>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class NotificationBellComponent {
  readonly notifSvc = inject(NotificationService);
  private readonly router = inject(Router);

  readonly open = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!(e.target as HTMLElement).closest('app-notification-bell')) {
      this.open.set(false);
    }
  }

  togglePanel(): void {
    this.open.update(v => !v);
  }

  async onNotifClick(n: AppNotification): Promise<void> {
    await this.notifSvc.markAsRead(n.id);
    this.open.set(false);
    if (n.route) {
      this.router.navigateByUrl(n.route);
    }
  }

  typeIcon(type: string): string {
    return TYPE_ICON[type] ?? '🔔';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
