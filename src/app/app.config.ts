import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

import { environment } from '../environments/environment';
import { routes } from './app.routes';

import { IUserRepository, IHistoryRepository } from './core/repositories';
import { FirebaseUserRepository }    from './infrastructure/firebase/firebase-user.repository';
import { FirebaseHistoryRepository } from './infrastructure/firebase/firebase-history.repository';
import { FirebaseEventRepository } from './infrastructure/firebase/firebase-event.repository';
import { IEventRepository } from './core/repositories/event.repository';

/**
 * ─── TROCA DE BACKEND ────────────────────────────────────────
 * Para migrar de Firebase para REST, substitua aqui:
 *   FirebaseUserRepository    → HttpUserRepository
 *   FirebaseHistoryRepository → HttpHistoryRepository
 * Nenhum componente ou service precisa mudar.
 * ─────────────────────────────────────────────────────────────
 *
 * ─── GOOGLE AUTH ─────────────────────────────────────────────
 * Habilite o provedor Google em:
 *   Firebase Console → Authentication → Sign-in method → Google
 * ─────────────────────────────────────────────────────────────
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimations(),

    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),

    { provide: IUserRepository,    useClass: FirebaseUserRepository },
    { provide: IHistoryRepository, useClass: FirebaseHistoryRepository },
    { provide: IEventRepository,   useClass: FirebaseEventRepository },
  ],
};
