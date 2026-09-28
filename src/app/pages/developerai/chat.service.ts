import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CodeHelpRequest {
  requirement: string;
}

export interface CodeHelpResponse {
  response: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly apiUrl = `${environment.apiBaseUrl}/help/code`;

  constructor(private http: HttpClient) {}

  sendCodeHelpRequest(requirement: string): Observable<CodeHelpResponse> {
    const body: CodeHelpRequest = { requirement };
    return this.http.post<CodeHelpResponse>(this.apiUrl, body);
  }
}
