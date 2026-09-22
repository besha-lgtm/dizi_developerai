import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface Breadcrumb {
  label: string;
  routerLink?: string;
}

export interface HeaderConfig {
  breadcrumbs: Breadcrumb[];
  showFilter?: boolean;
  showAddButton?: boolean;
  addButtonLabel?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HeaderService {
  private configSubject = new BehaviorSubject<HeaderConfig>({
    breadcrumbs: [{ label: 'Home', routerLink: '/dashboard' }],
    showFilter: false,
    showAddButton: false,
    addButtonLabel: ''
  });

  headerConfig$: Observable<HeaderConfig> = this.configSubject.asObservable();

  constructor(private router: Router) {
    this.updateHeaderConfig(this.router.url);
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateHeaderConfig(event.urlAfterRedirects || event.url);
    });
  }

  updateHeaderConfig(url: string): void {
    const breadcrumbs: Breadcrumb[] = [{ label: 'Home', routerLink: '/dashboard' }];
    let showFilter = false;
    let showAddButton = false;
    let addButtonLabel = '';

    if (url.includes('dashboard')) {
      breadcrumbs.push({ label: 'Dashboard' });
    } else if (url.includes('poqr')) {
      breadcrumbs.push({ label: 'PO QR' });
    } else if (url.includes('porecieve')) {
      breadcrumbs.push({ label: 'PO Receive' });
    } else if (url.includes('recieve')) {
      breadcrumbs.push({ label: 'Receive' });
    } else if (url.includes('issue')) {
      breadcrumbs.push({ label: 'Issue' });
    } else if (url.includes('iscan')) {
      breadcrumbs.push({ label: 'Issue', routerLink: '/issue' }, { label: 'Issue Scan' });
    } else if (url.includes('rscan')) {
      breadcrumbs.push({ label: 'Receive', routerLink: '/recieve' }, { label: 'Receive Scan' });
    } else if (url.includes('po-qr')) {
      breadcrumbs.push({ label: 'PO QR Generator' });
    }

    this.configSubject.next({
      breadcrumbs,
      showFilter,
      showAddButton,
      addButtonLabel
    });
  }
}
