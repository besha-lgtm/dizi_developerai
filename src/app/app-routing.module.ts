import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DeveloperaiComponent } from './pages/developerai/developerai.component';

const routes: Routes = [
  // Redirect root to dashboard
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Login (standalone, no layout)
  { path: 'login', component: LoginComponent },

  // Main layout shell with child routes
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'developerai', component: DeveloperaiComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}