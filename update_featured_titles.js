// Actualiza la configuración de productos destacados en Firestore
// Uso: node update_featured_titles.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, setDoc } = require('firebase/firestore');

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

  const docRef = doc(db, 'appConfig', 'featuredProducts');
  await setDoc(docRef, {
    titleText: 'Productos destacados',
    titleText_en: 'Featured Cookies',
    updatedAt: new Date()
  }, { merge: true });

  console.log('✅ Firestore actualizado: appConfig/featuredProducts');
}

main().catch((e) => {
  console.error('❌ Error actualizando config:', e);
  process.exit(1);
});
