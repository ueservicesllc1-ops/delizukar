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

  const productRef = doc(db, "products", "Xc224g6p2376vExU0vpK");
  await updateDoc(productRef, {
    name: 'Golden Almond',
    name_es: 'Golden Almond'
  });

  console.log('✅ Product name updated to English: Golden Almond');
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
