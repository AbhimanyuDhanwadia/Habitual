import admin from 'firebase-admin';
import { cert } from 'firebase-admin/app';
import fs from 'fs';
import axios from 'axios';

const serviceAccount = JSON.parse(fs.readFileSync('./server/serviceAccountKey.json', 'utf8'));

admin.initializeApp({
  credential: cert(serviceAccount)
});

async function getToken() {
  const customToken = await admin.auth().createCustomToken('some-uid-12345');
  const FIREBASE_API_KEY = 'AIzaSyAplkV1GetR-6PKACpOsBwfY7LlWLFwVto'; // from client/.env or firebase.js
  const response = await axios.post(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`,
    { token: customToken, returnSecureToken: true }
  );
  console.log(response.data.idToken);
  process.exit(0);
}
getToken();
