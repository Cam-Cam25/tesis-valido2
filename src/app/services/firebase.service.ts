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

  // Método para enviar el evento de inicio del juego
  async sendGameStartEvent(): Promise<void> {
    try {
      const eventRef = ref(this.database, 'game_events/event/event');
      const classificationRef = ref(this.database, 'clasificacion/resultado');
      
      // Actualizar tanto el evento como limpiar la clasificación
      await Promise.all([
        set(eventRef, 'start'),
        set(classificationRef, '')
      ]);
    } catch (error) {
      console.error('Error al enviar evento de inicio:', error);
      throw error;
    }
  }

  // Método para escuchar eventos del juego con manejo mejorado
  listenToGameEvents(callback: (event: string) => void): () => void {
    const eventRef = ref(this.database, 'game_events/event/event');
    let lastEvent: string | null = null;
    
    const unsubscribe = onValue(eventRef, (snapshot) => {
      try {
        const event = snapshot.val();
        console.log('Evento recibido del juego:', event, 'Último evento:', lastEvent);
        
        // Validar que el evento sea diferente al último para evitar duplicados
        if (event && event !== lastEvent) {
          lastEvent = event;
          console.log('Procesando nuevo evento del juego:', event);
          callback(event);
        }
      } catch (error) {
        console.error('Error al procesar evento del juego:', error);
        // Intentar limpiar el estado en caso de error
        this.sendGameStartEvent().catch(err => 
          console.error('Error al limpiar estado después de error:', err)
        );
      }
    }, (error) => {
      console.error('Error en la suscripción a eventos del juego:', error);
    });

    return () => {
      console.log('Limpiando suscripción a eventos del juego');
      unsubscribe();
    };
  }
}