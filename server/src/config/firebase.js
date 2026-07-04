import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// This relies on the GOOGLE_APPLICATION_CREDENTIALS environment variable
// being set to the path of your service account key JSON file,
// or being deployed to a GCP environment.
admin.initializeApp();

export default admin;
