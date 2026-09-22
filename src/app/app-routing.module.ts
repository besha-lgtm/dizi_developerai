import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DeveloperaiComponent } from './pages/developerai/developerai.component';

const routes: Routes = [
  // Redirect to login
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Login layout
  { path: 'login', component: LoginComponent },

  {path: 'developerai', component: DeveloperaiComponent},

  {path : 'dashboard', component: DashboardComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}