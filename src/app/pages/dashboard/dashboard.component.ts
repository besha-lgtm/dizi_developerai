import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  NgZone
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface DashboardStats {
  total_conversations: number;
  total_tokens_used: number;
  daily_requests_left: number;
  daily_request_limit: number;
  monthly_token_limit: number;
  model: string;
  current_year: number;
  monthly_usage: { month: string; tokens: number }[];
}

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('tokenChart', { static: false }) chartRef!: ElementRef<HTMLCanvasElement>;

  stats: DashboardStats | null = null;
  loading = true;
  error = false;
  private chart: Chart | null = null;
  private dataLoaded = false;
  private viewReady = false;

  // Animated counters
  animConversations = 0;
  animTokens = 0;
  animDailyLeft = 0;

  // Highlight: current month name
  get currentMonthLabel(): string {
    if (!this.stats) return '';
    const months = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
    return months[new Date().getMonth()];
  }

  get currentMonthTokens(): number {
    if (!this.stats) return 0;
    const m = new Date().getMonth();
    return this.stats.monthly_usage[m]?.tokens ?? 0;
  }

  constructor(private http: HttpClient, private ngZone: NgZone) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.dataLoaded) {
      this.buildChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = false;
    this.http.get<DashboardStats>('http://localhost:8000/dashboard').subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
        this.dataLoaded = true;
        this.animateCounters();
        if (this.viewReady) {
          setTimeout(() => this.buildChart(), 50);
        }
      },
      error: () => {
        this.loading = false;
        this.error = true;
      }
    });
  }

  private animateCounters(): void {
    if (!this.stats) return;
    const duration = 1200;
    const fps = 60;
    const steps = (duration / 1000) * fps;

    const targets = {
      conversations: this.stats.total_conversations,
      tokens: this.stats.total_tokens_used,
      dailyLeft: this.stats.daily_requests_left
    };

    let step = 0;
    const interval = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      this.ngZone.run(() => {
        this.animConversations = Math.round(targets.conversations * ease);
        this.animTokens = Math.round(targets.tokens * ease);
        this.animDailyLeft = Math.round(targets.dailyLeft * ease);
      });

      if (step >= steps) {
        clearInterval(interval);
        this.ngZone.run(() => {
          this.animConversations = targets.conversations;
          this.animTokens = targets.tokens;
          this.animDailyLeft = targets.dailyLeft;
        });
      }
    }, 1000 / fps);
  }

  private buildChart(): void {
    if (!this.stats || !this.chartRef?.nativeElement) return;
    this.chart?.destroy();

    const labels = this.stats.monthly_usage.map(m => m.month);
    const data = this.stats.monthly_usage.map(m => m.tokens);

    const ctx = this.chartRef.nativeElement.getContext('2d')!;

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(108, 99, 255, 0.30)');
    gradient.addColorStop(1, 'rgba(108, 99, 255, 0.00)');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Tokens Used',
          data,
          fill: true,
          backgroundColor: gradient,
          borderColor: '#6C63FF',
          borderWidth: 2.5,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#6C63FF',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e1e2e',
            titleColor: '#a0a0c0',
            bodyColor: '#ffffff',
            padding: 10,
            callbacks: {
              label: (ctx) => ` ${(ctx.parsed.y ?? 0).toLocaleString()} tokens`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(160,160,192,0.08)' },
            ticks: { color: '#9999bb', font: { size: 12 } },
            border: { display: false }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(160,160,192,0.08)' },
            ticks: {
              color: '#9999bb',
              font: { size: 12 },
              callback: (val: any) => {
                if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
                return val;
              }
            },
            border: { display: false }
          }
        }
      }
    });
  }

  formatNumber(n: number): string {
    return n?.toLocaleString() ?? '0';
  }
}
