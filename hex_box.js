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
    if (doc.id === 'sweet-box-4') {
      console.log(`Name: |${data.name}|`);
      for (let i = 0; i < data.name.length; i++) {
        process.stdout.write(data.name.charCodeAt(i).toString(16) + ' ');
      }
      console.log();
    }
  });
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
