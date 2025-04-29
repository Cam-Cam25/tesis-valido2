import { Injectable, inject } from '@angular/core';
import { Database, ref, onValue, update, set, objectVal } from '@angular/fire/database';
import { Observable, Subject } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

// Interfaz opcional para representar la estructura de ClasificacionBasura
export interface ClasificacionBasuraState {
  Tipo: string | null;
  Tipo2: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseInteractionService {
  private db: Database = inject(Database);
  private sensorRef = ref(this.db, 'SensorUltrasonico');
  private clasificacionRef = ref(this.db, 'ClasificacionBasura');

  // Subject y Observable para emitir la señal de activación de la IA
  private triggerAISubject = new Subject<void>();
  public triggerAI$: Observable<void> = this.triggerAISubject.asObservable();

  constructor() {
    this.listenForSensorTrigger();
  }

  /**
   * Escucha cambios en el nodo /SensorUltrasonico.
   * Cuando cambia a true, emite un evento en triggerAI$ y
   * opcionalmente lo resetea (aunque es mejor resetearlo después de clasificar).
   */
  private listenForSensorTrigger() {
    onValue(this.sensorRef, (snapshot) => {
      const sensorActivated = snapshot.val();
      console.log('Firebase SensorUltrasonico changed:', sensorActivated); // Para depuración
      if (sensorActivated === true) {
        console.log('AI Trigger received from Firebase!');
        this.triggerAISubject.next();
        // No reseteamos aquí, lo hacemos después de escribir la clasificación.
      }
    });
  }

  /**
   * Obtiene el estado actual de la clasificación como un Observable.
   * Útil si necesitas mostrar el estado actual en algún lugar.
   */
  getClasificacionState(): Observable<ClasificacionBasuraState | null> {
    return objectVal<ClasificacionBasuraState>(this.clasificacionRef).pipe(
      tap(state => console.log('Firebase ClasificacionBasura state update:', state)) // Para depuración
    );
  }

  /**
   * Actualiza el resultado de la clasificación en Firebase.
   * Escribe en 'Tipo' o 'Tipo2' y resetea 'SensorUltrasonico'.
   * @param result El resultado de la clasificación: 'orgánico' o 'inorgánico'.
   */
  async updateClassificationResult(result: 'orgánico' | 'inorgánico'): Promise<void> {
    console.log(`Updating Firebase with result: ${result}`); // Para depuración
    
    let updates: { [key: string]: any } = {}; // Usamos un objeto para múltiples actualizaciones

    // Preparamos las actualizaciones para ClasificacionBasura
    if (result === 'orgánico') {
      updates['ClasificacionBasura/Tipo'] = 'orgánico';
      updates['ClasificacionBasura/Tipo2'] = null; // Limpiamos el otro campo
    } else { // inorgánico
      updates['ClasificacionBasura/Tipo'] = null; // Limpiamos el otro campo
      updates['ClasificacionBasura/Tipo2'] = 'inorgánico';
    }

    // Añadimos la actualización para resetear el sensor
    updates['SensorUltrasonico'] = false;

    try {
      // Usamos update en la referencia raíz para actualizar múltiples nodos atómicamente
      await update(ref(this.db, '/'), updates); 
      console.log('Firebase updated successfully (Classification & Sensor Reset).');
    } catch (error) {
      console.error('Error updating Firebase:', error);
      // Considera cómo manejar el error, quizás intentar resetear el sensor de todas formas
      await this.resetSensorTrigger(); // Intenta resetear el sensor incluso si falla la clasificación
    }
  }

  /**
   * Resetea explícitamente el trigger del sensor a false.
   * Útil en caso de errores o cancelaciones.
   */
  async resetSensorTrigger(): Promise<void> {
    console.log('Resetting Firebase SensorUltrasonico flag.');
    try {
      await set(this.sensorRef, false);
    } catch (error) {
      console.error('Error resetting SensorUltrasonico flag:', error);
    }
  }

  /**
   * Método para indicar que la IA está procesando (opcional).
   * Podrías añadir un nodo 'EstadoIA' en Firebase si lo necesitas.
   */
  // async setAIStatus(status: 'idle' | 'classifying' | 'error'): Promise<void> {
  //   try {
  //     await set(ref(this.db, 'EstadoIA'), status);
  //   } catch (error) {
  //     console.error('Error setting AI status:', error);
  //   }
  // }
}
