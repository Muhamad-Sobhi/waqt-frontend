import * as admin from 'firebase-admin';

function formatPrivateKey(key: string | undefined) {
  if (!key) return undefined;
  // Remove surrounding quotes if present
  let formattedKey = key;
  if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
    formattedKey = formattedKey.substring(1, formattedKey.length - 1);
  }
  if (formattedKey.startsWith("'") && formattedKey.endsWith("'")) {
    formattedKey = formattedKey.substring(1, formattedKey.length - 1);
  }
  // Handle escaped newlines
  return formattedKey.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
  try {
    const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);
    
    if (process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
      console.log('Firebase Admin Initialized successfully.');
    } else {
      console.warn('Firebase Admin skipped: Missing credentials in environment variables.');
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

// Safely export adminDb for Next.js build time
let adminDb: admin.firestore.Firestore;
try {
  adminDb = admin.firestore();
} catch (e) {
  console.warn('admin.firestore() could not be initialized. Using dummy object for build.');
  adminDb = {} as admin.firestore.Firestore;
}

export { adminDb, admin };
