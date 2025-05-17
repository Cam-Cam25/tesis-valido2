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
      <iframe #godotFrame class="game-frame"
              src="/9/9.html" 
              width="800"
              height="482"
              frameborder="0"
              allow="autoplay"
              style="background: #000;"></iframe>
    </div>

  `,
  styles: [`
  .game-frame {
  top: 15%;
  left: 20%;
  position: absolute;
}
    .game-container {
      background-image: url('/images/FONDOJUEGO.svg');
      width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
  position: relative; /* Añadido para poder posicionar elementos absolutos dentro */
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

  private isRedirecting = false;

  private maxRetries = 3;
  private retryDelay = 1000;
  private retryCount = 0;

  private async retryOperation(operation: () => Promise<void>): Promise<void> {
    try {
      await operation();
    } catch (error) {
      if (this.retryCount < this.maxRetries) {
        console.log(`Reintentando operación (intento ${this.retryCount + 1} de ${this.maxRetries})`);
        this.retryCount++;
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.retryOperation(operation);
      }
      throw error;
    }
  }

  private setupFirebaseListener() {
    console.log('Configurando listener de eventos del juego');
    let isEventProcessed = false;

    this.unsubscribe = this.firebaseService.listenToGameEvents((event) => {
      console.log('Evento recibido:', event);
      
      if (event === 'game_over' && !this.isRedirecting && !isEventProcessed) {
        console.log('Procesando evento game_over');
        this.isRedirecting = true;
        isEventProcessed = true;
        
        // Limpiar la suscripción inmediatamente
        if (this.unsubscribe) {
          console.log('Limpiando suscripción de eventos');
          this.unsubscribe();
        }
        
        // Implementar un manejo más robusto de la redirección con reintentos
        const redirectToHome = async () => {
          try {
            await this.retryOperation(async () => {
              console.log('Iniciando proceso de redirección');
              // Limpiar el estado del juego antes de la redirección
              await this.firebaseService.sendGameStartEvent();
              console.log('Estado del juego limpiado exitosamente');
              
              // Forzar una recarga completa de la aplicación
              window.location.href = '/';
            });
          } catch (error) {
            console.error('Error fatal durante la redirección:', error);
            window.location.href = '/';
          }
        };

        // Ejecutar la redirección inmediatamente
        redirectToHome();
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