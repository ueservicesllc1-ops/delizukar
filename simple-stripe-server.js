const express = require('express');
const cors = require('cors');
const stripe = require('stripe')('sk_test_51S37NHIfvAAsTaPnNqJm82kGLE8swr8sGcTTqeGoPXR56JoUyNYKrCgDOPiliO11s5VAvfXZcfQpsbQZQI48m3bt00J7Bgr4yz');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

console.log('🚀 Servidor Stripe Simple iniciado...');
console.log('💳 Stripe configurado en modo TEST');

// ==================== ENDPOINT PRINCIPAL ====================

// Crear sesión de pago (lo único que necesitas)
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { cartItems, total, customerInfo } = req.body;

    console.log('💳 Creando sesión de pago para:', customerInfo.email);
    console.log('🛒 Productos:', cartItems.length);
    console.log('💰 Total: $' + total);

    // Crear la sesión de Stripe (esto abre la pantalla de pago)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'apple_pay', 'google_pay'],
      line_items: cartItems.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            images: [item.image],
            description: item.description || '',
          },
          unit_amount: Math.round(item.price * 100), // Convertir a centavos
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: 'http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/checkout',
      customer_email: customerInfo.email,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'MX', 'ES', 'FR', 'DE', 'IT', 'GB'],
      },
    });

    console.log('✅ Sesión creada:', session.id);
    console.log('🔗 URL de pago:', session.url);

    res.json({ 
      sessionId: session.id, 
      url: session.url 
    });

  } catch (error) {
    console.error('❌ Error creando sesión:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor Stripe funcionando',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log('💡 Endpoint principal: POST /api/create-checkout-session');
  console.log('🧪 Health check: GET /api/health');
  console.log('');
  console.log('📋 Para probar:');
  console.log('   curl -X POST http://localhost:5000/api/create-checkout-session \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"cartItems":[{"name":"Test","price":10,"quantity":1}],"total":10,"customerInfo":{"email":"test@test.com"}}\'');
});
