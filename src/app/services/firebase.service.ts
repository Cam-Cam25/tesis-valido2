import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private firebaseApp = initializeApp(environment.firebase);
  private database = getDatabase(this.firebaseApp);

  constructor() {}

  // Método para actualizar el resultado de la clasificación
  async updateClassificationResult(classification: string): Promise<void> {
    try {
      const resultRef = ref(this.database, 'clasificacion/resultado');
      await set(resultRef, classification);
    } catch (error) {
      console.error('Error al actualizar la clasificación:', error);
      throw error;
    }
  }

  // Método para escuchar cambios en el sensor ultrasónico
  listenToUltrasonicSensor(callback: (isActivated: boolean) => void): () => void {
    const sensorRef = ref(this.database, 'SensorUltrasonico/activado');
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const isActivated = snapshot.val();
      callback(isActivated);
    });
    return unsubscribe;
  }
}