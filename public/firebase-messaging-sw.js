importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

const firebaseConfig = {
  "projectId": "studio-6571219821-5a882",
  "appId": "1:106549901014:web:7b40d78613d45c6e077b77",
  "apiKey": "AIzaSyBVYw4pyp0ge3ZpdpeFBQL7n1YsiX7edHY",
  "authDomain": "studio-6571219821-5a882.firebaseapp.com",
  "messagingSenderId": "106549901014"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
