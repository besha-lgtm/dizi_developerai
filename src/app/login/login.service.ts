import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private _isLoggedIn = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this._isLoggedIn.asObservable();

  constructor(private http: HttpClient) {}

  private hasToken(): boolean {
    return !!sessionStorage.getItem('token');
  }

  login(values: any): Observable<any> {
    const { email, password } = values;
    if (email === 'admin@gmail.com' && password === 'Admin@123') {
      const mockRes = { token: 'mock-static-token' };
      sessionStorage.setItem('token', mockRes.token);
      this._isLoggedIn.next(true);
      return of(mockRes);
    } else {
      return throwError(() => ({ error: { message: 'Invalid email or password' } }));
    }
  }

  logout(): void {
    sessionStorage.removeItem('token');
    this._isLoggedIn.next(false);
  }

  token() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + sessionStorage.getItem('token'),
      }),
    };
  }

  isLoggedInSync(): boolean {
    return this._isLoggedIn.value;
  }
}