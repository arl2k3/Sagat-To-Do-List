import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { 
    path: 'tasks', 
    loadComponent: () => import('./features/tasks/components/tasks-main/tasks-main.component').then(m => m.TasksMainComponent),
    canActivate: [AuthGuard] 
  },
  { path: '**', redirectTo: '' }
];
