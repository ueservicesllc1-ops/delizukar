#!/usr/bin/env node

/**
 * Prueba final de PayPal - Verifica que todo esté funcionando
 */

console.log('🎯 Prueba Final de PayPal');
console.log('========================\n');

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const clientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const environment = process.env.REACT_APP_PAYPAL_ENVIRONMENT;

console.log('✅ Configuración verificada:');
console.log(`   Client ID: ${clientId ? 'Configurado' : 'No configurado'}`);
console.log(`   Client Secret: ${clientSecret ? 'Configurado' : 'No configurado'}`);
console.log(`   Environment: ${environment || 'No configurado'}`);

if (!clientId || clientId === 'sb') {
  console.log('\n❌ ERROR: Client ID no configurado correctamente');
  console.log('💡 Solución:');
  console.log('1. Verifica que el archivo .env.local existe');
  console.log('2. Verifica que REACT_APP_PAYPAL_CLIENT_ID está configurado');
  console.log('3. Reinicia la aplicación con: npm start');
  process.exit(1);
}

console.log('\n🎉 ¡Configuración correcta!');
console.log('\n📋 Instrucciones para probar:');
console.log('1. Abre tu navegador en: http://localhost:3000');
console.log('2. Ve a la página de checkout');
console.log('3. Busca el botón de PayPal');
console.log('4. Si ves "PayPal Client ID not configured", reinicia la aplicación');
console.log('5. Si funciona, ¡PayPal está listo!');

console.log('\n🔧 Si persiste el error:');
console.log('1. Detén la aplicación (Ctrl+C)');
console.log('2. Ejecuta: npm start');
console.log('3. Espera a que cargue completamente');
console.log('4. Prueba de nuevo');

console.log('\n📞 Para más ayuda:');
console.log('- Revisa la consola del navegador (F12)');
console.log('- Ejecuta: npm run debug-paypal');
console.log('- Lee: PAYPAL_TROUBLESHOOTING.md');


