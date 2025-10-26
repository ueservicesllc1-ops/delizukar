#!/usr/bin/env node

/**
 * Script de diagnóstico avanzado para PayPal
 * Identifica problemas específicos en la configuración
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnóstico avanzado de PayPal...');
console.log('=====================================\n');

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

console.log('📋 Variables de entorno:');
console.log(`REACT_APP_PAYPAL_CLIENT_ID: ${process.env.REACT_APP_PAYPAL_CLIENT_ID || 'NO CONFIGURADO'}`);
console.log(`PAYPAL_CLIENT_SECRET: ${process.env.PAYPAL_CLIENT_SECRET ? 'CONFIGURADO' : 'NO CONFIGURADO'}`);
console.log(`REACT_APP_PAYPAL_ENVIRONMENT: ${process.env.REACT_APP_PAYPAL_ENVIRONMENT || 'NO CONFIGURADO'}`);
console.log(`REACT_APP_PAYPAL_CURRENCY: ${process.env.REACT_APP_PAYPAL_CURRENCY || 'NO CONFIGURADO'}`);
console.log(`REACT_APP_PAYPAL_INTENT: ${process.env.REACT_APP_PAYPAL_INTENT || 'NO CONFIGURADO'}\n`);

// Verificar archivos de PayPal
console.log('📁 Archivos de PayPal:');
const paypalFiles = [
  'src/paypal/config.js',
  'src/services/paypalService.js',
  'src/components/PayPalPaymentForm.js',
  'src/components/PayPalCardPayment.js',
  'src/components/PayPalCheckout.js'
];

paypalFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}: Existe`);
  } else {
    console.log(`❌ ${file}: No encontrado`);
  }
});

// Verificar configuración del Client ID
const clientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;
if (!clientId) {
  console.log('\n❌ ERROR: REACT_APP_PAYPAL_CLIENT_ID no está configurado');
  process.exit(1);
}

if (clientId === 'sb' || clientId === 'tu_client_id_sandbox_aqui') {
  console.log('\n⚠️  ADVERTENCIA: Client ID parece ser un valor por defecto');
  console.log('💡 Asegúrate de usar tu Client ID real de PayPal');
}

// Verificar formato del Client ID
if (!clientId.startsWith('A') || clientId.length < 50) {
  console.log('\n❌ ERROR: Client ID no tiene el formato correcto');
  console.log('💡 El Client ID debe empezar con "A" y tener al menos 50 caracteres');
}

console.log('\n🧪 Probando conexión con PayPal...');

// Función para probar la conexión
async function testPayPalConnection() {
  try {
    const baseUrl = process.env.REACT_APP_PAYPAL_ENVIRONMENT === 'production' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';
    
    const credentials = Buffer.from(`${clientId}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    console.log(`🌐 Probando conexión con: ${baseUrl}`);
    console.log(`🔑 Usando Client ID: ${clientId.substring(0, 10)}...`);
    
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
      console.log(`   Tipo de token: ${data.token_type}`);
    } else {
      const errorData = await response.json();
      console.log('❌ Error en conexión con PayPal');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${errorData.error_description || errorData.message}`);
      
      if (response.status === 401) {
        console.log('💡 Posibles causas:');
        console.log('   - Client ID incorrecto');
        console.log('   - Client Secret incorrecto');
        console.log('   - Credenciales de entorno incorrecto');
      } else if (response.status === 403) {
        console.log('💡 Posibles causas:');
        console.log('   - Aplicación no activada');
        console.log('   - Restricciones de IP');
        console.log('   - Cuenta suspendida');
      }
    }
  } catch (error) {
    console.log('❌ Error de conexión:');
    console.log(`   ${error.message}`);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Posibles causas:');
      console.log('   - Problema de conexión a internet');
      console.log('   - Firewall bloqueando la conexión');
      console.log('   - DNS no resuelve la URL de PayPal');
    }
  }
}

// Ejecutar diagnóstico
testPayPalConnection().then(() => {
  console.log('\n📋 Resumen del diagnóstico:');
  
  const issues = [];
  
  if (!process.env.REACT_APP_PAYPAL_CLIENT_ID) {
    issues.push('Client ID no configurado');
  }
  
  if (!process.env.PAYPAL_CLIENT_SECRET) {
    issues.push('Client Secret no configurado');
  }
  
  if (process.env.REACT_APP_PAYPAL_CLIENT_ID === 'sb') {
    issues.push('Client ID es valor por defecto');
  }
  
  if (issues.length === 0) {
    console.log('✅ Configuración básica: OK');
    console.log('✅ Archivos: OK');
    console.log('✅ Variables de entorno: OK');
    
    console.log('\n🚀 Próximos pasos:');
    console.log('1. Reinicia tu aplicación: npm start');
    console.log('2. Abre la consola del navegador (F12)');
    console.log('3. Ve a la página de checkout');
    console.log('4. Revisa los mensajes de error en la consola');
    console.log('5. Si persiste el error, verifica la configuración del navegador');
  } else {
    console.log('❌ Problemas encontrados:');
    issues.forEach(issue => console.log(`   - ${issue}`));
    
    console.log('\n💡 Soluciones:');
    console.log('1. Ejecuta: npm run setup-paypal');
    console.log('2. O crea manualmente .env.local con tus credenciales');
    console.log('3. Reinicia la aplicación después de configurar');
  }
});


