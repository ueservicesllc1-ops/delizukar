#!/usr/bin/env node

/**
 * Script de inicio para desarrollo con Stripe API v2
 * Inicia tanto el servidor backend como el frontend
 */

const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

console.log('🚀 Iniciando aplicación con Stripe API v2...\n');

// Verificar variables de entorno
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'REACT_APP_STRIPE_PUBLISHABLE_KEY',
  'REACT_APP_FIREBASE_PROJECT_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n📝 Crea un archivo .env basado en config.env.example');
  process.exit(1);
}

console.log('✅ Variables de entorno configuradas correctamente');
console.log('💳 Modo Stripe:', process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'PRUEBA' : 'PRODUCCIÓN');
console.log('🔥 Firebase:', process.env.REACT_APP_FIREBASE_PROJECT_ID);
console.log('');

// Iniciar servidor backend
console.log('🔧 Iniciando servidor backend...');
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
  console.log('🌐 Iniciando aplicación React...');
  
  // Iniciar aplicación React
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

  // Manejar cierre de procesos
  process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando aplicación...');
    serverProcess.kill();
    reactProcess.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando aplicación...');
    serverProcess.kill();
    reactProcess.kill();
    process.exit(0);
  });

}, 2000);

console.log('📱 Aplicación disponible en: http://localhost:3000');
console.log('🔧 API disponible en: http://localhost:5000');
console.log('💳 Stripe Dashboard: https://dashboard.stripe.com/');
console.log('🔥 Firebase Console: https://console.firebase.google.com/');
console.log('');
console.log('Presiona Ctrl+C para detener la aplicación');
