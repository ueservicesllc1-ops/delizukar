
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
  
  const productRef = doc(db, "products", "gift-option");
  
  const translations = {
    name_en: "Turn your order into a special gift",
    description_en: "Make your order even more special with our DeliZukar gift presentation and a personalized card. Perfect for birthdays, surprises, or treating yourself."
  };
  
  console.log("Updating gift-option product with English translations...");
  await updateDoc(productRef, translations);
  console.log("Successfully updated gift-option translations!");
}

main().catch(console.error);
