import admin from 'firebase-admin';
import { cert } from 'firebase-admin/app';

// Initialize Firebase Admin SDK
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: cert(serviceAccount)
    });
  } catch (error) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env variable:', error);
    admin.initializeApp(); // Fallback
  }
} else {
  // Relies on GOOGLE_APPLICATION_CREDENTIALS pointing to a file
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.NODE_ENV !== 'production') {
    admin.initializeApp();
  } else {
    throw new Error('Firebase Admin credentials are required in production. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS.');
  }
}

export default admin;
