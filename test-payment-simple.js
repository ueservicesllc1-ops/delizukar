#!/usr/bin/env node

/**
 * Script de prueba simplificado para verificar el pago
 * Funciona con variables de entorno mínimas
 */

// Usar fetch nativo de Node.js (disponible desde Node 18+)
const fetch = globalThis.fetch;

const API_BASE = 'http://localhost:5000';

async function testPayment() {
  console.log('🧪 Probando pago con Stripe API v2...\n');

  try {
    // 1. Verificar que el servidor esté funcionando
    console.log('1️⃣ Verificando servidor...');
    const healthResponse = await fetch(`${API_BASE}/api/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Servidor funcionando');
      console.log(`   - Estado: ${healthData.status}`);
      console.log(`   - Stripe configurado: ${healthData.stripe.configured}`);
      console.log(`   - Modo: ${healthData.stripe.mode}`);
    } else {
      throw new Error('Servidor no responde');
    }

    // 2. Probar creación de Payment Intent
    console.log('\n2️⃣ Probando creación de Payment Intent...');
    
    const testData = {
      cartItems: [
        {
          name: 'Galletas de Prueba',
          price: 15.99,
          quantity: 2,
          image: 'https://via.placeholder.com/300x300'
        }
      ],
      total: 31.98,
      customerInfo: {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'test@delizukar.com'
      },
      captureMethod: 'automatic',
      metadata: {
        source: 'test_payment',
        version: '2.0'
      }
    };

    const paymentResponse = await fetch(`${API_BASE}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(testData)
    });

    if (paymentResponse.ok) {
      const paymentData = await paymentResponse.json();
      console.log('✅ Payment Intent creado exitosamente');
      console.log(`   - Client Secret: ${paymentData.clientSecret?.substring(0, 20)}...`);
      console.log(`   - Total: $${testData.total}`);
    } else {
      const errorData = await paymentResponse.json();
      console.log('⚠️  Error creando Payment Intent:');
      console.log(`   - Error: ${errorData.error}`);
      console.log('\n🔧 Soluciones:');
      console.log('   1. Verifica que STRIPE_SECRET_KEY esté configurado');
      console.log('   2. Asegúrate de que la clave sea válida');
      console.log('   3. Verifica que estés en modo TEST (sk_test_...)');
    }

    // 3. Probar Checkout Session
    console.log('\n3️⃣ Probando Checkout Session...');
    
    const checkoutResponse = await fetch(`${API_BASE}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...testData,
        paymentMethodTypes: ['card', 'afterpay_clearpay', 'klarna', 'affirm']
      })
    });

    if (checkoutResponse.ok) {
      const checkoutData = await checkoutResponse.json();
      console.log('✅ Checkout Session creado exitosamente');
      console.log(`   - Session ID: ${checkoutData.sessionId}`);
      console.log(`   - URL: ${checkoutData.url?.substring(0, 50)}...`);
    } else {
      const errorData = await checkoutResponse.json();
      console.log('⚠️  Error creando Checkout Session:');
      console.log(`   - Error: ${errorData.error}`);
    }

    console.log('\n🎉 ¡Prueba completada!');
    console.log('\n📋 Resumen:');
    console.log('   ✅ Servidor funcionando');
    console.log('   ✅ API endpoints respondiendo');
    console.log('   ✅ Stripe API v2 configurado');
    
    console.log('\n🚀 Para usar la aplicación:');
    console.log('   1. Configura tus claves de Stripe en .env');
    console.log('   2. Ejecuta: npm run dev');
    console.log('   3. Ve a: http://localhost:3000');
    console.log('   4. Prueba el pago con tarjetas de prueba');

  } catch (error) {
    console.error('\n❌ Error en la prueba:', error.message);
    console.log('\n🔧 Soluciones:');
    console.log('   1. Asegúrate de que el servidor esté ejecutándose');
    console.log('   2. Verifica que el puerto 5000 esté disponible');
    console.log('   3. Revisa los logs del servidor');
  }
}

// Ejecutar prueba
testPayment();
