import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DatasetInfo {
  fileName: string;
  fileSize: string;
  records: number;
  features: number;
  passRate: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface DateRanges {
  training: {
    start: string;
    end: string;
    days: number;
  };
  testing: {
    start: string;
    end: string;
    days: number;
  };
  simulation: {
    start: string;
    end: string;
    days: number;
  };
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingData: string;
  validationData: string;
  simulationData: string;
}

export interface SimulationData {
  time: string;
  sampleId: string;
  prediction: 'Pass' | 'Fail';
  confidence: number;
  temperature: number;
  pressure: number;
  humidity: number;
}

export interface LiveStatistics {
  total: number;
  pass: number;
  fail: number;
  avgConfidence: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectStateService {
  private datasetSubject = new BehaviorSubject<DatasetInfo | null>(null);
  private dateRangesSubject = new BehaviorSubject<DateRanges | null>(null);
  private modelMetricsSubject = new BehaviorSubject<ModelMetrics | null>(null);
  private simulationDataSubject = new BehaviorSubject<SimulationData[]>([]);
  private liveStatsSubject = new BehaviorSubject<LiveStatistics>({
    total: 0,
    pass: 0,
    fail: 0,
    avgConfidence: 0
  });
  private isSimulationRunningSubject = new BehaviorSubject<boolean>(false);

  // Dataset
  get dataset$(): Observable<DatasetInfo | null> {
    return this.datasetSubject.asObservable();
  }

  setDataset(dataset: DatasetInfo) {
    this.datasetSubject.next(dataset);
  }

  // Date Ranges
  get dateRanges$(): Observable<DateRanges | null> {
    return this.dateRangesSubject.asObservable();
  }

  setDateRanges(dateRanges: DateRanges) {
    this.dateRangesSubject.next(dateRanges);
  }

  // Model Metrics
  get modelMetrics$(): Observable<ModelMetrics | null> {
    return this.modelMetricsSubject.asObservable();
  }

  setModelMetrics(metrics: ModelMetrics) {
    this.modelMetricsSubject.next(metrics);
  }

  // Simulation Data
  get simulationData$(): Observable<SimulationData[]> {
    return this.simulationDataSubject.asObservable();
  }

  getSimulationData(): SimulationData[] {
    return this.simulationDataSubject.value;
  }

  addSimulationData(data: SimulationData) {
    const currentData = this.simulationDataSubject.value;
    this.simulationDataSubject.next([data, ...currentData.slice(0, 19)]); // Keep last 20 entries
  }

  clearSimulationData() {
    this.simulationDataSubject.next([]);
  }

  // Live Statistics
  get liveStats$(): Observable<LiveStatistics> {
    return this.liveStatsSubject.asObservable();
  }

  updateLiveStats(stats: LiveStatistics) {
    this.liveStatsSubject.next(stats);
  }

  // Simulation State
  get isSimulationRunning$(): Observable<boolean> {
    return this.isSimulationRunningSubject.asObservable();
  }

  getIsSimulationRunning(): boolean {
    return this.isSimulationRunningSubject.value;
  }

  setSimulationRunning(running: boolean) {
    this.isSimulationRunningSubject.next(running);
  }

  // Reset all data
  reset() {
    this.datasetSubject.next(null);
    this.dateRangesSubject.next(null);
    this.modelMetricsSubject.next(null);
    this.simulationDataSubject.next([]);
    this.liveStatsSubject.next({ total: 0, pass: 0, fail: 0, avgConfidence: 0 });
    this.isSimulationRunningSubject.next(false);
  }
}