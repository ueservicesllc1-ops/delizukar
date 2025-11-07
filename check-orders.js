#!/usr/bin/env node

/**
 * Script para verificar órdenes en Firestore
 */

require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

console.log('🔍 Verificando órdenes en Firestore...');
console.log('📋 Proyecto Firebase:', firebaseConfig.projectId);
console.log('');

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

async function checkOrders() {
  try {
    const ordersRef = collection(db, 'orders');
    const snapshot = await getDocs(ordersRef);
    
    console.log(`📦 Total de documentos en colección 'orders': ${snapshot.size}`);
    console.log('');
    
    if (snapshot.empty) {
      console.log('⚠️ No hay órdenes en la colección "orders"');
      console.log('');
      console.log('Posibles causas:');
      console.log('1. Las órdenes no se están guardando');
      console.log('2. Hay un error al guardar (revisa logs del servidor)');
      console.log('3. Permisos de Firestore incorrectos');
      return;
    }
    
    console.log('📋 Órdenes encontradas:');
    console.log('='.repeat(80));
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`\n📄 ID: ${doc.id}`);
      console.log(`   Payment Status: ${data.paymentStatus || 'NO DEFINIDO'}`);
      console.log(`   Status: ${data.status || 'NO DEFINIDO'}`);
      console.log(`   Total: $${data.total || 0}`);
      console.log(`   Email: ${data.customerInfo?.email || 'NO DEFINIDO'}`);
      console.log(`   Created: ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : 'NO DEFINIDO'}`);
      console.log(`   Items: ${data.cartItems?.length || 0}`);
    });
    
    console.log('');
    console.log('='.repeat(80));
    
    const paidOrders = [];
    const unpaidOrders = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.paymentStatus === 'paid') {
        paidOrders.push(doc.id);
      } else {
        unpaidOrders.push({ id: doc.id, paymentStatus: data.paymentStatus });
      }
    });
    
    console.log(`\n✅ Órdenes pagadas (paymentStatus = 'paid'): ${paidOrders.length}`);
    console.log(`❌ Órdenes no pagadas: ${unpaidOrders.length}`);
    
    if (unpaidOrders.length > 0) {
      console.log('\n⚠️ Órdenes con paymentStatus diferente a "paid":');
      unpaidOrders.forEach(order => {
        console.log(`   - ${order.id}: paymentStatus = "${order.paymentStatus}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error verificando órdenes:', error);
    console.error('   Mensaje:', error.message);
    console.error('   Código:', error.code);
  }
}

checkOrders().then(() => {
  console.log('\n✅ Verificación completada');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

