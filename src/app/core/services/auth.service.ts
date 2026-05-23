import { inject, Injectable, signal } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  linkWithPopup,
  EmailAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
} from '@angular/fire/auth';
import { Observable, from } from 'rxjs';
import { IUserRepository } from '../repositories';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth     = inject(Auth);
  private readonly userRepo = inject(IUserRepository);

  readonly currentUser = signal<User | null>(null);
  readonly isLoading   = signal(true);

  constructor() {
    onAuthStateChanged(this.auth, async (fbUser: FirebaseUser | null) => {
      if (!fbUser) {
        this.currentUser.set(null);
        this.isLoading.set(false);
        return;
      }
      try {
        const profile = await this.userRepo.findById(fbUser.uid);
        if (!profile) { await this.doSignOut(); return; }
        this.currentUser.set(profile);
      } catch {
        await this.doSignOut();
      } finally {
        this.isLoading.set(false);
      }
    });
  }

  // ── E-mail / senha ──────────────────────────────────────────
  login(email: string, password: string): Observable<void> {
    this.isLoading.set(true);

    return from(
      signInWithEmailAndPassword(this.auth, email, password)
        .then(() => undefined as void)
    );
  }

  // ── Login com Google ────────────────────────────────────────
  async loginWithGoogle(): Promise<'ok' | 'not-registered'> {
    const provider = new GoogleAuthProvider();
    const cred     = await signInWithPopup(this.auth, provider);
    const fbUser   = cred.user;

    // 1. Tenta encontrar por UID do Firebase (se o usuário veio de Google direto)
    let profile = await this.userRepo.findById(fbUser.uid);

    // 2. Se não encontrou, tenta pelo googleUid salvo no perfil
    if (!profile) {
      profile = await this.userRepo.findByGoogleUid(fbUser.uid);
    }

    if (!profile) {
      // Google autenticou mas não há cadastro vinculado — desloga
      await this.doSignOut();
      return 'not-registered';
    }

    this.currentUser.set(profile);
    return 'ok';
  }

  // ── Vincular Google a conta existente ───────────────────────
  async linkGoogle(): Promise<void> {
    const fbUser = this.auth.currentUser;
    if (!fbUser) throw new Error('Não autenticado.');
    const provider = new GoogleAuthProvider();
    const result   = await linkWithPopup(fbUser, provider);
    const googleUid = result.user.uid;
    // Salva o googleUid no documento do usuário para lookup futuro
    await this.userRepo.linkGoogle(fbUser.uid, googleUid);
    // Atualiza o currentUser em memória
    const updated = this.currentUser();
    if (updated) this.currentUser.set({ ...updated, googleUid });
  }

  // ── Alterar senha ───────────────────────────────────────────
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user?.email) throw new Error('Usuário não autenticado.');
    const cred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, cred);
    await updatePassword(user, newPassword);
  }

  logout(): Observable<void> {
    this.currentUser.set(null);
    return from(this.doSignOut());
  }

  private doSignOut(): Promise<void> {
    return signOut(this.auth);
  }

  get hasGoogleLinked(): boolean {
    return !!this.auth.currentUser?.providerData
      .some(p => p.providerId === 'google.com');
  }
}
