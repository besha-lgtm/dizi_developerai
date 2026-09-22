import { Component, Output, EventEmitter } from '@angular/core';
import { SidebarService } from '../sidebar/sidebar.service';
import { HeaderService, HeaderConfig } from './header.service';
import { Observable } from 'rxjs';
import { LoginService } from '../../login/login.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {

  @Output() addNewClicked = new EventEmitter<void>();

  headerConfig$: Observable<HeaderConfig>;

  constructor(
    private sidebarService: SidebarService,
    private headerService: HeaderService,
    private loginService: LoginService,
    private router: Router
  ) {
    this.headerConfig$ = this.headerService.headerConfig$;
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  onAddNew(): void {
    this.addNewClicked.emit();
  }

  logout(): void {
    this.loginService.logout();
    this.router.navigate(['/login']);
  }
}