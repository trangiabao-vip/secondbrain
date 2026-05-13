import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (Singleton pattern)
if (!admin.apps.length) {
  try {
    // Attempt to initialize using environment variables
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Handle escaped newlines in the private key
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export async function GET(request: Request) {
  // Check an authorization header to secure the cron endpoint
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const db = admin.firestore();
    const messaging = admin.messaging();

    const now = admin.firestore.Timestamp.now();
    
    // Simple query that doesn't require composite index
    const notificationsSnapshot = await db.collection('notifications')
      .where('isSent', '==', false)
      .get();

    if (notificationsSnapshot.empty) {
      return NextResponse.json({ status: 'success', message: 'No pending notifications' });
    }

    const promises: Promise<any>[] = [];

    for (const doc of notificationsSnapshot.docs) {
      const data = doc.data();
      
      // Filter by time in memory
      if (!data.sendAt || data.sendAt.toMillis() > now.toMillis()) {
        continue;
      }

      const userId = data.userId; // We need to know who this notification belongs to!
      
      if (!userId) continue;

      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) continue;
      
      const userData = userDoc.data();
      const tokens = userData?.fcmTokens || [];
      
      if (tokens.length > 0) {
        const payload = {
          notification: {
            title: data.title,
            body: data.body,
          },
          data: {
            linkType: data.link?.type || '',
            linkId: data.link?.id || '',
          },
          tokens: tokens,
        };

        promises.push(
          messaging.sendEachForMulticast(payload).then(response => {
            console.log(response.successCount + ' messages were sent successfully');
            // Mark notification as sent
            return doc.ref.update({ isSent: true, sentAt: admin.firestore.FieldValue.serverTimestamp() });
          })
        );
      } else {
         // No tokens for user, just mark as sent
         promises.push(doc.ref.update({ isSent: true, note: 'No FCM tokens found' }));
      }
    }

    await Promise.all(promises);
    return NextResponse.json({ status: 'success', sentCount: promises.length });

  } catch (error) {
    console.error('Error sending push notifications:', error);
    return NextResponse.json({ status: 'error', error: String(error) }, { status: 500 });
  }
}
