import { Component } from '@angular/core';

@Component({
  selector: 'app-developerai',
  standalone: false,
  templateUrl: './developerai.component.html',
  styleUrl: './developerai.component.css'
})
export class DeveloperaiComponent {
  isChatOpen = false;
  isModelDropdownOpen = false;
  
  models = [
    'Gemini 3.8 Flash Medium',
    'Gemini 3.7 Flash Medium',
    'Gemini 3.6 Flash Medium',
    'Gemini 3.1 Pro Low',
    'Claude Sonnet 4.6 (Thinking)',
    'Claude Opus 4.6 (Thinking)',
    'GPT-OSS 120B (Medium)'
  ];
  selectedModel = 'Gemini 3.1 Pro Low';

  chatHistory = [
    { title: 'Help with Angular routing' },
    { title: 'Explain RxJS observables' },
    { title: 'Setup PrimeNG components' }
  ];

  messages = [
    { sender: 'ai', text: 'Hello! I am Developer AI. How can I assist you today?' }
  ];

  userInput = '';

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
  }

  toggleModelDropdown() {
    this.isModelDropdownOpen = !this.isModelDropdownOpen;
  }

  selectModel(model: string) {
    this.selectedModel = model;
    this.isModelDropdownOpen = false;
  }

  sendMessage() {
    if (this.userInput.trim()) {
      this.messages.push({ sender: 'user', text: this.userInput });
      const prompt = this.userInput;
      this.userInput = '';
      
      // Simulate AI response
      setTimeout(() => {
        this.messages.push({ sender: 'ai', text: `This is a simulated response to: "${prompt}" using ${this.selectedModel}.` });
      }, 1000);
    }
  }


}
