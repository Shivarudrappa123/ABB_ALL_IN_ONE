import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { DatasetInfo, ModelMetrics } from './project-state';

export interface TrainRequestBody {
  model?: 'sklearn_logreg' | 'xgboost' | 'lightgbm';
  target?: string;
  test_size?: number;
  random_state?: number;
}

export interface TrainResponse {
  model_id: string;
  algorithm: string;
  metrics: ModelMetrics;
  features: string[];
  target: string;
}

export interface SimulationSample {
  time: string;
  sampleId: string;
  prediction: 'Pass' | 'Fail';
  confidence: number;
  temperature: number;
  pressure: number;
  humidity: number;
}

@Injectable({ providedIn: 'root' })
export class Api {
  constructor(private http: HttpClient) {}

  uploadDataset(file: File): Observable<DatasetInfo> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<DatasetInfo>('/api/upload/dataset', formData);
  }

  getDatasetMetadata(): Observable<DatasetInfo> {
    return this.http.get<DatasetInfo>('/api/upload/metadata');
  }

  trainModel(body: TrainRequestBody = {}): Observable<TrainResponse> {
    const payload: TrainRequestBody = {
      model: body.model ?? 'sklearn_logreg',
      target: body.target,
      test_size: body.test_size ?? 0.2,
      random_state: body.random_state ?? 42
    };
    return this.http.post<TrainResponse>('/api/train', payload);
  }

  getDateRangesSummaryPng(): Observable<Blob> {
    return this.http.get('/api/dateranges/summary.png', { responseType: 'blob' });
  }

  getTrainingMetrics(): Observable<any> {
    return this.http.get('/api/training/metrics');
  }

  getConfusionMatrixPng(): Observable<Blob> {
    return this.http.get('/api/training/confusion-matrix.png', { responseType: 'blob' });
  }

  getRocPng(): Observable<Blob> {
    return this.http.get('/api/training/roc.png', { responseType: 'blob' });
  }

  // Simulation
  startSimulation(): Observable<{ running: boolean }> {
    return this.http.post<{ running: boolean }>('/api/simulation/start', {});
  }

  stopSimulation(): Observable<{ running: boolean }> {
    return this.http.post<{ running: boolean }>('/api/simulation/stop', {});
  }

  clearSimulation(): Observable<{ cleared: boolean }> {
    return this.http.post<{ cleared: boolean }>('/api/simulation/clear', {});
  }

  nextSimulationSample(): Observable<SimulationSample> {
    return this.http.get<SimulationSample>('/api/simulation/next');
  }
}
