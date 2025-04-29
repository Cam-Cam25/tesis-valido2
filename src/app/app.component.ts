import { Component } from '@angular/core';
// Remove the import for PhotoAnalyzerComponent
// import { PhotoAnalyzerComponent } from './components/photo-analyzer/photo-analyzer.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  // Only import RouterOutlet here
  imports: [RouterOutlet],
  template: `
    <div class="main-container">
      <!-- Remove the hardcoded component -->
      <!-- <app-photo-analyzer></app-photo-analyzer> -->

      <!-- Add the router-outlet for Angular Router to use -->
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .main-container {
      min-height: 100vh;
      background-color: #f0f2f5;
      padding: 20px;
    }
  `]
})
export class AppComponent {}
