import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectStateService, SimulationData, LiveStatistics } from '../../services/project-state';
import { SimulationService } from '../../services/simulation';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './simulation.html',
  styleUrls: ['./simulation.scss']
})
export class SimulationComponent implements OnInit, OnDestroy {
  simulationData: SimulationData[] = [];
  liveStats: LiveStatistics = { total: 0, pass: 0, fail: 0, avgConfidence: 0 };
  isSimulationRunning = false;
  isSimulationComplete = false;
  private simulationSubscription?: Subscription;

  // Chart data
  qualityScores: number[] = [];
  confidencePercentage = 95;

  constructor(
    private projectState: ProjectStateService,
    private simulationService: SimulationService
  ) {}

  ngOnInit() {
    this.projectState.simulationData$.subscribe(data => {
      this.simulationData = data;
      this.updateQualityScores();
      this.updateConfidence();
    });

    this.projectState.liveStats$.subscribe(stats => {
      this.liveStats = stats;
    });

    this.projectState.isSimulationRunning$.subscribe(running => {
      this.isSimulationRunning = running;
    });
  }

  ngOnDestroy() {
    if (this.simulationSubscription) {
      this.simulationSubscription.unsubscribe();
    }
  }

  startSimulation() {
    this.isSimulationComplete = false;
    this.simulationService.clearSimulationData();
    this.qualityScores = [];
    this.confidencePercentage = 0;
    
    this.simulationSubscription = this.simulationService.startSimulation().subscribe({
      next: () => {
        // Samples are handled via state subscriptions
      },
      complete: () => {
        this.isSimulationComplete = true;
        this.isSimulationRunning = false;
      }
    });
  }

  stopSimulation() {
    if (this.simulationSubscription) {
      this.simulationSubscription.unsubscribe();
      this.simulationSubscription = undefined;
    }
    this.simulationService.stopSimulation();
  }

  restartSimulation() {
    this.startSimulation();
  }

  private updateQualityScores() {
    if (this.simulationData.length > 0) {
      // Generate quality scores based on prediction confidence
      this.qualityScores = this.simulationData.map(data => {
        // Quality score is based on confidence, with some variation
        const baseScore = data.confidence;
        const variation = (Math.random() - 0.5) * 10; // ±5 points variation
        return Math.max(0, Math.min(100, baseScore + variation));
      });
    }
  }

  private updateConfidence() {
    if (this.simulationData.length > 0) {
      // Use the latest sample's confidence for the donut
      this.confidencePercentage = Math.round(this.simulationData[0].confidence);
    } else {
      this.confidencePercentage = 0;
    }
  }

  getQualityChartPoints(): string {
    if (this.qualityScores.length === 0) return '';
    
    const points = this.qualityScores.map((score, index) => {
      const x = 50 + (index * 30);
      const y = 200 - (score * 1.8); // Scale to fit chart
      return `${x},${y}`;
    });
    return points.join(' ');
  }

  getConfidenceDonutPath(): string {
    const circumference = 2 * Math.PI * 60;
    const percentage = this.confidencePercentage / 100;
    return `${circumference * percentage} ${circumference}`;
  }

  getConfidenceDonutOffset(): number {
    const circumference = 2 * Math.PI * 60;
    return -circumference * (this.confidencePercentage / 100);
  }
}
