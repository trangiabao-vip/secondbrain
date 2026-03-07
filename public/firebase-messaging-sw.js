// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

const firebaseConfig = {
  "projectId": "studio-6571219821-5a882",
  "appId": "1:106549901014:web:7b40d78613d45c6e077b77",
  "apiKey": "AIzaSyBVYw4pyp0ge3ZpdpeFBQL7n1YsiX7edHY",
  "authDomain": "studio-6571219821-5a882.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "106549901014"
};

// Initialize the Firebase app in the service worker by passing in
// the messagingSenderId.
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}


// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});
