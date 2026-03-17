const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

  const querySnapshot = await getDocs(collection(db, "products"));
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.name && (data.name.includes('Besos') || data.name.includes('Hazelnut'))) {
      console.log(`ID: ${doc.id}`);
      console.log(`Data: ${JSON.stringify(data, null, 2)}`);
    }
  });
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
