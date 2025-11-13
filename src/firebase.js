// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBlC4x2mTDG1bLpRlmp6nNMUih9mul4f0I",
  authDomain: "pech-fruits-tracker.firebaseapp.com",
  projectId: "pech-fruits-tracker",
  storageBucket: "pech-fruits-tracker.firebasestorage.app",
  messagingSenderId: "772367460584",
  appId: "1:772367460584:web:4d192973f89b685bc7015d",
  measurementId: "G-LZM5BP9J2J"
};

// Initialize Firebase (ONLY ONCE)
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);