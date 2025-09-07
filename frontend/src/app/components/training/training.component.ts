import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProjectStateService, ModelMetrics, DateRanges } from '../../services/project-state';
import { SimulationService } from '../../services/simulation';
import { Api, TrainResponse } from '../../services/api';

@Component({
  selector: 'app-training',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './training.html',
  styleUrls: ['./training.scss']
})
export class TrainingComponent implements OnInit {
  modelMetrics: ModelMetrics | null = null;
  isTraining = false;
  isTrained = false;
  dateRanges: DateRanges | null = null;
  cmUrl: string | null = null;
  rocUrl: string | null = null;

  constructor(
    private projectState: ProjectStateService,
    private simulationService: SimulationService,
    private router: Router,
    private api: Api
  ) {}

  ngOnInit() {
    this.projectState.modelMetrics$.subscribe(metrics => {
      this.modelMetrics = metrics;
      if (metrics) {
        this.isTrained = true;
        this.loadPerformancePngs();
      }
    });

    this.projectState.dateRanges$.subscribe(dateRanges => {
      this.dateRanges = dateRanges;
    });
  }

  async trainModel() {
    if (!this.dateRanges) {
      alert('Please configure date ranges first');
      return;
    }

    this.isTraining = true;
    try {
      const resp = await this.api.trainModel({ model: 'sklearn_logreg' }).toPromise();
      if (resp) {
        this.modelMetrics = resp.metrics;
        this.isTrained = true;
        this.projectState.setModelMetrics(resp.metrics);
        await this.loadPerformancePngs();
        alert('Model trained successfully!');
      }
    } catch (error: any) {
      console.error('Training error:', error);
      alert(`Training failed: ${error.error?.detail || error.message}`);
    } finally {
      this.isTraining = false;
    }
  }

  private async loadPerformancePngs() {
    try {
      const [cmBlob, rocBlob] = await Promise.all([
        this.api.getConfusionMatrixPng().toPromise().catch(() => null),
        this.api.getRocPng().toPromise().catch(() => null)
      ]);
      if (cmBlob) {
        if (this.cmUrl) URL.revokeObjectURL(this.cmUrl);
        this.cmUrl = URL.createObjectURL(cmBlob);
      }
      if (rocBlob) {
        if (this.rocUrl) URL.revokeObjectURL(this.rocUrl);
        this.rocUrl = URL.createObjectURL(rocBlob);
      }
    } catch {}
  }

  onNext() {
    if (this.isTrained) {
      this.router.navigate(['/simulation']);
    }
  }

  // Generate mock training data for charts
  getTrainingMetricsData() {
    return [
      { epoch: 1, accuracy: 0.7, loss: 0.9 },
      { epoch: 2, accuracy: 0.75, loss: 0.8 },
      { epoch: 3, accuracy: 0.8, loss: 0.7 },
      { epoch: 4, accuracy: 0.82, loss: 0.65 },
      { epoch: 5, accuracy: 0.85, loss: 0.6 },
      { epoch: 6, accuracy: 0.87, loss: 0.55 },
      { epoch: 7, accuracy: 0.89, loss: 0.5 },
      { epoch: 8, accuracy: 0.91, loss: 0.45 },
      { epoch: 9, accuracy: 0.92, loss: 0.4 },
      { epoch: 10, accuracy: 0.93, loss: 0.35 },
      { epoch: 11, accuracy: 0.94, loss: 0.3 },
      { epoch: 12, accuracy: 0.94, loss: 0.28 },
      { epoch: 13, accuracy: 0.94, loss: 0.26 },
      { epoch: 14, accuracy: 0.94, loss: 0.24 },
      { epoch: 15, accuracy: 0.94, loss: 0.22 },
      { epoch: 16, accuracy: 0.94, loss: 0.21 },
      { epoch: 17, accuracy: 0.94, loss: 0.2 },
      { epoch: 18, accuracy: 0.94, loss: 0.2 },
      { epoch: 19, accuracy: 0.94, loss: 0.2 },
      { epoch: 20, accuracy: 0.94, loss: 0.2 }
    ];
  }

  getModelPerformanceData() {
    return [
      { label: 'True Positive', value: 65, color: '#10b981' },
      { label: 'True Negative', value: 25, color: '#3b82f6' },
      { label: 'False Positive', value: 5, color: '#f59e0b' },
      { label: 'False Negative', value: 5, color: '#ef4444' }
    ];
  }

  getAccuracyPoints(): string {
    const data = this.getTrainingMetricsData();
    const points = data.map((item, index) => {
      const x = 40 + (index * 16);
      const y = 190 - (item.accuracy * 150);
      return `${x},${y}`;
    });
    return points.join(' ');
  }

  getLossPoints(): string {
    const data = this.getTrainingMetricsData();
    const points = data.map((item, index) => {
      const x = 40 + (index * 16);
      const y = 190 - (item.loss * 150);
      return `${x},${y}`;
    });
    return points.join(' ');
  }

  getDonutPath(value: number): string {
    const circumference = 2 * Math.PI * 80;
    const percentage = value / 100;
    return `${circumference * percentage} ${circumference}`;
  }

  getDonutOffset(index: number): number {
    const circumference = 2 * Math.PI * 80;
    let offset = 0;
    for (let i = 0; i < index; i++) {
      const data = this.getModelPerformanceData();
      offset += (data[i].value / 100) * circumference;
    }
    return -offset;
  }
}
