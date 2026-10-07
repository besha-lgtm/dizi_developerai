import { Component, OnInit } from '@angular/core';
import { ChatService, ChatMessage, ChatSession } from './chat.service';

@Component({
  selector: 'app-developerai',
  standalone: false,
  templateUrl: './developerai.component.html',
  styleUrl: './developerai.component.css'
})
export class DeveloperaiComponent implements OnInit {
  sessions: ChatSession[] = [];
  activeSessionId: string | null = null;
  activeSession: ChatSession | null = null;

  messages: ChatMessage[] = [];
  userInput: string = '';
  isLoading: boolean = false;
  isSessionsLoading: boolean = false;
  isHistorySidebarOpen: boolean = true;
  errorMessage: string | null = null;

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.loadSessionsList(true);
  }

  /**
   * Load the list of sessions from backend and optionally auto-select the active one
   */
  loadSessionsList(autoSelect: boolean = false): void {
    this.isSessionsLoading = true;
    this.chatService.getSessions().subscribe({
      next: (sessions) => {
        this.sessions = sessions;
        this.isSessionsLoading = false;

        if (autoSelect) {
          const savedSessionId = localStorage.getItem('active_session_id');
          if (savedSessionId && this.sessions.some(s => s.id === savedSessionId)) {
            this.selectSession(savedSessionId);
          } else if (this.sessions.length > 0) {
            this.selectSession(this.sessions[0].id);
          } else {
            this.startNewChat();
          }
        } else {
          // Sync the active session's token_usage from the refreshed list
          // so the header token badge stays up-to-date without a full reload.
          if (this.activeSessionId) {
            const updated = sessions.find(s => s.id === this.activeSessionId);
            if (updated && this.activeSession) {
              this.activeSession.token_usage = updated.token_usage;
              this.activeSession.message_count = updated.message_count;
              this.activeSession.updated_at = updated.updated_at;
            }
          }
        }
      },
      error: (err) => {
        console.error('Failed to load sessions:', err);
        this.isSessionsLoading = false;
      }
    });
  }

  /**
   * Select and load a conversation session
   */
  selectSession(sessionId: string): void {
    if (this.isLoading) return;

    this.activeSessionId = sessionId;
    localStorage.setItem('active_session_id', sessionId);

    this.chatService.getSession(sessionId).subscribe({
      next: (session) => {
        this.activeSession = session;
        this.messages = session.messages || [];
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Failed to load session details:', err);
      }
    });
  }

  /**
   * Start a fresh new chat session
   */
  startNewChat(): void {
    if (this.isLoading) return;
    this.activeSessionId = null;
    this.activeSession = null;
    this.messages = [];
    this.userInput = '';
    this.errorMessage = null;
    localStorage.removeItem('active_session_id');
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string, event: MouseEvent): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      this.chatService.deleteSession(sessionId).subscribe({
        next: () => {
          this.sessions = this.sessions.filter(s => s.id !== sessionId);
          if (this.activeSessionId === sessionId) {
            // Auto-select the next available session after deletion
            if (this.sessions.length > 0) {
              this.selectSession(this.sessions[0].id);
            } else {
              this.startNewChat();
            }
          }
        },
        error: (err) => {
          console.error('Failed to delete session:', err);
        }
      });
    }
  }

  /**
   * Toggle the conversation history drawer
   */
  toggleHistorySidebar(): void {
    this.isHistorySidebarOpen = !this.isHistorySidebarOpen;
  }

  /**
   * Send user prompt to the AI assistant
   */
  sendMessage(): void {
    const trimmed = this.userInput.trim();
    if (!trimmed || this.isLoading) {
      return;
    }

    const tempUserMsg: ChatMessage = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString()
    };

    // Display user message optimistically
    this.messages.push(tempUserMsg);
    const sentInput = trimmed;
    this.userInput = '';
    this.errorMessage = null;
    this.isLoading = true;
    this.scrollToBottom();

    const currentSessionId = this.activeSessionId || undefined;

    this.chatService.sendCodeHelpRequest(trimmed, currentSessionId).subscribe({
      next: (res) => {
        const aiResponse = res?.response?.trim()
          ? res.response
          : 'No response received from the AI service.';

        this.messages.push({
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date().toISOString()
        });

        // Set active session from backend response
        if (res.session_id) {
          this.activeSessionId = res.session_id;
          localStorage.setItem('active_session_id', res.session_id);
        }
        if (res.session) {
          this.activeSession = res.session;
        }

        // Refresh the sessions list so the new/updated title appears
        this.loadSessionsList(false);

        this.isLoading = false;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('API error:', err);

        // Remove the user message that did not get an output so it disappears!
        const msgIdx = this.messages.indexOf(tempUserMsg);
        if (msgIdx !== -1) {
          this.messages.splice(msgIdx, 1);
        }

        // Restore prompt back to input box so the user can easily retry
        this.userInput = sentInput;

        // Show friendly error notification
        const detail = err?.error?.detail;
        this.errorMessage = detail
          ? `AI service: ${detail}`
          : 'Failed to get a response from the AI service. Please try again.';

        setTimeout(() => {
          this.errorMessage = null;
        }, 6000);

        this.isLoading = false;
        this.scrollToBottom();
      }
    });
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const container = document.querySelector('.chat-messages');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }
}
