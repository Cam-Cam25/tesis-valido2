import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
   <div class="game-container">
      <iframe #godotFrame
              src="/godot-game/RRAWR.html" 
              width="340"
              height="190"
              frameborder="0"
              allow="autoplay"
              style="background: #000;"></iframe>
    </div>
  `,
  styles: [`
    .game-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

iframe {
  border: none;
  background: #000;
}
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