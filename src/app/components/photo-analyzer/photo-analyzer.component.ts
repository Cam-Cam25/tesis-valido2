import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CameraService } from '../../services/camera.service';
import { GeminiService } from '../../services/gemini.service';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-photo-analyzer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">      
      <div class="camera-container">
      <div class="preview">
        <!-- El video se insertará aquí dinámicamente -->
      </div>
      </div>

      <div *ngIf="classification" class="classification">
        <div class="timer" *ngIf="redirectCountdown > 0">
          <p>RRAWR GAME en <br> {{ redirectCountdown }} segundos</p>
        </div>
      </div>

      <div *ngIf="error" class="error">
        <p>{{ error }}</p>
      </div>

      <div *ngIf="classification === 'orgánico'" class="glass-card">
        <img src="/images/TARJETAORGANICA.svg" alt="Contenedor de vidrio" />
      </div>
      <div *ngIf="classification === 'inorgánico'" class="glass-card">
        <img src="/images/TARJETAINORGANICA.svg" alt="Contenedor de vidrio" />
      </div>
    </div>
  `,
  styles: [`
    .container {
  background-image: url('/images/FONDO.svg');
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

.preview {
  /* Aumentamos el tamaño para que sea más visible */
  width: 583px;  /* Ajusta según tus necesidades */
  height: 426px; /* Ajusta según tus necesidades */
  max-width: 90%; /* Para asegurar responsividad */
  
  /* Centramos en la página */
  position: absolute;
  top: 52.1%;
  left: 49%;
  transform: translate(-50%, -50%);
  
  /* Estilo visual */
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.1); /* Un fondo sutil */
  overflow: hidden; /* Para que el video no sobresalga de los bordes redondeados */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2); /* Sombra sutil */
}

