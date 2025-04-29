import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container">
      <h1>*** RESULT COMPONENT LOADED (Simplified) ***</h1>
      <p>Waiting for videogame integration...</p>
      <button class="btn primary" routerLink="/">Volver a Clasificar</button>
    </div>
  `,
  styles: [`
    .container { padding: 20px; text-align: center; }
    h1 { color: green; }
    .btn { padding: 10px 20px; margin-top: 20px; }
    .primary { background-color: #2ecc71; color: white; border: none; border-radius: 5px; cursor: pointer; }
  `]
})
export class ResultComponent implements OnInit {
  private router = inject(Router);

  constructor() {
    // Temporarily remove complex logic
    console.log('*** ResultComponent constructor (Simplified) ***');
    // const state = history.state;
    // const navigation = this.router.getCurrentNavigation();
    // ... remove state/sessionStorage logic for now ...
  }

  ngOnInit() {
    // Temporarily remove complex logic
    console.log('*** ResultComponent ngOnInit (Simplified) ***');
    // this.isLoading = false;
    // ... remove classification check and redirect logic for now ...
  }
}