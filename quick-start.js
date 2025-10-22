#!/usr/bin/env node

/**
 * Script de inicio rápido para configurar y probar Stripe
 */

const { spawn } = require('child_process');
const fs = require('fs');

console.log('🚀 Inicio Rápido - Stripe API v2\n');

// Verificar si existe .env
if (!fs.existsSync('.env')) {
  console.log('📝 Creando archivo .env con configuración de prueba...');
  
  const envContent = `# ==================== STRIPE CONFIGURATION ====================
# CONFIGURA ESTAS CLAVES CON TUS VALORES REALES
STRIPE_SECRET_KEY=sk_test_51234567890abcdef...
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef...

# ==================== FIREBASE CONFIGURATION ====================
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
  console.log('✅ Archivo .env creado');
}

console.log('🔧 Iniciando servidor backend...');

// Iniciar servidor
const serverProcess = spawn('node', ['server.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

serverProcess.on('error', (err) => {
  console.error('❌ Error iniciando servidor:', err);
  process.exit(1);
});

// Esperar un poco para que el servidor se inicie
setTimeout(() => {
  console.log('\n🌐 Iniciando aplicación React...');
  
  // Iniciar React
  const reactProcess = spawn('npm', ['start'], {
    stdio: 'inherit',
    cwd: __dirname,
    shell: true
  });

  reactProcess.on('error', (err) => {
    console.error('❌ Error iniciando React:', err);
    serverProcess.kill();
    process.exit(1);
  });

  // Manejar cierre
  process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando aplicación...');
    serverProcess.kill();
    reactProcess.kill();
    process.exit(0);
  });

}, 3000);

console.log('\n📱 URLs de la aplicación:');
console.log('   - Frontend: http://localhost:3000');
console.log('   - Backend: http://localhost:5000');
console.log('   - Health Check: http://localhost:5000/api/health');

console.log('\n💳 Para probar pagos:');
console.log('   1. Ve a http://localhost:3000');
console.log('   2. Agrega productos al carrito');
console.log('   3. Ve al checkout');
console.log('   4. Usa tarjetas de prueba:');
console.log('      ✅ Éxito: 4242424242424242');
console.log('      ❌ Rechazada: 4000000000000002');

console.log('\n🔧 Si necesitas configurar Stripe:');
console.log('   1. Ve a https://dashboard.stripe.com/apikeys');
console.log('   2. Copia tus claves de prueba');
console.log('   3. Edita el archivo .env');

console.log('\nPresiona Ctrl+C para detener la aplicación');
