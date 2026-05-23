import { inject, Injectable, computed } from '@angular/core';
import { AuthService } from './auth.service';
import { PermissionKey } from '../models';

/**
 * Centraliza todas as verificações de autorização.
 * - role 'admin' → acesso total a tudo
 * - role 'diretoria' (não-admin) → apenas o que está em `permissions[]`
 * - role 'desbravador' → sem acesso a áreas de diretoria
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly auth = inject(AuthService);

  /** Verdadeiro se o usuário atual é admin (acesso irrestrito) */
  readonly isAdmin = computed(() => {
    const u = this.auth.currentUser();
    return u?.role === 'diretoria' && u.isAdmin === true;
  });

  readonly isDirector = computed(() =>
    this.auth.currentUser()?.role === 'diretoria'
  );

  /** Verifica uma permissão específica */
  can(key: PermissionKey): boolean {
    const u = this.auth.currentUser();
    if (!u) return false;
    if (u.role === 'desbravador') return false;
    if (u.isAdmin) return true;                         // admin → tudo liberado
    return (u.permissions ?? []).includes(key);
  }

  /** Signal reativo para usar em templates com computed() */
  canSignal(key: PermissionKey) {
    return computed(() => this.can(key));
  }
}
