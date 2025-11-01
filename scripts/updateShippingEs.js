// Actualiza el documento pages/shipping en Firestore con contenido en español
// Uso: node scripts/updateShippingEs.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCMAcBgyNxyToVBavu2HfGpGrK7VMWkyxA",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "delizukar.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "delizukar",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "delizukar.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "638502228599",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:638502228599:web:4ecaa6571bddba2a0f2c72"
};

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const title = 'Política de Envíos';
  const content = `
  <p>Al realizar tu compra, aceptas estos términos. DeliZuKar no se hace responsable por retrasos, pérdidas o daños ocasionados a los paquetes por parte de la empresa de envíos.</p>
  <p>Empacamos cada galleta de forma individual y sellamos y embalamos correctamente los pedidos para un envío seguro. Una vez que entregamos el paquete a la empresa de envíos, queda fuera de nuestras manos y control. No somos responsables del estado del paquete ni de los retrasos que puedan ocurrir.</p>
  <p>Cualquier envío devuelto por dirección incorrecta o incompleta generará un cargo adicional de envío, que se determinará al momento de la reentrega.</p>
  <p><strong>Importante:</strong></p>
  <ul>
    <li>Verifica que tu dirección sea correcta y completa para evitar retrasos o cargos adicionales por reenvío.</li>
    <li>En temporadas de alta demanda o clima severo, considera tiempos adicionales de envío.</li>
    <li>Una vez que el pedido haya sido enviado, es final. No ofrecemos reembolsos.</li>
  </ul>
  `;

  const pageRef = doc(db, 'pages', 'shipping');
  await updateDoc(pageRef, {
    title,
    content,
    titleFont: 'BrittanySignature',
    contentFont: 'Asap-Regular',
    updatedAt: new Date()
  });

  console.log('✅ Firestore actualizado: pages/shipping');
}

main().catch((e) => {
  console.error('❌ Error actualizando pages/shipping:', e);
  process.exit(1);
});


