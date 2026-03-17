// Actualiza el documento settings/accordionMenu en Firestore
// Uso: node update_accordion_title.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');

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
  await updateDoc(docRef, {
    aboutTitle: 'Recién horneadas para ti',
    aboutTitle_es: 'Recién horneadas para ti',
    updatedAt: new Date()
  });

  console.log('✅ Firestore actualizado: settings/accordionMenu -> aboutTitle: Recién horneadas para ti');
}

main().catch((e) => {
  console.error('❌ Error actualizando settings/accordionMenu:', e);
  process.exit(1);
});
