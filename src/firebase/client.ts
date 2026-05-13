'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, Messaging } from 'firebase/messaging';

function getSdks(firebaseApp: FirebaseApp) {
  let messaging: Messaging | null = null;
  if (typeof window !== 'undefined') {
    try {
      messaging = getMessaging(firebaseApp);
    } catch (e) {
      console.warn('Failed to initialize Firebase Messaging', e);
    }
  }

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    messaging,
  };
}

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length > 0) {
    return getSdks(getApp());
  }

  let firebaseApp: FirebaseApp;
  
  // On the server or non-Firebase Hosting environments, always use the config object.
  // The 'no-options' error occurs when initializeApp() is called with no arguments
  // and no environment configuration is detected.
  try {
    // If we have a hardcoded config, it's safer to use it as the primary method
    // especially on a custom VPS.
    firebaseApp = initializeApp(firebaseConfig);
  } catch (e) {
    if (process.env.NODE_ENV === "production") {
      console.warn('Manual initialization failed. Trying automatic initialization.', e);
    }
    try {
      firebaseApp = initializeApp();
    } catch (autoErr) {
      console.error('Firebase initialization failed completely:', autoErr);
      throw autoErr;
    }
  }

  return getSdks(firebaseApp);
}
