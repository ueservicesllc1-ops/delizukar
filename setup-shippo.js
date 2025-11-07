/**
 * Script de configuración para Shippo
 * 
 * Este script ayuda a configurar y verificar la integración con Shippo
 * 
 * Referencias:
 * - Documentación: https://docs.goshippo.com/
 * - Portal: https://apps.goshippo.com/
 * - Testing: https://docs.goshippo.com/docs/guides_general/testing/
 * - Authentication: https://docs.goshippo.com/docs/guides_general/authentication/
 */

require('dotenv').config();

// Nueva API de Shippo v2: usar new Shippo.Shippo({ apiKeyHeader })
const shippoModule = require('shippo');
const apiToken = process.env.SHIPPO_API_TOKEN || process.env.REACT_APP_SHIPPO_API_TOKEN;
if (!apiToken) {
  console.error('❌ SHIPPO_API_TOKEN no está configurada en .env');
  process.exit(1);
}
const shippo = new shippoModule.Shippo({ apiKeyHeader: apiToken });

async function setupShippo() {
  console.log('🚀 Configurando Shippo...\n');

  // Verificar que el token esté configurado
  const token = process.env.SHIPPO_API_TOKEN || process.env.REACT_APP_SHIPPO_API_TOKEN;
  
  if (!token || token === 'shippo_test_placeholder' || token.includes('placeholder')) {
    console.error('❌ SHIPPO_API_TOKEN no está configurada o está usando un placeholder');
    console.log('\n📝 Para configurar Shippo:');
    console.log('   1. Ve a https://apps.goshippo.com/join para crear una cuenta');
    console.log('   2. Inicia sesión en https://apps.goshippo.com/');
    console.log('   3. Ve a API Configuration > Developer keys');
    console.log('   4. Haz clic en "Create new test key" para desarrollo');
    console.log('   5. Copia el token (comienza con shippo_test_)');
    console.log('   6. Agrega el token a tu archivo .env:');
    console.log('      SHIPPO_API_TOKEN=shippo_test_tu_token_aqui');
    console.log('      REACT_APP_SHIPPO_API_TOKEN=shippo_test_tu_token_aqui');
    console.log('\n💡 Para producción, usa "Create new live key" (comienza con shippo_live_)');
    console.log(`\n⚠️  Usando token por defecto: ${apiToken.substring(0, 20)}...`);
  }

  console.log('✅ Token de Shippo configurado');
  console.log(`   Token: ${apiToken.substring(0, 20)}...`);
  console.log(`   Modo: ${apiToken.startsWith('shippo_test_') ? 'TEST' : apiToken.startsWith('shippo_live_') ? 'PRODUCTION' : 'UNKNOWN'}\n`);

  try {
    // Verificar conexión obteniendo la lista de carrier accounts (nueva API v2)
    console.log('🔍 Verificando conexión con Shippo API...');
    
    // Intentar crear una dirección de prueba para verificar la conexión
    console.log('🧪 Creando dirección de prueba...');
    const testAddress = await shippo.addresses.create({
      name: 'Test Address',
      street1: '215 Clayton St.',
      city: 'San Francisco',
      state: 'CA',
      zip: '94117',
      country: 'US',
      phone: '+1 555 341 9393',
      email: 'test@example.com',
      is_residential: true
    });

    // API v2 devuelve 'id' directamente
    const addressId = testAddress.id || testAddress.objectId || testAddress.object_id;
    const validationResult = testAddress.validation_result || testAddress.validation_results || testAddress.validationResult;
    
    console.log('✅ Conexión exitosa con Shippo API');
    console.log(`   Dirección creada: ${addressId}`);
    
    if (validationResult && validationResult.is_valid !== false) {
      console.log('✅ Dirección de prueba creada y validada');
      console.log(`   ID: ${addressId}`);
    } else {
      console.log('⚠️  Dirección de prueba creada pero no validada');
      console.log(`   ID: ${addressId}`);
      if (validationResult?.messages || validationResult?.reasons) {
        console.log('   Mensajes:', validationResult.messages || validationResult.reasons);
      }
    }

    console.log('\n✅ Configuración de Shippo completada exitosamente');
    console.log('\n📚 Próximos pasos:');
    console.log('   1. Revisa la documentación: https://docs.goshippo.com/');
    console.log('   2. Prueba crear un shipment: POST /api/shippo/shipments');
    console.log('   3. Prueba obtener rates: GET /api/shippo/shipments/:id/rates');
    console.log('   4. Prueba crear una transacción: POST /api/shippo/transactions');
    console.log('\n💡 En modo TEST puedes crear etiquetas de prueba sin costo');
    console.log('   Las etiquetas de prueba están marcadas como "SAMPLE - DO NOT MAIL"');

  } catch (error) {
    console.error('❌ Error al verificar Shippo:', error.message);
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.log('\n💡 El token de API parece ser inválido o ha expirado');
      console.log('   Verifica que el token sea correcto en tu archivo .env');
    } else if (error.message.includes('Token does not exist')) {
      console.log('\n💡 El token no existe o ha sido eliminado');
      console.log('   Genera un nuevo token en https://apps.goshippo.com/');
    } else {
      console.log('\n💡 Revisa la documentación de Shippo para más ayuda');
      console.log('   https://docs.goshippo.com/docs/guides_general/authentication/');
    }
  }
}

// Ejecutar setup
setupShippo().catch(console.error);


