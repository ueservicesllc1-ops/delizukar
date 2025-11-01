// Escanea Firestore (colección 'pages' y 'products') para recolectar títulos y contenidos
// Uso: node scripts/scanFirestoreTexts.js > firestore_texts.json

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCMAcBgyNxyToVBavu2HfGpGrK7VMWkyxA",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "delizukar.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "delizukar",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "delizukar.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "638502228599",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:638502228599:web:4ecaa6571bddba2a0f2c72"
};

function extractText(htmlOrText) {
  if (!htmlOrText || typeof htmlOrText !== 'string') return [];
  // Remover HTML rudimentariamente y dividir por líneas y frases
  const text = htmlOrText
    .replace(/<[^>]*>/g, ' ') // tags
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ') // compactar espacios
    .trim();
  if (!text) return [];
  // Dividir por oraciones/puntos y bullets
  const parts = text.split(/(?<=[\.\!\?])\s+|•|\n|\r/).map(s => s.trim()).filter(Boolean);
  return parts;
}

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const out = { pages: {}, products: [] };

  // Pages
  const pagesSnap = await getDocs(collection(db, 'pages'));
  pagesSnap.forEach(docSnap => {
    const d = docSnap.data() || {};
    const key = docSnap.id;
    const texts = new Set();
    ['title','content','title_es','content_es','title_en','content_en'].forEach(k => {
      extractText(d[k]).forEach(t => texts.add(t));
    });
    out.pages[key] = Array.from(texts);
  });

  // Products (opcional)
  try {
    const prodSnap = await getDocs(collection(db, 'products'));
    prodSnap.forEach(docSnap => {
      const d = docSnap.data() || {};
      if (d.name) out.products.push(d.name);
      if (d.description) extractText(d.description).forEach(t => out.products.push(t));
    });
  } catch {}

  console.log(JSON.stringify(out, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });


