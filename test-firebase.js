import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDLjyk9Ofbff7Vckx03vkhjMHEcXgAIFaw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "waqt-9dff1.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "waqt-9dff1",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "waqt-9dff1.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "80651133359",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:80651133359:web:9fa68b5c834603f4eb8f5a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const q = query(collection(db, 'products'));
    const snapshot = await getDocs(q);
    console.log("Docs:", snapshot.docs.length);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
