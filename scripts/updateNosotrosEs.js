// Actualiza el documento pages/nosotros en Firestore con contenido en español
// Uso: node scripts/updateNosotrosEs.js

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

  const title = 'Nuestra Historia';
  const content = `Para mí, hornear se ha convertido en una parte esencial de mi vida durante más de doce años. Lo que comenzó como una simple curiosidad, junto a mi esposo, pronto se transformó en una pasión profunda: crear con mis manos pequeñas obras llenas de sabor, emoción y amor. Siempre he creído que cada dulce tiene el poder de contar una historia, de provocar una sonrisa o revivir un recuerdo especial.

Por eso, para mí no se trata solo de hornear. Se trata de dar vida a cada una de mis creaciones, cuidar cada detalle y poner el corazón en cada receta. Nuestra cocina no es solo un lugar de trabajo; es nuestro taller de sueños. Es donde combinamos tradición, creatividad y mucha dedicación para que cada galleta, pastel o postre transmita algo más que buen sabor: transmita amor, alegría y el deseo sincero de hacer felices a los demás.

A lo largo de este camino, he aprendido, me he equivocado, he mejorado y, sobre todo, he crecido. Y aunque aún quedan muchos sueños por cumplir, cada paso ha valido la pena, porque estoy haciendo lo que amo. Hoy sigo creando, aprendiendo y soñando de la mano de mi esposo. Porque mientras existan personas que crean en HECHO EN CASA CON AMOR, hornear seguirá siendo mi forma de hablarle al mundo.

Gracias por estar aquí y por permitirnos ser parte de tus momentos más dulces.`;

  const pageRef = doc(db, 'pages', 'nosotros');
  await updateDoc(pageRef, {
    title,
    content,
    titleFont: 'BrittanySignature',
    contentFont: 'Asap-Regular',
    updatedAt: new Date()
  });

  console.log('✅ Firestore actualizado: pages/nosotros');
}

main().catch((e) => {
  console.error('❌ Error actualizando pages/nosotros:', e);
  process.exit(1);
});


