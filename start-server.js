#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando servidor de Delizukar...');

// Verificar que las variables de entorno estén configuradas
require('dotenv').config();

const requiredEnvVars = [
  'REACT_APP_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'REACT_APP_FIREBASE_PROJECT_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n💡 Asegúrate de configurar todas las variables en el archivo .env');
  process.exit(1);
}

console.log('✅ Variables de entorno configuradas correctamente');
console.log(`💳 Stripe en modo: ${process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'TEST' : 'LIVE'}`);
console.log(`🔥 Firebase proyecto: ${process.env.REACT_APP_FIREBASE_PROJECT_ID}`);

// Iniciar el servidor
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

server.on('error', (err) => {
  console.error('❌ Error al iniciar el servidor:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Servidor terminado con código ${code}`);
    process.exit(code);
  }
});

// Manejar cierre graceful
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando servidor...');
  server.kill('SIGTERM');
  process.exit(0);
});
