import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit {
  currentStep = 1;

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateCurrentStep(event.url);
      });
  }

  private updateCurrentStep(url: string) {
    switch (url) {
      case '/upload':
        this.currentStep = 1;
        break;
      case '/date-ranges':
        this.currentStep = 2;
        break;
      case '/training':
        this.currentStep = 3;
        break;
      case '/simulation':
        this.currentStep = 4;
        break;
      default:
        this.currentStep = 1;
    }
  }
}