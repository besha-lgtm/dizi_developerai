import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'dizi_intelligence';
  ngOnInit(): void {
    // ✅ TEMPORARY LOGIN SIMULATION
    localStorage.setItem('currentRoleId', 'r3'); // 👈 change role here
  }

}
// 👉 Based on your data:

// r2 → Admin
// r3 → Manager
// r5 → QA