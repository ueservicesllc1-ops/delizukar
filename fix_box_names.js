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

  const box4Ref = doc(db, "products", "sweet-box-4");
  await updateDoc(box4Ref, {
    name: '"A little luxury Box" 4 Cookies',
    description: 'Perfect for enjoying or gifting a sweet moment.',
    name_es: '"Caja Un Pequeño Lujo" 4 Galletas',
    description_es: 'Caja perfecta para disfrutar o regalar un momento dulce.'
  });

  const box6Ref = doc(db, "products", "sweet-box-6");
  await updateDoc(box6Ref, {
    name: '"Sweet Moments Box" 6 Cookies',
    description: '6 New York-style cookies to share and enjoy a special moment.',
    name_es: '"Caja Momentos Dulces" 6 Galletas',
    description_es: '6 galletas estilo Nueva York para compartir y disfrutar de un momento especial.'
  });

  const box12Ref = doc(db, "products", "sweet-box-12");
  await updateDoc(box12Ref, {
    name: '"Celebration Box" 12 Cookies',
    description: '12 New York-style cookies perfect for celebrating, sharing, or surprising someone.',
    name_es: '"Caja de Celebración" 12 Galletas',
    description_es: '12 galletas estilo Nueva York perfectas para celebrar, compartir o sorprender a alguien.'
  });

  console.log('✅ Firestore products updated successfully');
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
