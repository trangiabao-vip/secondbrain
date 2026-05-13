import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase/client';

export function useFCMToken() {
  const { user, firestore } = useFirebase();

  useEffect(() => {
    if (!user) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    const requestPermissionAndGetToken = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const { firebaseApp } = initializeFirebase();
          const messaging = getMessaging(firebaseApp);
          
          const currentToken = await getToken(messaging, { 
            vapidKey: "BGaMrH4wnBMG5QO2u5mQrs6MzNImL_8MMI1e1jfvgiiFaLu2pRkk1O6UODucwGkmgIKrcLEvV1kwfCIv5SI74Qs" 
          });
          
          if (currentToken) {
            // Save token to user's document
            const userRef = doc(firestore, 'users', user.uid);
            await setDoc(userRef, {
              fcmTokens: arrayUnion(currentToken)
            }, { merge: true });
            
            console.log("FCM Token saved successfully.");
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
          
          // Listen for foreground messages
          onMessage(messaging, (payload) => {
            console.log('Message received in foreground: ', payload);
            // We can optionally show a toast here if needed
          });
        }
      } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
      }
    };

    requestPermissionAndGetToken();
  }, [user, firestore]);
}
