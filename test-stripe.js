#!/usr/bin/env node

// Usar fetch nativo de Node.js 18+ o node-fetch
const fetch = globalThis.fetch || require('node-fetch');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';

// Datos de prueba
const testData = {
  cartItems: [
    {
      id: '1',
      name: 'Ferrero Hype',
      price: 10.00,
      quantity: 2,
      image: 'https://example.com/ferrero.jpg',
      description: 'Deliciosas galletas Ferrero'
    },
    {
      id: '2', 
      name: 'Chocole DeLux',
      price: 12.00,
      quantity: 1,
      image: 'https://example.com/chocole.jpg',
      description: 'Galletas premium de chocolate'
    }
  ],
  total: 32.00,
  customerInfo: {
    email: 'test@delizukar.com',
    firstName: 'Juan',
    lastName: 'Pérez',
    phone: '+1234567890',
    address: {
      line1: '123 Main St',
      city: 'New York',
      postal_code: '10001',
      country: 'US'
    }
  }
};

async function testHealthCheck() {
  console.log('🔍 Probando health check...');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    console.log('✅ Health check exitoso:', data);
    return true;
  } catch (error) {
    console.error('❌ Health check falló:', error.message);
    return false;
  }
}

async function testCreatePaymentIntent() {
  console.log('🔍 Probando creación de Payment Intent...');
  try {
    const response = await fetch(`${BASE_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const data = await response.json();
    
    if (data.clientSecret) {
      console.log('✅ Payment Intent creado exitosamente');
      console.log('🔑 Client Secret:', data.clientSecret.substring(0, 20) + '...');
      return data.clientSecret;
    } else {
      console.error('❌ Error en Payment Intent:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creando Payment Intent:', error.message);
    return null;
  }
}

async function testCreateCheckoutSession() {
  console.log('🔍 Probando creación de Checkout Session...');
  try {
    const response = await fetch(`${BASE_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...testData,
        successUrl: 'http://localhost:3000/checkout/success',
        cancelUrl: 'http://localhost:3000/checkout'
      })
    });
    
    const data = await response.json();
    
    if (data.sessionId) {
      console.log('✅ Checkout Session creado exitosamente');
      console.log('🆔 Session ID:', data.sessionId);
      console.log('🔗 URL:', data.url);
      return data.sessionId;
    } else {
      console.error('❌ Error en Checkout Session:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creando Checkout Session:', error.message);
    return null;
  }
}

async function testCreateOrder() {
  console.log('🔍 Probando creación de orden...');
  try {
    const response = await fetch(`${BASE_URL}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'test_session_123',
        ...testData,
        paymentStatus: 'pending'
      })
    });
    
    const data = await response.json();
    
    if (data.orderId) {
      console.log('✅ Orden creada exitosamente');
      console.log('🆔 Order ID:', data.orderId);
      return data.orderId;
    } else {
      console.error('❌ Error creando orden:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creando orden:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Iniciando tests de Stripe para Delizukar...\n');
  
  // Test 1: Health Check
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n❌ Tests fallaron - servidor no disponible');
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Payment Intent
  const clientSecret = await testCreatePaymentIntent();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: Checkout Session
  const sessionId = await testCreateCheckoutSession();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 4: Create Order
  const orderId = await testCreateOrder();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Resumen
  console.log('📊 Resumen de Tests:');
  console.log(`   Health Check: ${healthOk ? '✅' : '❌'}`);
  console.log(`   Payment Intent: ${clientSecret ? '✅' : '❌'}`);
  console.log(`   Checkout Session: ${sessionId ? '✅' : '❌'}`);
  console.log(`   Create Order: ${orderId ? '✅' : '❌'}`);
  
  const allPassed = healthOk && clientSecret && sessionId && orderId;
  
  if (allPassed) {
    console.log('\n🎉 ¡Todos los tests pasaron! El sistema de Stripe está funcionando correctamente.');
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Configura el webhook secret en .env');
    console.log('   2. Configura el webhook en Stripe Dashboard');
    console.log('   3. Prueba con tarjetas de prueba');
  } else {
    console.log('\n❌ Algunos tests fallaron. Revisa la configuración.');
    process.exit(1);
  }
}

// Ejecutar tests
runTests().catch(error => {
  console.error('💥 Error ejecutando tests:', error);
  process.exit(1);
});
