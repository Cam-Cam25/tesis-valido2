import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container">
      <div class="header">
        <!-- You can keep or remove the classification badge -->
        <div class="classification-badge" *ngIf="classification">
          Residuo clasificado como: <span [class]="classification.toLowerCase()">{{ classification }}</span>
        </div>
        <div *ngIf="!classification && !isLoading" class="error-message">
          No se recibió la clasificación. Volviendo al inicio...
        </div>
      </div>

      <div class="game-container">
        <!-- Replace placeholder with your game title -->
        <div class="game-placeholder">
          <h1>RRAWR VIDEOGAME</h1>
          <!-- Add any other game elements here -->
        </div>
      </div>

      <div class="controls">
        <button class="btn primary" routerLink="/">Volver a Clasificar</button>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
    }

    h1 {
      color: #2c3e50;
      margin-bottom: 15px;
    }

    .classification-badge {
      display: inline-block;
      padding: 10px 20px;
      border-radius: 20px;
      background-color: #f8f9fa;
      margin-bottom: 20px;
    }

    .classification-badge span {
      font-weight: bold;
      padding: 5px 15px;
      border-radius: 15px;
    }

    .classification-badge span.orgánico {
      background-color: #a5d6a7;
      color: #1b5e20;
    }

    .classification-badge span.inorgánico {
      background-color: #90caf9;
      color: #0d47a1;
    }

    .game-container {
      background-color: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      margin: 20px 0;
      min-height: 500px;
    }

    .game-placeholder {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      min-height: 460px;
      background-color: #f8f9fa;
      border-radius: 8px;
    }

    .controls {
      text-align: center;
      margin-top: 20px;
    }

    .btn {
      padding: 15px 30px;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      font-size: 18px;
      transition: all 0.3s ease;
    }

    .primary {
      background-color: #2ecc71;
      color: white;
    }

    .primary:hover {
      background-color: #27ae60;
    }
    .error-message {
      color: #dc3545;
      margin-top: 15px;
      font-weight: bold;
    }
    /* Optional: Style the game title */
    .game-placeholder h1 {
      font-size: 3em;
      color: #3498db; /* Example color */
      margin-bottom: 20px;
    }
  `]
})
export class ResultComponent implements OnInit {
  classification: string | undefined;
  isLoading = true; // Add loading flag
  private router = inject(Router); // Use inject

  constructor() {
    // Try to get state from history first
    const state = history.state;
    this.classification = state?.classification;
    console.log('ResultComponent constructor - history.state:', state); // Log state

    // Fallback to getCurrentNavigation (less reliable after initial load)
    if (!this.classification) {
      const navigation = this.router.getCurrentNavigation();
      this.classification = navigation?.extras?.state?.['classification'];
      console.log('ResultComponent constructor - getCurrentNavigation state:', navigation?.extras?.state); // Log state
    }
  }

  ngOnInit() {
    this.isLoading = false; // Set loading to false
    console.log(`ResultComponent ngOnInit - Classification received: ${this.classification}`); // Log received classification

    if (!this.classification) {
      console.log('No classification found, redirecting to /'); // Log redirect reason
      // Add a small delay before redirecting to allow user to see message
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 1500);
    }
  }
}