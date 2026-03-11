
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
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

const newProducts = [
  {
    id: 'sweet-box-4',
    name: 'Sweet Box – 4 Cookies',
    price: 52.00,
    image: '/assets/images/caja_generica.png',
    rating: 5.0,
    reviews: 0,
    bestSeller: false,
    isNew: true,
    featured: true,
    active: true,
    category: 'boxes',
    description: 'Build your box with 4 NY-style cookies (200g each). Minimum purchase is 4 cookies.'
  },
  {
    id: 'sweet-box-6',
    name: 'Sweet Box – 6 Cookies',
    price: 74.10,
    image: '/assets/images/caja_generica.png',
    rating: 5.0,
    reviews: 0,
    bestSeller: false,
    isNew: true,
    featured: true,
    active: true,
    category: 'boxes',
    description: 'Build your box with 6 NY-style cookies (200g each). Incluye un 5% de descuento.'
  },
  {
    id: 'sweet-box-12',
    name: 'Deluxe Sweet Box – 12 Cookies',
    price: 140.40,
    image: '/assets/images/caja_generica.png',
    rating: 5.0,
    reviews: 0,
    bestSeller: false,
    isNew: true,
    featured: true,
    active: true,
    category: 'boxes',
    description: 'Perfect for sharing or gifting. 12 NY-style cookies (200g each). Incluye un 10% de descuento.'
  },
  {
    id: 'gift-option',
    name: 'Gift Message + Premium Card',
    price: 9.00,
    image: '/assets/images/caja_generica.png',
    rating: 5.0,
    reviews: 0,
    bestSeller: false,
    isNew: true,
    featured: false,
    active: true,
    category: 'regalo',
    description: 'Add a personalized message inside your box. Perfect for any special occasion.'
  }
];

async function uploadProducts() {
  console.log('🚀 Iniciando carga de nuevos productos a Firebase...');
  for (const product of newProducts) {
    try {
      await setDoc(doc(db, 'products', product.id), product);
      console.log(`✅ Producto cargado: ${product.name}`);
    } catch (e) {
      console.error(`❌ Error cargando ${product.name}:`, e);
    }
  }
  console.log('🎉 Proceso terminado.');
  process.exit();
}

uploadProducts();
