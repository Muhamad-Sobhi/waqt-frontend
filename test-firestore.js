const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDLjyk9Ofbff7Vckx03vkhjMHEcXgAIFaw",
  authDomain: "waqt-9dff1.firebaseapp.com",
  projectId: "waqt-9dff1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  const snap = await getDocs(collection(db, 'products'));
  console.log("Number of products:", snap.size);
  snap.forEach(doc => console.log(doc.id, doc.data().name));
}

test().catch(console.error);
