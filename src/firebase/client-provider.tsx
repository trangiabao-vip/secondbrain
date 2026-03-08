'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase/client';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // This useEffect will run once on the client and unregister any stale service workers and clear caches.
  // This is a cleanup step to prevent issues from previous PWA configurations.
  useEffect(() => {
    const cleanup = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
            console.log('Stale service worker unregistered:', registration);
          }
        } catch (error) {
          console.error('Error unregistering service worker:', error);
        }
      }
      if (window.caches) {
        try {
          const cacheNames = await window.caches.keys();
          for (const name of cacheNames) {
            await window.caches.delete(name);
            console.log('Cache deleted:', name);
          }
        } catch (error) {
          console.error('Error deleting cache:', error);
        }
      }
    };

    cleanup();
  }, []);
  
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
