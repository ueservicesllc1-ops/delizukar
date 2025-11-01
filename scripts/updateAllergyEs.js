// Actualiza el documento pages/allergy en Firestore con contenido en español
// Uso: node scripts/updateAllergyEs.js

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

  const title = 'Avisos de Alergias';
  const content = `
  <p>Horneamos y preparamos todos nuestros productos en una sola cocina.</p>
  <p>Tomamos todas las medidas posibles para evitar la contaminación cruzada, pero no podemos garantizar su ausencia total. Por ello, no nos hacemos responsables por reacciones alérgicas.</p>
  <p>Nuestras galletas pueden contener:</p>
  <ul>
    <li>Ajonjolí (semillas de sésamo)</li>
    <li>Huevos</li>
    <li>Harinas (con gluten)</li>
    <li>Leche y productos lácteos</li>
    <li>Semillas</li>
    <li>Soya</li>
    <li>Maní (cacahuate)</li>
    <li>Frutos secos (nueces, almendras, etc.)</li>
  </ul>
  <p>Si tienes alguna alergia o condición particular, por favor contáctanos antes de realizar tu pedido.</p>
  `;

  const pageRef = doc(db, 'pages', 'allergy');
  await updateDoc(pageRef, {
    title,
    content,
    titleFont: 'BrittanySignature',
    contentFont: 'Asap-Regular',
    updatedAt: new Date()
  });

  console.log('✅ Firestore actualizado: pages/allergy');
}

main().catch((e) => {
  console.error('❌ Error actualizando pages/allergy:', e);
  process.exit(1);
});


