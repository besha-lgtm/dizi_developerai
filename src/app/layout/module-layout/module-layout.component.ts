import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
// import { AdminService } from '../../pages/admin/admin/admin.service';
import { filter } from 'rxjs/operators';
import { NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
@Component({
  selector: 'app-module-layout',
  standalone:false,
  templateUrl: './module-layout.component.html',
  styleUrls: ['./module-layout.component.css']
})
export class ModuleLayoutComponent {

  @Input() stats: any[] = [];
  @Input() tabs: any[] = [];

  activeTabIndex = 0;
private destroy$ = new Subject<void>();
    constructor(
      private router: Router,
      // private adminService: AdminService
    ) {}


 

 
  ngOnInit() {
  this.setActiveTabFromRoute();


  this.router.events
  .pipe(
    filter(event => event instanceof NavigationEnd),
    takeUntil(this.destroy$)
  )
  .subscribe(() => {
    this.setActiveTabFromRoute();
  });
}

setActiveTabFromRoute() {
  const url = this.router.url;

  const index = this.tabs.findIndex(tab =>
    url.includes(tab.route)
  );

  this.activeTabIndex = index !== -1 ? index : 0;
}

  trackByStat(index: number, item: any) {
  return item.label;
}
ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
go(route: string) {
  if (this.router.url !== route) {
    this.router.navigate([route]);
  }
}
}