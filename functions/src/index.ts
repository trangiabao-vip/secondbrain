// This file contains the backend logic for sending notifications.
// IMPORTANT: This code is intended to be deployed as a Google Cloud Function.
// It will not run as part of the Next.js application.

import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

admin.initializeApp();
const db = admin.firestore();

// This Cloud Function will be triggered on a schedule.
export const sendScheduledNotifications = onSchedule("every 1 minutes", async (event) => {
  console.log("Running scheduled notification job...");

  const now = Timestamp.now();
  
  // Query for notifications that are due and not yet sent
  const query = db.collection('notifications')
    .where('isSent', '==', false)
    .where('sendAt', '<=', now);

  const notificationsSnapshot = await query.get();

  if (notificationsSnapshot.empty) {
    console.log("No notifications to send.");
    return null;
  }
  
  const notifications = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  for (const notification of notifications) {
    if (!notification.userId) continue;

    // Get FCM tokens for the user
    const tokensSnapshot = await db.collection('fcmTokens')
      .where('userId', '==', notification.userId)
      .get();
      
    const tokens = tokensSnapshot.docs.map(tokenDoc => tokenDoc.id);

    if (tokens.length > 0) {
      const messagePayload = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        webpush: {
          notification: {
            icon: '/icon.svg',
          },
          fcmOptions: notification.link ? {
            link: `${process.env.GCLOUD_PROJECT ? `https://${process.env.GCLOUD_PROJECT}.web.app` : 'http://localhost:9002'}/interests/redirect?type=${notification.link.type}&id=${notification.link.id}`
          } : undefined
        },
      };

      // Send messages to all tokens
      const multicastMessage = {
        ...messagePayload,
        tokens: tokens,
      };

      try {
        const response = await admin.messaging().sendEachForMulticast(multicastMessage);
        console.log(`Successfully sent message to ${response.successCount} devices for notification ${notification.id}.`);
        
        // Mark the notification as sent
        await db.collection('notifications').doc(notification.id).update({ isSent: true });

      } catch (error) {
        console.error(`Error sending notification ${notification.id}:`, error);
      }
    }
  }

  return null;
});
