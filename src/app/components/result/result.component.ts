import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';

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
export class ResultComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private firebaseService = inject(FirebaseService);
  private unsubscribe!: () => void;

  constructor() {
    this.setupFirebaseListener();
  }

  private setupFirebaseListener() {
    this.unsubscribe = this.firebaseService.listenToGameEvents((event) => {
      if (event === 'game_over') {
        this.router.navigate(['/']);
      }
    });
  }

  ngOnInit() {
    console.log('ResultComponent initialized');
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}