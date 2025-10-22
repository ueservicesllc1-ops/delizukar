#!/usr/bin/env node

/**
 * Script para configurar variables de entorno para desarrollo
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Configurando variables de entorno para desarrollo...\n');

// Variables de entorno mínimas para desarrollo
const envContent = `# ==================== STRIPE CONFIGURATION ====================
# Para desarrollo - usa claves de TEST
STRIPE_SECRET_KEY=sk_test_51234567890abcdef...
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef...

# ==================== FIREBASE CONFIGURATION ====================
# Configuración mínima para desarrollo
REACT_APP_FIREBASE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
REACT_APP_FIREBASE_AUTH_DOMAIN=delizukar-test.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=delizukar-test
REACT_APP_FIREBASE_STORAGE_BUCKET=delizukar-test.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# ==================== SERVER CONFIGURATION ====================
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# ==================== STRIPE API V2 CONFIGURATION ====================
STRIPE_API_VERSION=2024-09-30.acacia

# ==================== TESTING CONFIGURATION ====================
STRIPE_TEST_MODE=true
`;

try {
  // Crear archivo .env
  fs.writeFileSync('.env', envContent);
  console.log('✅ Archivo .env creado exitosamente');
  
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
  console.error('❌ Error creando archivo .env:', error.message);
  process.exit(1);
}
