import { Component } from '@angular/core';
import { ChatService } from './chat.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-developerai',
  standalone: false,
  templateUrl: './developerai.component.html',
  styleUrl: './developerai.component.css'
})
export class DeveloperaiComponent {
  messages: ChatMessage[] = [];
  userInput: string = '';
  isLoading: boolean = false;

  constructor(private chatService: ChatService) {}

  sendMessage(): void {
    const trimmed = this.userInput.trim();
    if (!trimmed || this.isLoading) {
      return;
    }

    // Display user message immediately
    this.messages.push({ role: 'user', content: trimmed });
    this.userInput = '';
    this.isLoading = true;

    this.chatService.sendCodeHelpRequest(trimmed).subscribe({
      next: (res) => {
        const aiResponse = res?.response?.trim()
          ? res.response
          : 'No response received from the AI service.';
        this.messages.push({ role: 'assistant', content: aiResponse });
        this.isLoading = false;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('API error:', err);

        // Extract specific message from FastAPI HTTPException if available
        const detail = err?.error?.detail;
        const userMessage = detail
          ? `AI service error: ${detail}`
          : 'Unable to connect to the AI service. Please try again.';

        this.messages.push({ role: 'assistant', content: userMessage });
        this.isLoading = false;
        this.scrollToBottom();
      }
    });

    this.scrollToBottom();
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
