const express = require('express');
const cors = require('cors');
const stripe = require('stripe')('sk_test_51S37NHIfvAAsTaPnNqJm82kGLE8swr8sGcTTqeGoPXR56JoUyNYKrCgDOPiliO11s5VAvfXZcfQpsbQZQI48m3bt00J7Bgr4yz');

const app = express();
app.use(cors());
app.use(express.json());

// ÚNICO endpoint que necesitas
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { cartItems, total, customerInfo } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: cartItems.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: 'http://localhost:3000/checkout/success',
      cancel_url: 'http://localhost:3000/checkout',
      customer_email: customerInfo.email,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(5001, () => console.log('Servidor en puerto 5001'));
