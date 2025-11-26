import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let db: Firestore;

function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccount) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
    }

    try {
      const parsedServiceAccount = JSON.parse(serviceAccount);
      
      app = initializeApp({
        credential: cert(parsedServiceAccount),
        projectId: parsedServiceAccount.project_id,
      });
    } catch (error) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT:', error);
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON');
    }
  } else {
    app = getApps()[0];
  }

  db = getFirestore(app);
  return { app, db };
}

const firebase = initializeFirebaseAdmin();
export const adminDb = firebase.db;
export default firebase;
