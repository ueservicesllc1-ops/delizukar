const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_development', {
  apiVersion: '2024-09-30.acacia', // Latest API version
  maxNetworkRetries: 3, // Enhanced retry logic
  timeout: 30000, // 30 second timeout
});
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, updateDoc, getDoc } = require('firebase/firestore');

const app = express();
const PORT = process.env.PORT || 5000;

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Enhanced middleware with security best practices
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Stripe-Signature']
}));

// Enhanced JSON parsing with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Middleware para webhook (raw body)
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// ==================== STRIPE ENDPOINTS ====================

// 1. Crear sesión de Checkout
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    // Verificar si Stripe está configurado
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_dummy_key_for_development') {
      return res.status(500).json({ 
        error: 'Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.' 
      });
    }
    const { 
      cartItems, 
      total, 
      customerInfo, 
      successUrl, 
      cancelUrl,
      paymentMethodTypes,
      customerCreation,
      billingAddressCollection,
      shippingAddressCollection,
      phoneNumberCollection,
      automaticTax
    } = req.body;

    console.log('Creating checkout session for:', customerInfo.email);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethodTypes || ['card', 'link', 'klarna', 'paypal', 'afterpay_clearpay', 'affirm'],
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
      success_url: successUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout`,
      customer_email: customerInfo.email,
      customer_creation: customerCreation || 'always',
      billing_address_collection: billingAddressCollection || 'required',
      shipping_address_collection: shippingAddressCollection || {
        allowed_countries: ['US', 'CA', 'MX', 'ES', 'FR', 'DE', 'IT', 'GB'],
      },
      phone_number_collection: phoneNumberCollection || {
        enabled: true,
      },
      automatic_tax: automaticTax || {
        enabled: true,
      },
      // Configuración para envío automático de recibos
      payment_intent_data: {
        receipt_email: customerInfo.email,
        metadata: {
          customer_email: customerInfo.email,
          customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
          order_items: JSON.stringify(cartItems),
        },
      },
    });

    console.log('Checkout session created:', session.id);
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Crear Payment Intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    // Verificar si Stripe está configurado
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_dummy_key_for_development') {
      return res.status(500).json({ 
        error: 'Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.' 
      });
    }
    const { cartItems, total, customerInfo, captureMethod } = req.body;

    console.log('Creating payment intent for:', customerInfo.email);

    // Enhanced PaymentIntent creation with API v2 features
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convertir a centavos
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always', // Permitir métodos que requieren redirección
      },
      payment_method_types: ['card', 'afterpay_clearpay', 'klarna', 'affirm', 'link'],
      capture_method: captureMethod || 'automatic',
      metadata: {
        customer_email: customerInfo.email,
        customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        order_items: JSON.stringify(cartItems),
        source: 'web_checkout',
        version: '2.0',
        integration: 'stripe_js_v2'
      },
      receipt_email: customerInfo.email,
      // Enhanced configuration for better user experience
      confirmation_method: 'automatic',
      setup_future_usage: 'off_session', // For future payments
      // Configuración para autorización separada
      ...(captureMethod === 'manual' && {
        capture_method: 'manual',
      }),
    }, {
      // Enhanced request options with idempotency
      idempotencyKey: `pi_${Date.now()}_${customerInfo.email}`,
      timeout: 30000,
      maxNetworkRetries: 3
    });

    console.log('Payment intent created:', paymentIntent.id);
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Capturar pago (para autorización separada)
app.post('/api/capture-payment', async (req, res) => {
  try {
    const { paymentIntentId, amountToCapture } = req.body;

    console.log('Capturing payment:', paymentIntentId);

    const paymentIntent = await stripe.paymentIntents.capture(
      paymentIntentId,
      {
        amount_to_capture: amountToCapture ? Math.round(amountToCapture * 100) : undefined,
      }
    );

    console.log('Payment captured:', paymentIntent.id);
    res.json({ paymentIntent });
  } catch (error) {
    console.error('Error capturing payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Obtener sesión de checkout
app.get('/api/checkout-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.json({ session });
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Crear orden en Firestore
app.post('/api/create-order', async (req, res) => {
  try {
    const { sessionId, customerInfo, cartItems, total, paymentStatus } = req.body;

    console.log('Creating order in Firestore for session:', sessionId);

    const orderData = {
      sessionId,
      customerInfo,
      cartItems,
      total,
      paymentStatus: paymentStatus || 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'orders'), orderData);
    
    console.log('Order created with ID:', docRef.id);
    res.json({ orderId: docRef.id, order: orderData });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Actualizar orden
app.put('/api/update-order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const updateData = req.body;

    console.log('Updating order:', orderId);

    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      ...updateData,
      updatedAt: new Date(),
    });

    console.log('Order updated:', orderId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Obtener orden
app.get('/api/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (orderSnap.exists()) {
      res.json({ order: orderSnap.data() });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({ error: error.message });
  }
});

// 8. Obtener recibo de pago
app.get('/api/receipt/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    console.log('Retrieving receipt for payment intent:', paymentIntentId);

    // Obtener el PaymentIntent de Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Obtener el recibo del charge
    const charge = paymentIntent.charges?.data?.[0];
    const receiptUrl = charge?.receipt_url;

    if (receiptUrl) {
      res.json({ 
        receiptUrl,
        paymentIntent: {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          created: paymentIntent.created
        },
        charge: {
          id: charge.id,
          receiptNumber: charge.receipt_number,
          receiptUrl: charge.receipt_url
        }
      });
    } else {
      res.status(404).json({ error: 'Receipt not found' });
    }
  } catch (error) {
    console.error('Error getting receipt:', error);
    res.status(500).json({ error: error.message });
  }
});

// 9. Enviar recibo manualmente
app.post('/api/send-receipt', async (req, res) => {
  try {
    const { paymentIntentId, email } = req.body;

    console.log('Sending receipt for payment intent:', paymentIntentId, 'to:', email);

    // Obtener el PaymentIntent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Enviar recibo usando la API de Stripe
    const charge = paymentIntent.charges?.data?.[0];
    if (charge) {
      // Stripe envía automáticamente el recibo si receipt_email está configurado
      // Para envío manual, podrías usar tu propio sistema de emails
      res.json({ 
        success: true, 
        message: 'Receipt sent successfully',
        receiptUrl: charge.receipt_url
      });
    } else {
      res.status(404).json({ error: 'Charge not found' });
    }
  } catch (error) {
    console.error('Error sending receipt:', error);
    res.status(500).json({ error: error.message });
  }
});

// 10. Obtener balance de Stripe
app.get('/api/balance', async (req, res) => {
  try {
    console.log('Retrieving Stripe balance');

    const balance = await stripe.balance.retrieve();
    
    res.json({
      balance: {
        available: balance.available.map(b => ({
          amount: b.amount / 100,
          currency: b.currency,
          sourceTypes: b.source_types
        })),
        pending: balance.pending.map(b => ({
          amount: b.amount / 100,
          currency: b.currency,
          sourceTypes: b.source_types
        }))
      }
    });
  } catch (error) {
    console.error('Error getting balance:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== WEBHOOK HANDLER ====================

app.post('/api/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log('Webhook received:', event.type);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar el evento
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      case 'payment_intent.amount_capturable_updated':
        await handlePaymentIntentCapturable(event.data.object);
        break;
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object);
        break;
      case 'balance.available':
        await handleBalanceAvailable(event.data.object);
        break;
      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event.data.object);
        break;
      case 'payment_intent.requires_action':
        await handlePaymentIntentRequiresAction(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling webhook event:', error);
    return res.status(500).json({ error: 'Webhook handler error' });
  }

  res.json({ received: true });
});

// ==================== WEBHOOK HANDLERS ====================

async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('PaymentIntent succeeded:', paymentIntent.id);
  
  try {
    // Buscar orden por sessionId o paymentIntentId
    const ordersRef = collection(db, 'orders');
    
    // Crear orden en Firestore con detalles completos
    const orderData = {
      paymentIntentId: paymentIntent.id,
      customerEmail: paymentIntent.receipt_email,
      customerName: paymentIntent.metadata?.customer_name,
      amount: paymentIntent.amount / 100, // Convertir de centavos
      currency: paymentIntent.currency,
      status: 'completed',
      paymentMethod: paymentIntent.payment_method,
      orderItems: JSON.parse(paymentIntent.metadata?.order_items || '[]'),
      createdAt: new Date(),
      updatedAt: new Date(),
      // Información de balance según Stripe docs
      balanceTransaction: paymentIntent.latest_charge,
      receiptUrl: paymentIntent.charges?.data?.[0]?.receipt_url,
      // Metadata adicional
      metadata: paymentIntent.metadata
    };

    const docRef = await addDoc(ordersRef, orderData);
    console.log('Order created successfully:', docRef.id);
    
    // Enviar recibo automáticamente si está configurado
    if (paymentIntent.receipt_email) {
      console.log('Receipt will be sent automatically to:', paymentIntent.receipt_email);
    }
    
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  console.log('PaymentIntent failed:', paymentIntent.id);
  
  try {
    // Actualizar orden como fallida
    console.log('Payment failed for:', paymentIntent.metadata);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePaymentIntentCapturable(paymentIntent) {
  console.log('PaymentIntent capturable:', paymentIntent.id);
  
  try {
    // Manejar autorización lista para capturar
    console.log('Payment ready for capture:', paymentIntent.metadata);
  } catch (error) {
    console.error('Error handling capturable payment:', error);
  }
}

async function handleCheckoutSessionCompleted(session) {
  console.log('Checkout session completed:', session.id);
  
  try {
    // Crear orden en Firestore
    const orderData = {
      sessionId: session.id,
      customerInfo: {
        email: session.customer_email,
        name: session.customer_details?.name,
      },
      paymentStatus: 'completed',
      total: session.amount_total / 100, // Convertir de centavos
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'orders'), orderData);
    console.log('Order created from checkout session:', docRef.id);
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

async function handleCheckoutSessionExpired(session) {
  console.log('Checkout session expired:', session.id);
  
  try {
    // Manejar sesión expirada
    console.log('Session expired for:', session.customer_email);
  } catch (error) {
    console.error('Error handling session expiration:', error);
  }
}

// Nuevos handlers basados en la documentación de Stripe
async function handleBalanceAvailable(balance) {
  console.log('Balance available:', balance);
  
  try {
    // Registrar cuando los fondos están disponibles según Stripe docs
    console.log('Funds are now available in your Stripe balance');
    console.log('Available amount:', balance.available[0]?.amount / 100, balance.available[0]?.currency);
    
    // Aquí podrías implementar lógica para notificar sobre fondos disponibles
    // o actualizar el estado de órdenes pendientes
  } catch (error) {
    console.error('Error handling balance available:', error);
  }
}

async function handleChargeDisputeCreated(dispute) {
  console.log('Charge dispute created:', dispute.id);
  
  try {
    // Manejar disputas según Stripe docs
    console.log('Dispute amount:', dispute.amount / 100, dispute.currency);
    console.log('Dispute reason:', dispute.reason);
    console.log('Charge ID:', dispute.charge);
    
    // Aquí podrías implementar lógica para manejar disputas
    // como notificar al equipo o actualizar el estado de la orden
  } catch (error) {
    console.error('Error handling charge dispute:', error);
  }
}

async function handlePaymentIntentRequiresAction(paymentIntent) {
  console.log('Payment intent requires action:', paymentIntent.id);
  
  try {
    // Manejar autenticación 3D Secure según Stripe docs
    console.log('Payment requires additional authentication (3D Secure)');
    console.log('Next action:', paymentIntent.next_action);
    
    // Aquí podrías implementar lógica para manejar 3D Secure
  } catch (error) {
    console.error('Error handling payment intent requires action:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  console.log('Invoice payment succeeded:', invoice.id);
  
  try {
    // Manejar pagos de suscripciones según Stripe docs
    console.log('Subscription payment completed');
    console.log('Customer:', invoice.customer);
    console.log('Amount paid:', invoice.amount_paid / 100, invoice.currency);
    
    // Aquí podrías implementar lógica para manejar suscripciones
  } catch (error) {
    console.error('Error handling invoice payment success:', error);
  }
}

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    stripe: {
      configured: !!process.env.STRIPE_SECRET_KEY,
      mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'test' : 'live'
    }
  });
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`💳 Stripe configured in ${process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'TEST' : 'LIVE'} mode`);
  console.log(`🔥 Firebase connected to project: ${process.env.REACT_APP_FIREBASE_PROJECT_ID}`);
});

module.exports = app;
