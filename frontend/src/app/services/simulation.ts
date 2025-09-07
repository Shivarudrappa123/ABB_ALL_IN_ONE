import { Injectable } from '@angular/core';
import { Observable, interval, Subject, takeUntil, switchMap, filter, tap } from 'rxjs';
import { ProjectStateService, SimulationData, LiveStatistics } from './project-state';
import { Api, SimulationSample } from './api';

@Injectable({ providedIn: 'root' })
export class SimulationService {
  private stop$ = new Subject<void>();

  constructor(private projectState: ProjectStateService, private api: Api) {}

  startSimulation(): Observable<SimulationData> {
    this.projectState.setSimulationRunning(true);
    this.projectState.clearSimulationData();
    this.stop$.next();

    this.api.startSimulation().subscribe({
      next: () => console.log('[simulation] started'),
      error: (e) => console.error('[simulation] start error', e)
    });

    return interval(1000).pipe(
      takeUntil(this.stop$),
      switchMap(() => this.api.nextSimulationSample()),
      filter(() => this.projectState.getIsSimulationRunning()),
      tap((sample) => {
        const data: SimulationData = {
          time: sample.time,
          sampleId: sample.sampleId,
          prediction: sample.prediction,
          confidence: sample.confidence,
          temperature: sample.temperature,
          pressure: sample.pressure,
          humidity: sample.humidity
        };
        console.log('[simulation] sample', data);
        this.projectState.addSimulationData(data);
        this.updateLiveStatistics();
      }),
    ) as unknown as Observable<SimulationData>;
  }

  stopSimulation() {
    this.projectState.setSimulationRunning(false);
    this.stop$.next();
    this.api.stopSimulation().subscribe({
      next: () => console.log('[simulation] stopped'),
      error: (e) => console.error('[simulation] stop error', e)
    });
  }

  clearSimulationData() {
    this.projectState.clearSimulationData();
    this.api.clearSimulation().subscribe({
      next: () => console.log('[simulation] cleared'),
      error: (e) => console.error('[simulation] clear error', e)
    });
  }

  private updateLiveStatistics() {
    const allData = this.projectState.getSimulationData();
    const total = allData.length;
    const pass = allData.filter(d => d.prediction === 'Pass').length;
    const fail = total - pass;
    const avgConfidence = total > 0 ? Math.round(allData.reduce((s, d) => s + d.confidence, 0) / total) : 0;
    const stats: LiveStatistics = { total, pass, fail, avgConfidence };
    this.projectState.updateLiveStats(stats);
  }
}