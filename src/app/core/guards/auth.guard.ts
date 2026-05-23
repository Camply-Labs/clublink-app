import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';
import { PermissionKey, UserRole } from '../models';

function waitForAuth(auth: AuthService) {
  return toObservable(auth.isLoading).pipe(
    filter(loading => !loading),
    take(1),
  );
}

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  return waitForAuth(auth).pipe(
    map(() => auth.currentUser() ? true : router.createUrlTree(['/login'])),
  );
};

export const roleGuard = (role: UserRole): CanActivateFn => () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  return waitForAuth(auth).pipe(
    map(() => {
      const user = auth.currentUser();
      if (!user)              return router.createUrlTree(['/login']);
      if (user.role !== role) return router.createUrlTree(['/']);
      return true;
    }),
  );
};

export const permissionGuard = (key: PermissionKey): CanActivateFn => () => {
  const auth    = inject(AuthService);
  const permSvc = inject(PermissionService);
  const router  = inject(Router);
  return waitForAuth(auth).pipe(
    map(() => {
      if (!auth.currentUser()) return router.createUrlTree(['/login']);
      return permSvc.can(key) ? true : router.createUrlTree(['/']);
    }),
  );
};
