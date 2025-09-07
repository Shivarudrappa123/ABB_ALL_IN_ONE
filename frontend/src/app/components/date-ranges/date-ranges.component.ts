import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProjectStateService, DateRanges } from '../../services/project-state';
import { SimulationService } from '../../services/simulation';
import { Api } from '../../services/api';

@Component({
  selector: 'app-date-ranges',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './date-ranges.html',
  styleUrls: ['./date-ranges.scss']
})
export class DateRangesComponent implements OnInit, OnDestroy {
  dateRanges: DateRanges | null = null;
  isValidated = false;
  summaryUrl: string | null = null;

  // Form data
  trainingStart = '2021-01-01';
  trainingEnd = '2021-08-31';
  testingStart = '2021-09-01';
  testingEnd = '2021-10-31';
  simulationStart = '2021-11-01';
  simulationEnd = '2021-12-31';

  constructor(
    private projectState: ProjectStateService,
    private simulationService: SimulationService,
    private router: Router,
    private http: HttpClient,
    private api: Api
  ) {}

  ngOnInit() {
    this.projectState.dateRanges$.subscribe(dateRanges => {
      if (dateRanges) {
        this.dateRanges = dateRanges;
        this.trainingStart = dateRanges.training.start;
        this.trainingEnd = dateRanges.training.end;
        this.testingStart = dateRanges.testing.start;
        this.testingEnd = dateRanges.testing.end;
        this.simulationStart = dateRanges.simulation.start;
        this.simulationEnd = dateRanges.simulation.end;
        this.isValidated = true;
        this.loadSummaryPng();
      }
    });
  }

  ngOnDestroy() {
    if (this.summaryUrl) {
      URL.revokeObjectURL(this.summaryUrl);
    }
  }

  async validateRanges() {
    const trainingDays = this.calculateDays(this.trainingStart, this.trainingEnd);
    const testingDays = this.calculateDays(this.testingStart, this.testingEnd);
    const simulationDays = this.calculateDays(this.simulationStart, this.simulationEnd);

    const dateRanges: DateRanges = {
      training: {
        start: this.trainingStart,
        end: this.trainingEnd,
        days: trainingDays
      },
      testing: {
        start: this.testingStart,
        end: this.testingEnd,
        days: testingDays
      },
      simulation: {
        start: this.simulationStart,
        end: this.simulationEnd,
        days: simulationDays
      }
    };

    try {
      const result = await this.http.post<DateRanges>('/api/dateranges/validate', dateRanges).toPromise();
      
      if (result) {
        this.projectState.setDateRanges(result);
        this.isValidated = true;
        await this.loadSummaryPng();
        alert('Date ranges validated and saved successfully!');
      }
    } catch (error: any) {
      console.error('Validation error:', error);
      alert(`Validation failed: ${error.error?.message || error.message}`);
    }
  }

  private async loadSummaryPng() {
    try {
      const blob = await this.api.getDateRangesSummaryPng().toPromise();
      if (blob) {
        if (this.summaryUrl) URL.revokeObjectURL(this.summaryUrl);
        this.summaryUrl = URL.createObjectURL(blob);
      }
    } catch (e) {
      console.log('Cannot load summary PNG yet:', e);
    }
  }

  onNext() {
    if (this.isValidated) {
      this.router.navigate(['/training']);
    }
  }

  calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  // Generate mock data for chart
  getChartData() {
    return [
      { month: 'Jan', value: 95, period: 'training' },
      { month: 'Feb', value: 88, period: 'training' },
      { month: 'Mar', value: 92, period: 'training' },
      { month: 'Apr', value: 85, period: 'training' },
      { month: 'May', value: 65, period: 'training' },
      { month: 'Jun', value: 95, period: 'training' },
      { month: 'Jul', value: 78, period: 'training' },
      { month: 'Aug', value: 82, period: 'training' },
      { month: 'Sep', value: 80, period: 'testing' },
      { month: 'Oct', value: 78, period: 'testing' },
      { month: 'Nov', value: 65, period: 'simulation' },
      { month: 'Dec', value: 60, period: 'simulation' }
    ];
  }
}
