import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CameraService } from '../../services/camera.service';
import { GeminiService } from '../../services/gemini.service';
import { ProximityService } from '../../../app/services/proximity.service';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-photo-analyzer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h1>Clasificador de Residuos</h1>
      
      <div class="status-indicator" [class.active]="isInRange">
        <span class="indicator-text">{{ proximityMessage }}</span>
      </div>

      <div class="preview">
        <!-- El video se insertará aquí dinámicamente -->
      </div>

      <div *ngIf="classification" class="classification">
        <h2>Clasificación del Residuo</h2>
        <div class="result" [class]="classification.toLowerCase()">
          {{ classification }}
        </div>
        <div class="timer" *ngIf="redirectCountdown > 0">
          <p>Redirigiendo al videojuego en {{ redirectCountdown }} segundos</p>
        </div>
      </div>

      <div *ngIf="error" class="error">
        <p>{{ error }}</p>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      text-align: center;
    }

    h1 {
      color: #2c3e50;
      margin-bottom: 30px;
    }

    .status-indicator {
      padding: 15px;
      background-color: #f8d7da;
      border-radius: 8px;
      margin-bottom: 20px;
      transition: all 0.3s ease;
    }

    .status-indicator.active {
      background-color: #d4edda;
    }

    .indicator-text {
      font-size: 16px;
      color: #721c24;
    }

    .status-indicator.active .indicator-text {
      color: #155724;
    }

    .actions {
      margin: 20px 0;
    }

    .btn {
      padding: 15px 30px;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      font-size: 18px;
      transition: all 0.3s ease;
    }

    .btn:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }

    .primary {
      background-color: #2ecc71;
      color: white;
    }

    .primary:not(:disabled):hover {
      background-color: #27ae60;
    }

    .preview {
      margin: 20px auto;
      max-width: 640px;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #f8f9fa;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .preview video {
      width: 100%;
      height: auto;
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
      margin-top: 20px;
      font-size: 16px;
      color: #666;
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.7; }
      100% { opacity: 1; }
    }

    .error {
      color: #dc3545;
      margin-top: 20px;
    }
  `]
})
export class PhotoAnalyzerComponent implements OnDestroy {
  imageBase64: string | undefined;
  classification: string | undefined;
  analyzing = false;
  isInRange = false;
  proximityMessage = 'Acerque el residuo a 36 cm de la cámara';
  error: string | undefined;
  isCapturing = false;
  captureInterval: any;
  captureTimeLeft = 35; // Cambiado de 300 a 35 segundos
  redirectCountdown = 0;
  redirectTimer: any;

  private cameraService = inject(CameraService);
  private geminiService = inject(GeminiService);
  private proximityService = inject(ProximityService);
  private router = inject(Router);
  private firebaseApp = initializeApp(environment.firebase);
  private database = getDatabase(this.firebaseApp);
  private unsubscribe!: () => void;

  constructor() {
    this.startProximityDetection();
    this.setupFirebaseListener();
  }

  private setupFirebaseListener() {
    const sensorRef = ref(this.database, 'SensorUltrasonico/activado');
    this.unsubscribe = onValue(sensorRef, (snapshot) => {
      const isActivated = snapshot.val();
      if (isActivated && !this.isCapturing && this.isInRange) {
        this.takePicture();
      }
    });
  }

  private startProximityDetection() {
    this.proximityService.startDetection().subscribe((distance: number) => {
      // Validar si la distancia está en el rango de 36 cm con un margen de ±2 cm
      this.isInRange = distance >= 34 && distance <= 38;
      this.proximityMessage = this.isInRange
        ? 'Distancia correcta - Listo para capturar'
        : 'Acerque el residuo a 36 cm de la cámara';
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
    if (!this.imageBase64 || !this.isInRange) {
      // Don't show error if we are already counting down, just skip analysis
      if (!this.redirectTimer) {
        this.error = !this.isInRange ? 'Ajuste la distancia del residuo a 36 cm' : 'No hay imagen para analizar';
      }
      return;
    }
  
    // Avoid starting new analysis if redirect timer is already running
    if (this.analyzing || this.redirectTimer) {
      return;
    }

    this.analyzing = true;
    this.error = undefined;
    
    try {
      const currentClassification = await this.geminiService.analyzeImage(this.imageBase64);
      
      if (currentClassification && ['orgánico', 'inorgánico'].includes(currentClassification.toLowerCase())) {
        this.classification = currentClassification; // Update classification display
        
        // Start the redirect timer only if it hasn't been started yet
        if (!this.redirectTimer) {
          this.startRedirectTimer();
        }
      } else {
         // If classification is not valid and timer hasn't started, maybe show an error or clear previous invalid classification
         if (!this.redirectTimer) {
            this.classification = undefined; 
            // Optionally: throw new Error('Clasificación no válida'); 
         }
      }
      
    } catch (error: any) {
      console.error('Error al clasificar el residuo:', error);
       // Only show error if timer hasn't started
      if (!this.redirectTimer) {
        this.error = error.message || 'Error al clasificar el residuo';
        this.classification = undefined;
      }
    } finally {
      this.analyzing = false;
    }
  }

  private startRedirectTimer() {
    // This check might be redundant now but good for safety
    if (this.redirectTimer) {
      return; 
    }
    
    // Stop the continuous capture/classification interval
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    this.isCapturing = false; // Update capturing status

    this.redirectCountdown = 60; // Changed to 60 seconds as per previous code
    console.log('Starting redirect timer...'); 
    this.redirectTimer = setInterval(() => {
      if (this.redirectCountdown > 0) {
        this.redirectCountdown--;
      } else {
        clearInterval(this.redirectTimer);
        this.redirectTimer = null;
        
        // Stop the camera stream only when redirecting
        this.cameraService.stopVideoStream(); 
        
        // *** ADD LOGGING HERE ***
        console.log(`Redirecting to /result with classification: ${this.classification}`); 
        
        this.router.navigate(['/result'], {
          state: { classification: this.classification }
        }).then((success) => {
          // *** ADD SUCCESS LOGGING ***
          if (success) {
            console.log('Navigation to /result successful');
          } else {
            console.log('Navigation to /result failed but no error thrown');
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
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    
    // Stop the redirect timer if the user manually stops capture
    if (this.redirectTimer) {
       clearInterval(this.redirectTimer);
       this.redirectTimer = null;
    }
    
    this.cameraService.stopVideoStream();
    // Reset state when manually stopped
    this.classification = undefined; 
    this.imageBase64 = undefined;
    this.error = undefined;
    this.redirectCountdown = 0;
    this.analyzing = false; // Ensure analyzing flag is reset
  }
}