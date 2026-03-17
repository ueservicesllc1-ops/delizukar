
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, updateDoc } = require('firebase/firestore');

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
  
  const docRef = doc(db, "pages", "sweet-boxes");
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    console.log("Current data:", JSON.stringify(docSnap.data(), null, 2));
    
    const updates = {
      content_es: "Elige el tamaño perfecto para compartir o regalar el sabor de DeliZuKar.",
      content_en: "Choose the perfect size to share or gift the taste of DeliZuKar."
    };
    
    await updateDoc(docRef, updates);
    console.log("Updated successfully!");
  } else {
    console.log("Document dots not exist!");
  }
}

main().catch(console.error);
