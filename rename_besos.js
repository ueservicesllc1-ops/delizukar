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

  const productRef = doc(db, "products", "xtnffNxuCY69ndSqSRM6");
  await updateDoc(productRef, {
    name: 'White Hazelnut Kisses',
    name_es: 'White Hazelnut Kisses'
  });

  console.log('✅ Product name updated to English: White Hazelnut Kisses');
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
