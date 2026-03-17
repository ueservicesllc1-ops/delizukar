
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, collection, query, where, getDocs } = require('firebase/firestore');
require('dotenv').config();

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateGiftPrice() {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('category', '==', 'regalo'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No products found in category regalo.');
      process.exit(0);
    }

    const updates = [];
    querySnapshot.forEach((docSnap) => {
      const product = docSnap.data();
      if (product.name.toLowerCase().includes('gift') || product.name.toLowerCase().includes('regalo') || product.price === 9) {
        updates.push(updateDoc(doc(db, 'products', docSnap.id), { price: 7.00 }));
        console.log(`Updating ${docSnap.id}...`);
      }
    });

    await Promise.all(updates);
    console.log('SUCCESS: Prices updated to $7.00');
    process.exit(0);
  } catch (error) {
    console.error('ERROR:', error);
    process.exit(1);
  }
}

updateGiftPrice();
