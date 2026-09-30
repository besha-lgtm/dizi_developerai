import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  messages?: ChatMessage[];
  token_usage?: TokenUsage;
}

export interface CodeHelpRequest {
  requirement: string;
  session_id?: string;
}

export interface CodeHelpResponse {
  response: string;
  session_id?: string;
  token_usage?: TokenUsage;
  session?: ChatSession;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Fetch all conversation sessions (for sidebar / dashboard)
   */
  getSessions(): Observable<ChatSession[]> {
    return this.http.get<ChatSession[]>(`${this.baseUrl}/sessions`);
  }

  /**
   * Fetch a single session with all its messages
   */
  getSession(sessionId: string): Observable<ChatSession> {
    return this.http.get<ChatSession>(`${this.baseUrl}/sessions/${sessionId}`);
  }

  /**
   * Create a new blank conversation session
   */
  createSession(title: string = 'New Conversation'): Observable<ChatSession> {
    return this.http.post<ChatSession>(`${this.baseUrl}/sessions`, { title });
  }

  /**
   * Delete an existing conversation session
   */
  deleteSession(sessionId: string): Observable<{ deleted: boolean; session_id: string }> {
    return this.http.delete<{ deleted: boolean; session_id: string }>(`${this.baseUrl}/sessions/${sessionId}`);
  }

  /**
   * Send a prompt to the AI assistant under a specific session
   */
  sendCodeHelpRequest(requirement: string, sessionId?: string): Observable<CodeHelpResponse> {
    const body: CodeHelpRequest = { requirement };
    if (sessionId) {
      body.session_id = sessionId;
    }
    return this.http.post<CodeHelpResponse>(`${this.baseUrl}/help/code`, body);
  }
}
