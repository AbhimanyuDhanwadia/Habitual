import admin from 'firebase-admin';
import { cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

admin.initializeApp({
  credential: cert(serviceAccount)
});

async function getToken() {
  try {
    const customToken = await getAuth().createCustomToken('some-uid-12345');
    const FIREBASE_API_KEY = 'AIzaSyAplkV1GetR-6PKACpOsBwfY7LlWLFwVto';
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: customToken, returnSecureToken: true })
      }
    );
    const data = await response.json();
    const idToken = data.idToken;
    
    // Now make the request to Render
    const res = await fetch('https://habitual-api-l5xt.onrender.com/api/tasks/history?month=7&year=2026', {
      headers: { Authorization: `Bearer ${idToken}` }
    });
    console.log("HISTORY STATUS:", res.status);
    console.log("HISTORY:", await res.text());
    
    const res2 = await fetch('https://habitual-api-l5xt.onrender.com/api/todos', {
      headers: { Authorization: `Bearer ${idToken}` }
    });
    console.log("TODOS STATUS:", res2.status);
    console.log("TODOS:", await res2.text());
  } catch (err) {
    console.error("ERROR:", err.message);
  }
  process.exit(0);
}
getToken();
