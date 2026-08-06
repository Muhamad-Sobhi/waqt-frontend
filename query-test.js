import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  projectId: "waqt-9dff1",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  const querySnapshot = await getDocs(collection(db, "products"));
  console.log(`Found ${querySnapshot.size} products.`);
}

test();
