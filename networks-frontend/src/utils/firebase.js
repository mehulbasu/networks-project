import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDvXgrwXnbfKLEsuEpRtLkFFpPn2p3-4xM",
  authDomain: "networks-project-640.firebaseapp.com",
  projectId: "networks-project-640",
  storageBucket: "networks-project-640.firebasestorage.app",
  messagingSenderId: "4195220761",
  appId: "1:4195220761:web:5f9557f4b11d5b38345988"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, app, storage };
