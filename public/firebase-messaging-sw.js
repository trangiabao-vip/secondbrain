importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Fallback config if not automatically injected
const firebaseConfig = {
  projectId: "studio-6571219821-5a882",
  appId: "1:106549901014:web:7b40d78613d45c6e077b77",
  apiKey: "AIzaSyBVYw4pyp0ge3ZpdpeFBQL7n1YsiX7edHY",
  authDomain: "studio-6571219821-5a882.firebaseapp.com",
  messagingSenderId: "106549901014"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/todo/icon-192x192.png",
    badge: "/todo/icon-72x72.png",
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
