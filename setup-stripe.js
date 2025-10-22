#!/usr/bin/env node

/**
 * Script para configurar Stripe paso a paso
 */

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupStripe() {
  console.log('🔧 Configuración de Stripe API v2\n');
  
  console.log('📋 Pasos para configurar Stripe:');
  console.log('1. Ve a https://dashboard.stripe.com/apikeys');
  console.log('2. Asegúrate de estar en modo TEST (no LIVE)');
  console.log('3. Copia tus claves de prueba\n');
  
  try {
    // Solicitar claves de Stripe
    const secretKey = await question('🔑 Ingresa tu STRIPE_SECRET_KEY (sk_test_...): ');
    const publishableKey = await question('🔑 Ingresa tu REACT_APP_STRIPE_PUBLISHABLE_KEY (pk_test_...): ');
    
    if (!secretKey.startsWith('sk_test_')) {
      console.log('⚠️  Advertencia: La clave secreta no parece ser de prueba (sk_test_)');
    }
    
    if (!publishableKey.startsWith('pk_test_')) {
      console.log('⚠️  Advertencia: La clave pública no parece ser de prueba (pk_test_)');
    }
    
    // Crear archivo .env
    const envContent = `# ==================== STRIPE CONFIGURATION ====================
STRIPE_SECRET_KEY=${secretKey}
REACT_APP_STRIPE_PUBLISHABLE_KEY=${publishableKey}

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

    fs.writeFileSync('.env', envContent);
    
    console.log('\n✅ Archivo .env creado exitosamente');
    console.log('\n🚀 Ahora puedes iniciar la aplicación:');
    console.log('   npm run dev');
    console.log('\n🧪 Para probar el pago:');
    console.log('   npm run test-stripe');
    console.log('\n🌐 La aplicación estará disponible en:');
    console.log('   http://localhost:3000');
    
    console.log('\n💳 Tarjetas de prueba para usar:');
    console.log('   ✅ Éxito: 4242424242424242');
    console.log('   ❌ Rechazada: 4000000000000002');
    console.log('   🔒 3D Secure: 4000002500003155');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Ejecutar configuración
setupStripe();