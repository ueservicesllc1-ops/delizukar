const admin = require('firebase-admin');
const fs = require('fs');

// Intentar cargar credenciales
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkProducts() {
  const snapshot = await db.collection('products').get();
  const products = [];
  snapshot.forEach(doc => {
    products.push({ id: doc.id, ...doc.data() });
  });
  console.log(JSON.stringify(products, null, 2));
  process.exit(0);
}

checkProducts().catch(err => {
  console.error(err);
  process.exit(1);
});
