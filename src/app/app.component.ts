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
      width: 100%;
      margin: 0;
      padding: 0;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
  `]
})
export class AppComponent {}
