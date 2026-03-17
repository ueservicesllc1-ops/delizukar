// Lee el documento settings/accordionMenu en Firestore
// Uso: node read_accordion.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

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

  const docRef = doc(db, 'settings', 'accordionMenu');
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    console.log(JSON.stringify(docSnap.data(), null, 2));
  } else {
    console.log('Documento no encontrado');
  }
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
