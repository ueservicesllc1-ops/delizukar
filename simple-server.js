const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Endpoint simple para crear sesión de checkout
app.post('/api/create-checkout', async (req, res) => {
  try {
    const { cartItems, total, customerEmail } = req.body;

    // Aquí irías a tu dashboard de Stripe y crearías un producto
    // Por ahora, vamos a usar un ejemplo simple
    
    const stripeCheckoutUrl = `https://checkout.stripe.com/pay/cs_test_example`;
    
    res.json({ 
      success: true, 
      checkoutUrl: stripeCheckoutUrl,
      message: 'Redirigiendo a Stripe Checkout...'
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor simple funcionando',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor simple corriendo en puerto ${PORT}`);
  console.log(`💡 Método fácil: Solo redirección a Stripe`);
});
