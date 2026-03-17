
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCMAcBgyNxyToVBavu2HfGpGrK7VMWkyxA",
  authDomain: "delizukar.firebaseapp.com",
  projectId: "delizukar",
  storageBucket: "delizukar.firebasestorage.app",
  messagingSenderId: "638502228599",
  appId: "1:638502228599:web:4ecaa6571bddba2a0f2c72"
};

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const q = query(collection(db, "products"), where("category", "==", "regalo"));
  const snapshot = await getDocs(q);
  const results = [];
  snapshot.forEach(doc => results.push({id: doc.id, ...doc.data()}));
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
