// Actualiza el documento pages/cookie-care en Firestore con contenido en español
// Uso: node scripts/updateCookieCareEs.js

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

  const title = 'Instrucciones de Cuidado de Galletas';
  const content = `
  <p><strong>Almacenamiento a Corto Plazo:</strong> Puedes mantener las galletas en su empaque sellado original hasta por 1 semana a temperatura ambiente.</p>
  <p><strong>Para disfrutarlas tibias y suaves:</strong> Retira la galleta del empaque y elige una de estas opciones:</p>
  <ul>
    <li><strong>Microondas:</strong> Calienta por 8–10 segundos.</li>
    <li><strong>Horno:</strong> Lleva a un horno precalentado a 350°F (180°C) por 4–5 minutos.</li>
    <li><strong>Air Fryer:</strong> Envuélvela en papel aluminio y calienta por 2 minutos.</li>
  </ul>
  <p><strong>Para Almacenamiento Prolongado:</strong> Congela en su empaque original, dentro de un recipiente hermético, hasta por 3 meses.</p>
  <p><strong>Para recalentar desde el congelador:</strong> Retira el empaque y elige una opción:</p>
  <ul>
    <li><strong>Horno</strong> (precalentado a 350°F / 180°C): 8–10 minutos.</li>
    <li><strong>Air Fryer:</strong> Envuélvelas en papel aluminio y calienta por 3–4 minutos.</li>
  </ul>
  <p><em>¿Tienes preguntas?</em> Nos encantará ayudarte.</p>
  `;

  const pageRef = doc(db, 'pages', 'cookie-care');
  await updateDoc(pageRef, {
    title,
    content,
    titleFont: 'BrittanySignature',
    contentFont: 'Asap-Regular',
    updatedAt: new Date()
  });

  console.log('✅ Firestore actualizado: pages/cookie-care');
}

main().catch((e) => {
  console.error('❌ Error actualizando pages/cookie-care:', e);
  process.exit(1);
});


