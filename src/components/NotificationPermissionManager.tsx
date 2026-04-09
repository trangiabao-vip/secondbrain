'use client';

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { toast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/use-local-storage';

// This component is responsible for handling notification permissions and tokens.
export function NotificationPermissionManager() {
  const { firebaseApp, firestore, user } = useFirebase();
  // We use local storage to avoid asking for permission on every single page load
  // if the user has already denied it on this device.
  const [permissionRequested, setPermissionRequested] = useLocalStorage('notificationPermissionRequested', false);

  useEffect(() => {
    // Ensure this only runs on the client, when firebase is ready, and the user is logged in.
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && firebaseApp && user) {
      
      const setupMessaging = async () => {
        try {
          const messaging = getMessaging(firebaseApp);

          // Handle incoming messages when the app is in the foreground
          onMessage(messaging, (payload) => {
            console.log('Foreground message received. ', payload);
            toast({
              title: payload.notification?.title,
              description: payload.notification?.body,
            });
          });
          
          if (permissionRequested) return;

          // Request permission
          const permission = await Notification.requestPermission();
          setPermissionRequested(true); // Mark that we've asked for permission on this device

          if (permission === 'granted') {
            console.log('Notification permission granted.');
            // Get token
            // The VAPID key is not strictly required if you have the service worker file.
            const currentToken = await getToken(messaging);
            if (currentToken) {
              console.log('FCM Token:', currentToken);
              // Save the token to Firestore. Use the token as the ID to prevent duplicates.
              const tokenRef = doc(firestore, 'fcmTokens', currentToken);
              setDocumentNonBlocking(tokenRef, {
                userId: user.uid,
                createdAt: serverTimestamp(),
              }, {});
            } else {
              console.log('No registration token available. Request permission to generate one.');
            }
          } else {
            console.log('Unable to get permission to notify.');
          }
        } catch (err) {
          console.error('An error occurred while setting up notifications.', err);
        }
      };

      setupMessaging();
    }
  }, [firebaseApp, user, firestore, permissionRequested, setPermissionRequested]);

  // This component does not render anything.
  return null;
}
