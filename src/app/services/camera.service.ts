import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  constructor() {}

  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

    // Método para conectar directamente a la cámara externa
  async connectToExternalCamera(): Promise<MediaStream | null> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const externalCameras = devices.filter(device => 
        device.kind === 'videoinput' && 
        device.label !== 'Default' && 
        device.label !== 'Built-in Camera'
      );

      if (externalCameras.length > 0) {
        return await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: externalCameras[0].deviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      }
      return null;
    } catch (error) {
      console.error('Error al conectar con la cámara externa:', error);
      return null;
    }
  }

  stopVideoStream() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  async startVideoStream(): Promise<HTMLVideoElement> {
    try {
      if (!this.stream) {
        // Intentar conectar con la cámara externa primero
        this.stream = await this.connectToExternalCamera();
        
        // Si no hay cámara externa, usar cualquier cámara disponible
        if (!this.stream) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const cameras = devices.filter(device => device.kind === 'videoinput');
          
          if (cameras.length === 0) {
            throw new Error('No se detectó ninguna cámara en el dispositivo.');
          }
          
          this.stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });
        }
      }

      // Crear o reutilizar el elemento de video
      if (!this.videoElement) {
        this.videoElement = document.createElement('video');
        this.videoElement.autoplay = true;
        this.videoElement.playsInline = true;
      }

      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();

      return this.videoElement;
    } catch (error: any) {
      console.error('Error al capturar la foto:', error);
      if (error.message.includes('User denied')) {
        throw new Error('Permisos de cámara denegados. Por favor, habilita el acceso a la cámara en la configuración de tu navegador.');
      }
      if (error.message.includes('No se detectó ninguna cámara')) {
        throw error;
      }
      throw new Error('Error al acceder a la cámara. Por favor, verifica que tu cámara web esté conectada y funcionando correctamente.');
    }
  }

  async selectFromGallery() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos
      });
      
      return image.base64String;
    } catch (error) {
      console.error('Error al seleccionar la foto:', error);
      throw error;
    }
  }
}