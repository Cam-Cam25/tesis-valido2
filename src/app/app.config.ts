import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

// Import AngularFire modules
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getDatabase, provideDatabase } from '@angular/fire/database';

// Import environment configuration
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),

    // Initialize Firebase directly
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    // Provide Firebase Database instance directly
    provideDatabase(() => getDatabase())

    // Add other providers if needed (e.g., provideAuth, provideFirestore)
  ]
};