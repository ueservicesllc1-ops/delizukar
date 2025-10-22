#!/usr/bin/env node

// Test simple para verificar que Stripe funciona
const fetch = globalThis.fetch || require('node-fetch');

const testData = {
  cartItems: [
    {
      name: 'Ferrero Hype',
      price: 10.00,
      quantity: 2,
      image: 'https://example.com/ferrero.jpg',
      description: 'Deliciosas galletas Ferrero'
    }
  ],
  total: 20.00,
  customerInfo: {
    email: 'test@delizukar.com',
    firstName: 'Juan',
    lastName: 'Pérez'
  }
};

async function testStripe() {
  console.log('🧪 Probando Stripe Simple...\n');

  try {
    // Test 1: Health check
    console.log('🔍 Probando health check...');
    const healthResponse = await fetch('http://localhost:5000/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);

    // Test 2: Crear sesión de pago
    console.log('\n🔍 Probando creación de sesión de pago...');
    const paymentResponse = await fetch('http://localhost:5000/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const paymentData = await paymentResponse.json();

    if (paymentData.sessionId) {
      console.log('✅ Sesión de pago creada exitosamente!');
      console.log('🆔 Session ID:', paymentData.sessionId);
      console.log('🔗 URL de pago:', paymentData.url);
      console.log('\n🎉 ¡Stripe está funcionando perfectamente!');
      console.log('\n💡 Para probar en el navegador:');
      console.log('   1. Ve a http://localhost:3000/checkout');
      console.log('   2. Agrega productos al carrito');
      console.log('   3. Haz clic en "Pagar con Stripe"');
      console.log('   4. Usa la tarjeta de prueba: 4242424242424242');
    } else {
      console.error('❌ Error:', paymentData.error);
    }

  } catch (error) {
    console.error('❌ Error en el test:', error.message);
  }
}

testStripe();
