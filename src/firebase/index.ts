'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';

let initializedFirestore: Firestore | null = null;

/**
 * Initializes Firebase services with specific configurations for the workstation environment.
 * Ensures Firestore uses long-polling to bypass WebSocket restrictions and prevent connectivity errors.
 */
export function initializeFirebase() {
  let app: FirebaseApp;

  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (e) {
      console.error('Firebase initialization failed:', e);
      app = initializeApp(firebaseConfig);
    }
  } else {
    app = getApp();
  }

  // Ensure Firestore is initialized with long-polling only once.
  // We force long-polling to prevent "Could not reach Cloud Firestore backend" errors 
  // which are common in restricted network environments or workstations.
  if (!initializedFirestore) {
    initializedFirestore = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: false,
    });
  }

  return getSdks(app);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: initializedFirestore || getFirestore(firebaseApp),
    storage: getStorage(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
