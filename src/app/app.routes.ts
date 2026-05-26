import { Routes } from '@angular/router';
import { authGuard, permissionGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'admin-override',
    loadComponent: () =>
      import('./features/admin-override/admin-override.component')
        .then(m => m.AdminOverrideComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: 'podium',
        loadComponent: () =>
          import('./features/podium/podium.component').then(m => m.PodiumComponent),
      },
      {
        path: 'agenda',
        loadComponent: () =>
          import('./features/agenda/agenda.component').then(m => m.AgendaComponent),
      },
      {
        path: 'members',
        canActivate: [permissionGuard('members.view')],
        loadComponent: () =>
          import('./features/members/members.component').then(m => m.MembersComponent),
      },
      {
        path: 'appointments',
        canActivate: [permissionGuard('appointments.view')],
        loadComponent: () =>
          import('./features/appointments/appointments.component')
            .then(m => m.AppointmentsComponent),
      },
      {
        path: 'register',
        canActivate: [permissionGuard('register.view')],
        loadComponent: () =>
          import('./features/register/register.component').then(m => m.RegisterComponent),
      },
      {
        path: 'my-points',
        canActivate: [roleGuard('desbravador')],
        loadComponent: () =>
          import('./features/my-points/my-points.component').then(m => m.MyPointsComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(m => m.ProfileComponent),
      },
      {
        path: 'console',
        canActivate: [permissionGuard('admin.view')],
        loadComponent: () =>
          import('./features/console/console.component').then(m => m.ConsoleComponent),
      },
      { path: 'password', redirectTo: 'profile', pathMatch: 'full' },
      { path: '',         redirectTo: 'podium',  pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
