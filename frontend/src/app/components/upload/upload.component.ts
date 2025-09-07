import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProjectStateService, DatasetInfo } from '../../services/project-state';
import { SimulationService } from '../../services/simulation';
import { Api } from '../../services/api';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload.html',
  styleUrls: ['./upload.scss']
})
export class UploadComponent implements OnInit {
  dataset: DatasetInfo | null = null;
  isUploading = false;

  constructor(
    private projectState: ProjectStateService,
    private simulationService: SimulationService,
    private router: Router,
    private api: Api
  ) {}

  ngOnInit() {
    this.projectState.dataset$.subscribe(dataset => {
      this.dataset = dataset;
    });

    // Load existing dataset metadata
    this.loadDatasetMetadata();
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isUploading = true;
      try {
        const result = await this.api.uploadDataset(file).toPromise();
        if (result) {
          this.dataset = result;
          this.projectState.setDataset(result);
          alert('Dataset uploaded and processed successfully!');
        }
      } catch (error: any) {
        console.error('Upload error:', error);
        alert(`Upload failed: ${error.error?.detail || error.message}`);
      } finally {
        this.isUploading = false;
      }
    }
  }

  private async loadDatasetMetadata() {
    try {
      const metadata = await this.api.getDatasetMetadata().toPromise();
      if (metadata) {
        this.dataset = metadata;
        this.projectState.setDataset(metadata);
      }
    } catch (error) {
      console.log('No existing dataset metadata found');
    }
  }

  onNext() {
    if (this.dataset) {
      this.router.navigate(['/date-ranges']);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
