// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ⚡ Remplace ces valeurs par celles de ton projet Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD1FQhe5nywBUPypOQ5sN1yZ0scLXXYebQ",
  authDomain: "suivi-gestalt-therapie.firebaseapp.com",
  projectId: "suivi-gestalt-therapie",
  storageBucket: "suivi-gestalt-therapie.firebasestorage.app",
  messagingSenderId: "712075912076",
  appId: "1:712075912076:web:231f037786415506ff6ca9",
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);

// Export des services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(
  app,
  "gs://suivi-gestalt-therapie.firebasestorage.app"
);
