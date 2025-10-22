const fs = require('fs');
const path = require('path');

const envContent = `
# ==================== STRIPE CONFIGURATION ====================
STRIPE_SECRET_KEY=sk_test_51234567890abcdef...
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef...
STRIPE_WEBHOOK_SECRET=whsec_...

# ==================== FIREBASE CONFIGURATION ====================
REACT_APP_FIREBASE_API_KEY=AIzaSyCMAcBgyNxyToVBavu2HfGpGrK7VMWkyxA
REACT_APP_FIREBASE_AUTH_DOMAIN=delizukar.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=delizukar
REACT_APP_FIREBASE_STORAGE_BUCKET=delizukar.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=638502228599
REACT_APP_FIREBASE_APP_ID=1:638502228599:web:4ecaa6571bddba2a0f2c72

# ==================== SERVER CONFIGURATION ====================
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# ==================== SHIPPO CONFIGURATION ====================
REACT_APP_SHIPPO_API_TOKEN=shippo_test_placeholder
`;

const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent.trim());
  console.log('🔧 Configurando variables de entorno para desarrollo...');
  console.log('\n✅ Archivo .env creado exitosamente');
  console.log('\n📝 IMPORTANTE: Debes configurar tus propias claves:');
  console.log('   1. Ve a https://dashboard.stripe.com/apikeys');
  console.log('   2. Copia tu STRIPE_SECRET_KEY (sk_test_...)');
  console.log('   3. Copia tu REACT_APP_STRIPE_PUBLISHABLE_KEY (pk_test_...)');
  console.log('   4. Edita el archivo .env con tus claves reales');
  console.log('\n🔑 Claves de Stripe necesarias:');
  console.log('   - STRIPE_SECRET_KEY=sk_test_...');
  console.log('   - REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...');
  console.log('\n🚀 Para iniciar la aplicación:');
  console.log('   npm run dev');
  console.log('\n🧪 Para probar la integración:');
  console.log('   npm run test-stripe');
} catch (error) {
  console.error('❌ Error al crear el archivo .env:', error);
}
