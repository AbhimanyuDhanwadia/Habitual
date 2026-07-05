import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// TODO: Replace with your actual Firebase project configuration
// 1. Go to Firebase Console -> Project Settings
// 2. Add a Web App if you haven't already
// 3. Copy the configuration object below
const firebaseConfig = {
  apiKey: "AIzaSyAplkV1GetR-6PKACpOsBwfY7LlWLFwVto",
  authDomain: "habitual-web-2026.firebaseapp.com",
  projectId: "habitual-web-2026",
  storageBucket: "habitual-web-2026.firebasestorage.app",
  messagingSenderId: "823701056529",
  appId: "1:823701056529:web:f1e2fa030804e7700895b0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
