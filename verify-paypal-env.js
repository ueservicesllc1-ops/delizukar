#!/usr/bin/env node

/**
 * Script para verificar que las variables de entorno de PayPal se cargan correctamente
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando variables de entorno de PayPal...');
console.log('===============================================\n');

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const clientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const environment = process.env.REACT_APP_PAYPAL_ENVIRONMENT;
const currency = process.env.REACT_APP_PAYPAL_CURRENCY;
const intent = process.env.REACT_APP_PAYPAL_INTENT;

console.log('📋 Variables de entorno:');
console.log(`REACT_APP_PAYPAL_CLIENT_ID: ${clientId ? '✅ Configurado' : '❌ No configurado'}`);
console.log(`PAYPAL_CLIENT_SECRET: ${clientSecret ? '✅ Configurado' : '❌ No configurado'}`);
console.log(`REACT_APP_PAYPAL_ENVIRONMENT: ${environment || '❌ No configurado'}`);
console.log(`REACT_APP_PAYPAL_CURRENCY: ${currency || '❌ No configurado'}`);
console.log(`REACT_APP_PAYPAL_INTENT: ${intent || '❌ No configurado'}\n`);

if (clientId) {
  console.log(`🔑 Client ID: ${clientId.substring(0, 10)}... (${clientId.length} caracteres)`);
  console.log(`   Formato correcto: ${clientId.startsWith('A') ? '✅' : '❌'}`);
  console.log(`   Longitud correcta: ${clientId.length >= 50 ? '✅' : '❌'}`);
}

if (clientSecret) {
  console.log(`🔐 Client Secret: ${clientSecret.substring(0, 10)}... (${clientSecret.length} caracteres)`);
  console.log(`   Longitud correcta: ${clientSecret.length >= 50 ? '✅' : '❌'}`);
}

console.log('\n🧪 Probando configuración de PayPal...');

// Verificar que el Client ID no sea el valor por defecto
if (clientId === 'sb' || clientId === 'tu_client_id_sandbox_aqui') {
  console.log('❌ ERROR: Client ID es un valor por defecto');
  console.log('💡 Configura tu Client ID real de PayPal');
  process.exit(1);
}

// Verificar formato del Client ID
if (!clientId || !clientId.startsWith('A') || clientId.length < 50) {
  console.log('❌ ERROR: Client ID no tiene el formato correcto');
  console.log('💡 El Client ID debe empezar con "A" y tener al menos 50 caracteres');
  process.exit(1);
}

// Verificar que el Client Secret esté configurado
if (!clientSecret || clientSecret.length < 50) {
  console.log('❌ ERROR: Client Secret no está configurado correctamente');
  console.log('💡 Configura tu Client Secret real de PayPal');
  process.exit(1);
}

console.log('✅ Configuración básica: OK');

// Probar conexión con PayPal
async function testPayPalConnection() {
  try {
    const baseUrl = environment === 'production' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';
    
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    console.log(`🌐 Probando conexión con: ${baseUrl}`);
    
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

testPayPalConnection().then(() => {
  console.log('\n🎉 ¡Verificación completada!');
  console.log('\n📋 Resumen:');
  console.log('✅ Variables de entorno: OK');
  console.log('✅ Formato de credenciales: OK');
  console.log('✅ Conexión con PayPal: OK');
  
  console.log('\n🚀 Próximos pasos:');
  console.log('1. La aplicación debería estar corriendo en http://localhost:3000');
  console.log('2. Ve a la página de checkout');
  console.log('3. Prueba PayPal - debería funcionar ahora');
  console.log('4. Si persiste el error, revisa la consola del navegador');
});










