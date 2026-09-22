import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private sidebarState = new BehaviorSubject<boolean>(false); // false = open, true = collapsed
  sidebarState$ = this.sidebarState.asObservable();

  toggle(): void {
    this.sidebarState.next(!this.sidebarState.value);
  }

  setState(collapsed: boolean): void {
    this.sidebarState.next(collapsed);
  }

  getValue(): boolean {
    return this.sidebarState.value;
  }
}
