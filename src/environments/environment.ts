// ============================================================
//  🔥 AMBIENTE DE DESENVOLVIMENTO
//  Substitua os valores abaixo com as chaves do seu projeto Firebase.
//  Console: https://console.firebase.google.com
//  Projeto → Configurações → Seus apps → Web → firebaseConfig
// ============================================================

import { version } from "packageJson";

export const environment = {
  production: false,
  version: version,
  pushNotifications: {
    active: false,
    implementation: 'firebase',
    swFile: '/firebase/firebase-messaging-sw.js',
  },
  firebase: {
    apiKey:            'FIREBASE_API_KEY',
    authDomain:        'FIREBASE_AUTH_DOMAIN',
    projectId:         'FIREBASE_PROJECT_ID',
    storageBucket:     'FIREBASE_STORAGE_BUCKET',
    messagingSenderId: 'FIREBASE_MESSAGING_SENDER_ID',
    appId:             'FIREBASE_APP_ID',
    vapidKey:          'FIREBASE_VAPID_ID'
  },
};
