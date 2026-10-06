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

export interface DailyUsageItem {
  date: string;
  full_date: string;
  tokens: number;
  requests: number;
}

export interface MonthlyUsageItem {
  month: string;
  tokens: number;
}

export interface DashboardStats {
  total_conversations: number;
  total_tokens_used: number;
  daily_requests_left: number;
  daily_request_limit: number;
  monthly_token_limit: number;
  model: string;
  current_year: number;
  monthly_usage: MonthlyUsageItem[];
  daily_usage: DailyUsageItem[];
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
  chartMode: 'daily' | 'monthly' = 'daily';
  private chart: Chart | null = null;
  private dataLoaded = false;
  private viewReady = false;

  // Animated counters
  animConversations = 0;
  animTokens = 0;
  animDailyLeft = 0;

  get chartTitle(): string {
    return this.chartMode === 'daily'
      ? 'Daily Token Usage (Project Timeline)'
      : `Monthly Token Usage (${this.stats?.current_year ?? ''})`;
  }

  get chartSubtitle(): string {
    return this.chartMode === 'daily'
      ? 'Accurate tokens consumed per day from actual developer activity'
      : 'Accurate monthly trend of Gemini API tokens consumed';
  }

  get chartBadgeLabel(): string {
    if (!this.stats) return '';
    if (this.chartMode === 'daily') {
      const daily = this.stats.daily_usage ?? [];
      if (daily.length === 0) return 'No activity yet';
      const last = daily[daily.length - 1];
      return `Latest (${last.date}): ${this.formatNumber(last.tokens)} tokens`;
    } else {
      const months = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
      const m = new Date().getMonth();
      const currentMonthTokens = this.stats.monthly_usage?.[m]?.tokens ?? 0;
      return `${months[m]}: ${this.formatNumber(currentMonthTokens)} tokens`;
    }
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

  setChartMode(mode: 'daily' | 'monthly'): void {
    if (this.chartMode === mode) return;
    this.chartMode = mode;
    this.buildChart();
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

    const isDaily = this.chartMode === 'daily';
    const labels = isDaily
      ? (this.stats.daily_usage || []).map(d => d.date)
      : (this.stats.monthly_usage || []).map(m => m.month);

    const data = isDaily
      ? (this.stats.daily_usage || []).map(d => d.tokens)
      : (this.stats.monthly_usage || []).map(m => m.tokens);

    const ctx = this.chartRef.nativeElement.getContext('2d')!;

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(108, 99, 255, 0.32)');
    gradient.addColorStop(1, 'rgba(108, 99, 255, 0.00)');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: isDaily ? 'Daily Tokens' : 'Monthly Tokens',
          data,
          fill: true,
          backgroundColor: gradient,
          borderColor: '#6C63FF',
          borderWidth: 2.5,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#6C63FF',
          pointBorderWidth: 2.5,
          pointRadius: 6,
          pointHoverRadius: 8,
          tension: isDaily ? 0.25 : 0
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
            padding: 12,
            boxPadding: 4,
            usePointStyle: true,
            callbacks: {
              title: (items) => {
                const idx = items[0]?.dataIndex ?? 0;
                if (isDaily && this.stats?.daily_usage?.[idx]) {
                  const item = this.stats.daily_usage[idx];
                  return `${item.full_date} (${item.date})`;
                }
                return items[0]?.label ?? '';
              },
              label: (ctx) => {
                const idx = ctx.dataIndex;
                const val = (ctx.parsed.y ?? 0).toLocaleString();
                const lines = [` Tokens: ${val}`];
                if (isDaily && this.stats?.daily_usage?.[idx]?.requests) {
                  lines.push(` Requests: ${this.stats.daily_usage[idx].requests} queries`);
                }
                return lines;
              }
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
