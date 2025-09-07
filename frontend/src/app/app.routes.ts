import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/upload', pathMatch: 'full' },
  { path: 'upload', loadComponent: () => import('./components/upload/upload.component').then(m => m.UploadComponent) },
  { path: 'date-ranges', loadComponent: () => import('./components/date-ranges/date-ranges.component').then(m => m.DateRangesComponent) },
  { path: 'training', loadComponent: () => import('./components/training/training.component').then(m => m.TrainingComponent) },
  { path: 'simulation', loadComponent: () => import('./components/simulation/simulation.component').then(m => m.SimulationComponent) },
  { path: '**', redirectTo: '/upload' }
];
