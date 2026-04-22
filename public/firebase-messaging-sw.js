// Import the Firebase app and messaging packages
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging/sw';

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "studio-6571219821-5a882",
  "appId": "1:106549901014:web:7b40d78613d45c6e077b77",
  "apiKey": "AIzaSyBVYw4pyp0ge3ZpdpeFBQL7n1YsiX7edHY",
  "authDomain": "studio-6571219821-5a882.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "106549901014"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// The service worker doesn't need much more than this for basic background notifications.
// Firebase Messaging will automatically handle displaying notifications sent from a server.
// You could add a 'backgroundMessageHandler' here for custom logic, but it's not needed for now.
