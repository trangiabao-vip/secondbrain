// To prevent service worker from breaking during build if 'self' is not defined
if (typeof self !== "undefined") {
  try {
    // Imports for Firebase
    importScripts(
      "https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js"
    );
    importScripts(
      "https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js"
    );

    // Your web app's Firebase configuration
    const firebaseConfig = {
      projectId: "studio-6571219821-5a882",
      appId: "1:106549901014:web:7b40d78613d45c6e077b77",
      apiKey: "AIzaSyBVYw4pyp0ge3ZpdpeFBQL7n1YsiX7edHY",
      authDomain: "studio-6571219821-5a882.firebaseapp.com",
      measurementId: "",
      messagingSenderId: "106549901014",
    };

    // Initialize Firebase
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    // Retrieve an instance of Firebase Messaging so that it can handle background messages.
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log(
        "[firebase-messaging-sw.js] Received background message ",
        payload
      );
      // Customize notification here
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: "/icon.svg",
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } catch (e) {
    console.error("Error in service worker:", e);
  }
}
