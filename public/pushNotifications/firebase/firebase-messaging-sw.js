importScripts('../push-notifications.js');

importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');
importScripts('firebase-environments.js');


// Verifica as configurações de notificação push e inicializa o Firebase Messaging
if(self.FIREBASE_ENV && self.PUSH_NOTIFICATIONS_CONFIG) {
  firebase.initializeApp(self.FIREBASE_ENV);

  const messaging = firebase.messaging();

  // Background: exibe a notificação push quando o app está fechado
  messaging.onBackgroundMessage((payload) => {
    const title = payload.data?.title ?? payload.data?.title ?? 'Clublink';
    const body  = payload.data?.body  ?? payload.data?.body ?? '';
    const data  = { route: payload.data?.route ?? '/' };

    self.registration.showNotification(title, {
      body: payload.data?.body,
      icon:    self.PUSH_NOTIFICATIONS_CONFIG.icon,
      badge:   self.PUSH_NOTIFICATIONS_CONFIG.badge,
      data,
      image: payload.data?.imageUrl ?? null,
      vibrate: self.PUSH_NOTIFICATIONS_CONFIG.vibrate
    });
  });


  // Clique na notificação nativa (OS)
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const route = event.notification.data?.route ?? '/';
    const url = self.location.origin + route;

    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then((clientsList) => {

        for (const client of clientsList) {

          if (client.url.startsWith(self.location.origin)) {

            client.postMessage({
              type: 'NAVIGATE',
              route
            });

            return client.focus();
          }
        }

        return clients.openWindow(url);
      })
    );
  });
}
