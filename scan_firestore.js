// Lista colecciones y documentos en settings y pages
// Uso: node scan_firestore.js

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

  const collections = ['settings', 'pages'];
  
  for (const colName of collections) {
    console.log(`--- Collection: ${colName} ---`);
    const snapshot = await getDocs(collection(db, colName));
    snapshot.forEach(doc => {
      console.log(`Doc: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
    });
  }
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
