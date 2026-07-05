import admin from './src/config/firebase.js';
import { getAuth } from 'firebase-admin/auth';
console.log("Firebase initialized");
try {
  await getAuth().verifyIdToken("dummy_token");
} catch (e) {
  console.log("Error verifying:", e.code, e.message);
}
