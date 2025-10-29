#!/usr/bin/env node

/**
 * Script de prueba para la integración de PayPal
 * Este script verifica que PayPal esté configurado correctamente
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Probando integración de PayPal...');
console.log('=====================================\n');

// Verificar archivo .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ No se encontró archivo .env.local');
  console.log('💡 Ejecuta: npm run setup-paypal');
  process.exit(1);
}

// Cargar variables de entorno
require('dotenv').config({ path: envPath });

// Verificar variables de entorno requeridas
const requiredVars = [
  'REACT_APP_PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET',
  'REACT_APP_PAYPAL_ENVIRONMENT'
];

console.log('🔍 Verificando configuración...\n');

let allConfigured = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: No configurado`);
    allConfigured = false;
  } else {
    const displayValue = varName.includes('SECRET') ? '***' + value.slice(-4) : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  }
});

if (!allConfigured) {
  console.log('\n❌ Configuración incompleta');
  console.log('💡 Ejecuta: npm run setup-paypal');
  process.exit(1);
}

console.log('\n🔧 Verificando archivos de PayPal...');

// Verificar archivos de PayPal
const paypalFiles = [
  'src/paypal/config.js',
  'src/services/paypalService.js',
  'src/components/PayPalPaymentForm.js',
  'src/components/PayPalCardPayment.js'
];

let allFilesExist = true;

paypalFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}: Existe`);
  } else {
    console.log(`❌ ${file}: No encontrado`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Archivos de PayPal faltantes');
  process.exit(1);
}

console.log('\n🔍 Verificando configuración de PayPal...');

// Verificar configuración
const config = {
  clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID,
  environment: process.env.REACT_APP_PAYPAL_ENVIRONMENT,
  currency: process.env.REACT_APP_PAYPAL_CURRENCY || 'USD',
  intent: process.env.REACT_APP_PAYPAL_INTENT || 'capture'
};

console.log(`📋 Configuración actual:`);
console.log(`   Client ID: ${config.clientId}`);
console.log(`   Environment: ${config.environment}`);
console.log(`   Currency: ${config.currency}`);
console.log(`   Intent: ${config.intent}`);

// Verificar que el Client ID no sea el valor por defecto
if (config.clientId === 'sb' || config.clientId === 'tu_client_id_sandbox_aqui') {
  console.log('\n⚠️  Advertencia: Client ID parece ser un valor por defecto');
  console.log('💡 Asegúrate de usar tu Client ID real de PayPal');
}

console.log('\n🧪 Probando conexión con PayPal...');

// Función para probar la conexión con PayPal
async function testPayPalConnection() {
  try {
    const baseUrl = config.environment === 'production' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';
    
    const credentials = Buffer.from(`${config.clientId}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Conexión con PayPal exitosa');
      console.log(`   Token obtenido: ${data.access_token ? 'Sí' : 'No'}`);
      console.log(`   Expira en: ${data.expires_in} segundos`);
    } else {
      const errorData = await response.json();
      console.log('❌ Error en conexión con PayPal');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${errorData.error_description || errorData.message}`);
    }
  } catch (error) {
    console.log('❌ Error de conexión:');
    console.log(`   ${error.message}`);
  }
}

// Ejecutar prueba de conexión
testPayPalConnection().then(() => {
  console.log('\n🎉 ¡Prueba completada!');
  console.log('\n📋 Resumen:');
  console.log('✅ Configuración de variables de entorno: OK');
  console.log('✅ Archivos de PayPal: OK');
  console.log('✅ Configuración básica: OK');
  
  console.log('\n🚀 Próximos pasos:');
  console.log('1. Ejecuta: npm start');
  console.log('2. Ve a la página de checkout');
  console.log('3. Prueba un pago con PayPal');
  console.log('4. Verifica que los pagos se procesen correctamente');
  
  console.log('\n💡 Para producción:');
  console.log('1. Cambia REACT_APP_PAYPAL_ENVIRONMENT a "production"');
  console.log('2. Usa credenciales de producción');
  console.log('3. Prueba con montos reales');
});






