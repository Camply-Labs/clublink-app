// ============================================================
//  FCMService — Firebase Cloud Messaging
//  Responsável por:
//   1. Solicitar permissão de notificação ao usuário
//   2. Obter o FCM token do dispositivo
//   3. Salvar o token em users/{uid}/fcm_tokens (array)
//   4. Escutar mensagens push em foreground e exibir como toast
// ============================================================

import { inject, Injectable } from '@angular/core';
import {
  Messaging,
  getToken,
  onMessage,
} from '@angular/fire/messaging';
import {
  Firestore,
  doc,
  updateDoc,
  arrayUnion,
} from '@angular/fire/firestore';
import { ToastService } from './toast.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FcmService {
  private readonly messaging  = inject(Messaging);
  private readonly firestore  = inject(Firestore);
  private readonly toast      = inject(ToastService);
  private readonly router     = inject(Router);

  /**
   * Solicita permissão, obtém o FCM token e o salva no Firestore.
   * Chamado logo após o login bem-sucedido.
   *
   * O token é adicionado ao array `fcm_tokens` do usuário — um
   * usuário pode ter tokens de vários dispositivos simultaneamente.
   * O serviço de backend deve iterar esse array ao enviar pushes.
   *
   * @param uid UID do usuário logado
   */
  async registerToken(uid: string): Promise<void> {
    try {
      if (!environment.pushNotifications.active) return;

      // Verifica suporte
      if (!('Notification' in window)) return;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const registration = await navigator.serviceWorker.register('/pushNotifications' + environment.pushNotifications.swFile);

      const token = await getToken(this.messaging, {
        vapidKey: environment.firebase.vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!token) return;

      // Salva no array de tokens do usuário (sem duplicatas — arrayUnion)
      await updateDoc(doc(this.firestore, 'users', uid), {
        fcm_tokens: arrayUnion(token),
      });

      console.log('[FCM] Token registrado com sucesso.');
    } catch (err) {
      // Não bloqueia o login se FCM falhar
      console.warn('[FCM] Falha ao registrar token:', err);
    }
  }

  /**
   * Inicia o listener de mensagens em foreground.
   * Mensagens push recebidas com o app aberto são exibidas
   * como toast in-app (o service worker exibe quando o app está fechado).
   *
   * @param uid UID do usuário (para filtragem de target.type === 'SPECIFIC')
   */
  startForegroundListener(uid: string): void {
    try {
      if (!environment.pushNotifications.active) return;

      onMessage(this.messaging, (payload) => {
        const title   = payload.notification?.title ?? payload.data?.['title'] ?? 'Notificação';
        const body    = payload.notification?.body  ?? payload.data?.['message'] ?? '';
        const route   = payload.data?.['route'];

        // Exibe toast clicável
        this.toast.info(`📣 ${title}${body ? ' — ' + body : ''}`);

        // Se tiver rota, clique no toast navega (implementação via CustomEvent)
        if (route) {
          // Dispara evento global para o toast container capturar (opcional)
          window.dispatchEvent(new CustomEvent('fcm:notification', {
            detail: { title, body, route },
          }));
        }
      });
    } catch (err) {
      console.warn('[FCM] Falha ao iniciar listener de foreground:', err);
    }
  }
}
