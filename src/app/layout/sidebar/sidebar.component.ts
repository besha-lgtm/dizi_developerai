import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { SidebarService } from '../sidebar/sidebar.service';
import { Subscription } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {

  isCollapsed = false;
  isMobile = false;
  openModule: string | null = null;
  
  private sub!: Subscription;
  private readonly MOBILE_BREAKPOINT = 1024;

  constructor(
    private sidebarService: SidebarService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkScreenSize();

    this.sub = this.sidebarService.sidebarState$.subscribe(state => {
      this.isCollapsed = state;
      if (state) {
        document.body.classList.add('sidebar-collapsed');
      } else {
        document.body.classList.remove('sidebar-collapsed');
      }
    });

    // Listen to route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.setModuleFromRoute(event.urlAfterRedirects);
      });

    // Run once on load
    this.setModuleFromRoute(this.router.url);
  }

  setModuleFromRoute(url: string) {
    if (url.startsWith('/transaction')) {
      this.openModule = 'transaction';
    } else if (url.startsWith('/master')) {
      this.openModule = 'master';
    } else if (url.startsWith('/reports')) {
      this.openModule = 'reports';
    } else if (url.startsWith('/machine')) {
      this.openModule = 'machine';
    } else {
      this.openModule = null;
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  toggleModule(module: string) {
    if (this.openModule === module) {
      this.openModule = null;
    } else {
      this.openModule = module;
    }
  }

  onNavClick() {
    if (this.isMobile) {
      this.sidebarService.setState(true); // collapsed = hidden on mobile
    }
  }

  closeSidebar() {
    this.sidebarService.setState(true);
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= this.MOBILE_BREAKPOINT;

    // Auto-collapse when entering mobile
    if (this.isMobile && !wasMobile) {
      this.sidebarService.setState(true);
    }
    // Auto-expand when leaving mobile (back to desktop)
    if (!this.isMobile && wasMobile) {
      this.sidebarService.setState(false);
    }
  }

  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}