.preview video {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}


    .preview img {
      width: 100%;
      border-radius: 12px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .classification {
      margin-top: 30px;
    }

    .result {
      display: inline-block;
      padding: 15px 30px;
      border-radius: 25px;
      font-size: 20px;
      font-weight: bold;
      margin-top: 10px;
    }

    .result.orgánico {
      background-color: #a5d6a7;
      color: #1b5e20;
    }

    .result.inorgánico {
      background-color: #90caf9;
      color: #0d47a1;
    }
  
  .timer {
    font-family: 'Pixelify Sans', sans-serif;
    font-size: 25px;
    background-image: url('/images/TARJETAVACIA.svg');
    color: white;
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 8px;
    box-sizing: border-box;
    right:120px;
    top: 40%;
    width: 200px;
    height: 200px;
}

    .error {
      color: #dc3545;
      margin-top: 20px;
    }

    .glass-card {
            position: fixed;
            left: 80px;
            top: 50%;
            transform: translateY(-50%);
            padding: 15px;
            border-radius: 12px;
            transition: all 0.3s ease-in-out;
            z-index: 1000;
            width: 10%;
        }
        
        .glass-card:hover {
            transform: translateY(-52%);
        }
        
        .glass-card h3 {
            margin-top: 0;
            color: #333;
            font-size: 18px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        
        .glass-card p {
            margin-bottom: 15px;
            line-height: 1.5;
        }
  `]
})
export class PhotoAnalyzerComponent implements OnDestroy {
  imageBase64: string | undefined;
  classification: string | undefined;
  analyzing = false;
  isInRange = true; // Siempre true para permitir la detección continua
  proximityMessage = 'Detectando residuo...'; // Mensaje actualizado
  error: string | undefined;
  isCapturing = false;
  captureInterval: any;
  captureTimeLeft = 35;
  redirectCountdown = 0;
  redirectTimer: any;
  classificationCount = { orgánico: 0, inorgánico: 0 }; // Contador para clasificaciones
  requiredConfidence = 5; // Número de detecciones consistentes requeridas

  private cameraService = inject(CameraService);
  private geminiService = inject(GeminiService);
  private router = inject(Router);
  private firebaseService = inject(FirebaseService);
  private unsubscribe!: () => void;

  constructor() {
    this.setupFirebaseListener();
    // Enviar evento 'start' cuando se inicia el componente
    this.firebaseService.sendGameStartEvent();
  }

  private lastActivationTime = 0;
  private readonly DEBOUNCE_TIME = 3000; // 3 segundos de debounce
  private isProcessing = false;

  private setupFirebaseListener() {
    this.unsubscribe = this.firebaseService.listenToUltrasonicSensor((isActivated) => {
      const currentTime = Date.now();
      if (isActivated && !this.isCapturing && !this.isProcessing && 
          (currentTime - this.lastActivationTime) > this.DEBOUNCE_TIME) {
        this.isProcessing = true;
        this.lastActivationTime = currentTime;
        this.takePicture();
      }
    });
  }



  async takePicture() {
    if (this.isCapturing) {
      this.stopCapture();
      return;
    }

    this.error = undefined;
    this.isCapturing = true;
    this.captureTimeLeft = 35; // Cambiado de 300 a 35 segundos
    this.isProcessing = true;

    try {
      const videoElement = await this.cameraService.startVideoStream();
      const previewDiv = document.querySelector('.preview');
      if (previewDiv) {
        previewDiv.innerHTML = '';
        previewDiv.appendChild(videoElement);
      }

      this.captureInterval = setInterval(async () => {
        if (this.captureTimeLeft <= 0) {
          this.stopCapture();
          return;
        }

        try {
          const canvas = document.createElement('canvas');
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoElement, 0, 0);
            this.imageBase64 = canvas.toDataURL('image/jpeg').split(',')[1];
            await this.classifyWaste();
            this.captureTimeLeft--;
          }
        } catch (error: any) {
          console.error('Error durante la captura automática:', error);
          this.stopCapture();
          this.error = error.message || 'Error al capturar la imagen';
        }
      }, 1000);
    } catch (error: any) {
      console.error('Error al iniciar la captura:', error);
      this.stopCapture();
      this.error = error.message || 'Error al acceder a la cámara. Por favor, verifica los permisos.';
    }
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  private async classifyWaste() {
    if (!this.imageBase64) {
      if (!this.redirectTimer) {
        this.error = 'No hay imagen para analizar';
      }
      return;
    }
  
    if (this.analyzing || this.redirectTimer) {
      return;
    }

    this.analyzing = true;
    this.error = undefined;
    
    try {
      const currentClassification = await this.geminiService.analyzeImage(this.imageBase64);
      
      if (currentClassification && ['orgánico', 'inorgánico'].includes(currentClassification.toLowerCase())) {
        // Incrementar el contador para la clasificación actual
        this.classificationCount[currentClassification.toLowerCase() as keyof typeof this.classificationCount]++;
        
        // Verificar si alguna clasificación alcanzó el umbral de confianza
        const maxCount = Math.max(this.classificationCount.orgánico, this.classificationCount.inorgánico);
        const isConfident = maxCount >= this.requiredConfidence;
        
        if (isConfident) {
          // Determinar la clasificación final
          this.classification = this.classificationCount.orgánico > this.classificationCount.inorgánico ? 'orgánico' : 'inorgánico';
          // Actualizar el resultado en Firebase
          await this.firebaseService.updateClassificationResult(this.classification);
          if (!this.redirectTimer) {
            this.startRedirectTimer();
          }
        } else {
          // Actualizar la clasificación temporal pero continuar detectando
          this.classification = currentClassification;
        }
      }
    } catch (error: any) {
      console.error('Error al clasificar el residuo:', error);
      if (!this.redirectTimer) {
        this.error = error.message || 'Error al clasificar el residuo';
        this.classification = undefined;
      }
    } finally {
      this.analyzing = false;
    }
  }

  private startRedirectTimer() {
    // Stop any previous timer just in case
    if (this.redirectTimer) {
      clearInterval(this.redirectTimer);
    }

    this.redirectCountdown = 5; // Keep the 5-second countdown
    console.log('Starting redirect timer...');
    this.redirectTimer = setInterval(() => {
      if (this.redirectCountdown > 0) {
        this.redirectCountdown--;
      } else {
        clearInterval(this.redirectTimer);
        this.redirectTimer = null;

        // Camera should already be stopped here

        // Modify the navigation call to remove the state object
        console.log(`Redirecting to /result (no classification state passed)`);
        this.router.navigate(['/result']) // Remove the state object here
          .then((success) => {
            if (success) {
              console.log('Navigation to /result successful');
              // Reset state after successful navigation
              this.classification = undefined;
              this.imageBase64 = undefined;
              const previewDiv = document.querySelector('.preview');
              if (previewDiv) previewDiv.innerHTML = ''; // Clear preview
            } else {
              console.log('Navigation to /result failed');
              this.error = 'No se pudo redirigir a la pantalla de resultados.';
            }
          }).catch(error => {
            console.error('Error during navigation to /result:', error);
            this.error = 'Error al redirigir al videojuego';
          });
      }
    }, 1000);
  }

  private stopCapture() {
    this.isCapturing = false;
    this.isProcessing = false; // Resetear el estado de procesamiento
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    
    if (this.redirectTimer) {
      clearInterval(this.redirectTimer);
      this.redirectTimer = null;
    }
    
    this.cameraService.stopVideoStream();
    this.classification = undefined; 
    this.imageBase64 = undefined;
    this.error = undefined;
    this.redirectCountdown = 0;
    this.analyzing = false;
    this.classificationCount = { orgánico: 0, inorgánico: 0 }; // Reiniciar contadores
  }
}