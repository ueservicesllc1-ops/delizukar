// Actualiza el documento pages/contacto en Firestore con contenido en español e inglés
// Uso: node update_contacto_texts.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, setDoc } = require('firebase/firestore');

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

  const pageRef = doc(db, 'pages', 'contacto');
  await setDoc(pageRef, {
    title_es: 'Contáctanos',
    content_es: 'Nos encantaría saber de ti. Envíanos un mensaje y te responderemos pronto.',
    title_en: 'Contact Us',
    content_en: "We'd love to hear from you. Send us a message and we'll get back to you.",
    updatedAt: new Date()
  }, { merge: true });

  console.log('✅ Firestore actualizado: pages/contacto');
}

main().catch((e) => {
  console.error('❌ Error actualizando pages/contacto:', e);
  process.exit(1);
});
