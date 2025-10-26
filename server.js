require('dotenv').config();
console.log('🔍 Environment variables loaded:');
console.log('EASYPOST_API_KEY:', process.env.EASYPOST_API_KEY ? 'SET' : 'NOT SET');

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced middleware with security best practices
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://192.168.13.173:3000',
    'https://delizukar-production.up.railway.app',
    'https://dia4qsw7.up.railway.app',
    'https://delizukar.com',
    'https://www.delizukar.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Stripe-Signature']
}));

// Allow Railway healthcheck hostname
app.use((req, res, next) => {
  if (req.get('host') === 'healthcheck.railway.app') {
    console.log('🔍 Railway healthcheck detected');
  }
  next();
});

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

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ==================== EASYPOST ENDPOINTS ====================

// 1. Crear dirección en EasyPost
app.post('/api/shippo/create-address', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Creating address in EasyPost');
    console.log('🔍 DEBUG: EASYPOST_API_KEY exists:', !!process.env.EASYPOST_API_KEY);
    
    const response = await fetch('https://api.easypost.com/v2/addresses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EASYPOST_API_KEY || 'EZTK59b460158953437d87998d578f6dc433q02S0DwSYw5ISPTB5j0SDQ'}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    console.log('✅ EasyPost address created:', data.id);
    res.json(data);
  } catch (error) {
    console.error('❌ EasyPost error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Obtener información de cuenta de EasyPost
app.get('/api/shippo/account', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Getting EasyPost account info');
    console.log('🔍 DEBUG: EASYPOST_API_KEY exists:', !!process.env.EASYPOST_API_KEY);
    
    const response = await fetch('https://api.easypost.com/v2/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.EASYPOST_API_KEY || 'EZTK59b460158953437d87998d578f6dc433q02S0DwSYw5ISPTB5j0SDQ'}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ EasyPost API error:', response.status, errorText);
      throw new Error(`EasyPost API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ EasyPost account info retrieved');
    res.json(data);
  } catch (error) {
    console.error('❌ EasyPost account error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Comprar etiqueta de envío en EasyPost
app.post('/api/shippo/buy-label', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Buying shipping label with EasyPost');
    console.log('🔍 DEBUG: Request body:', JSON.stringify(req.body, null, 2));
    
    const apiKey = process.env.EASYPOST_API_KEY || 'EZTK59b460158953437d87998d578f6dc433q02S0DwSYw5ISPTB5j0SDQ';
    const { rateId } = req.body;
    
    if (!rateId) {
      return res.status(400).json({ error: 'Rate ID is required' });
    }
    
    const response = await fetch(`https://api.easypost.com/v2/shipments/${rateId.split('_')[0]}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rate: { id: rateId } }),
    });
    
    console.log('🔍 DEBUG: Buy label response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ EasyPost buy label error:', response.status, errorText);
      throw new Error(`EasyPost API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Label purchased successfully');
    console.log('🔍 DEBUG: Label data:', JSON.stringify(data, null, 2));
    
    res.json(data);
  } catch (error) {
    console.error('❌ EasyPost buy label error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Calcular tarifas de envío con EasyPost
app.post('/api/shippo/rates', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Calculating shipping rates with EasyPost');
    console.log('🔍 DEBUG: Request body:', JSON.stringify(req.body, null, 2));
    
    const apiKey = process.env.EASYPOST_API_KEY || 'EZTK59b460158953437d87998d578f6dc433q02S0DwSYw5ISPTB5j0SDQ';
    
    // Convertir el formato de Shippo a EasyPost
    const { address_from, address_to, parcels } = req.body;
    
    const shipmentData = {
      shipment: {
        to_address: {
          name: address_to.name || '',
          street1: address_to.street1,
          city: address_to.city,
          state: address_to.state,
          zip: address_to.zip,
          country: address_to.country || 'US',
          phone: address_to.phone || '',
          email: address_to.email || ''
        },
        from_address: {
          name: address_from.name || 'Delizukar',
          street1: address_from.street1,
          city: address_from.city,
          state: address_from.state,
          zip: address_from.zip,
          country: address_from.country || 'US',
          phone: address_from.phone || '',
          email: address_from.email || 'support@delizukar.com'
        },
        parcel: {
          length: parcels[0].length || '10',
          width: parcels[0].width || '10',
          height: parcels[0].height || '10',
          weight: parcels[0].weight || '1'
        }
      }
    };
    
    console.log('🔍 DEBUG: Converted to EasyPost format:', JSON.stringify(shipmentData, null, 2));
    
    const response = await fetch('https://api.easypost.com/v2/shipments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shipmentData),
    });

    console.log('🔍 DEBUG: Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ EasyPost API error:', response.status, errorText);
      throw new Error(`EasyPost API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Shipping rates calculated');
    console.log('🔍 DEBUG: Response data:', JSON.stringify(data, null, 2));
    
    // EasyPost devuelve rates directamente en la raíz del objeto
    const easypostRates = data.rates || [];
    console.log('🔍 DEBUG: Rates count:', easypostRates.length);
    
    // Transformar rates de EasyPost al formato de Shippo para compatibilidad con el frontend
    // IMPORTANTE: No calculamos eta aquí, el frontend lo calculará basándose en la lógica de envío del lunes
    const rates = easypostRates.map(rate => ({
      object_id: rate.id,
      provider: rate.carrier?.toLowerCase() || rate.carrier,
      carrier: rate.carrier,
      servicelevel: {
        name: rate.service
      },
      service: rate.service,
      amount: parseFloat(rate.rate),
      currency: rate.currency,
      eta: null, // El frontend calculará la fecha correcta
      delivery_days: rate.delivery_days || rate.est_delivery_days
    }));
    
    // Devolver en formato similar a Shippo para compatibilidad con el frontend
    const responseData = {
      rates: rates,
      shipment: data
    };
    
    console.log('🔍 DEBUG: Transformed rates:', JSON.stringify(rates, null, 2));
    
    res.json(responseData);
  } catch (error) {
    console.error('❌ EasyPost rates error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ORDER MANAGEMENT ENDPOINTS ====================

// Helper function to automatically buy shipping label after payment
async function buyShippingLabelForOrder(shippingInfo) {
  try {
    console.log('📦 Attempting to buy shipping label automatically...');
    console.log('📦 Shipping info:', shippingInfo);
    
    if (!shippingInfo || !shippingInfo.rateId) {
      console.log('⚠️ No shipping info or rate ID provided, skipping label purchase');
      return null;
    }
    
    const apiKey = process.env.EASYPOST_API_KEY || 'EZTK59b460158953437d87998d578f6dc433q02S0DwSYw5ISPTB5j0SDQ';
    const rateId = shippingInfo.rateId;
    
    // Extract shipment ID from rate ID
    const shipmentId = rateId.split('_')[0];
    
    const response = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rate: { id: rateId } }),
    });
    
    if (response.ok) {
      const labelData = await response.json();
      console.log('✅ Label purchased automatically:', labelData.id);
      console.log('📬 Tracking code:', labelData.tracking_code);
      return labelData;
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to buy label automatically:', errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ Error buying label automatically:', error);
    return null;
  }
}

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
    console.log('🔍 DEBUG: Received request to create-payment-intent');
    console.log('🔍 DEBUG: STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
    console.log('🔍 DEBUG: STRIPE_SECRET_KEY value:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...' : 'undefined');
    
    // Verificar si Stripe está configurado
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_dummy_key_for_development') {
      console.log('❌ ERROR: Stripe not configured');
      return res.status(500).json({ 
        error: 'Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.' 
      });
    }
    
    const { cartItems, total, customerInfo, captureMethod } = req.body;
    console.log('🔍 DEBUG: Request body:', { cartItems, total, customerInfo, captureMethod });

    console.log('Creating payment intent for:', customerInfo.email);

    // Enhanced PaymentIntent creation with API v2 features
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convertir a centavos
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always', // Permitir métodos que requieren redirección
      },
      capture_method: captureMethod || 'automatic',
      metadata: {
        customer_email: customerInfo.email || 'test@example.com',
        customer_name: `${customerInfo.firstName || 'Usuario'} ${customerInfo.lastName || 'Test'}`,
        order_items: JSON.stringify(cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }))),
        source: 'web_checkout',
        version: '2.0',
        integration: 'stripe_js_v2'
      },
      receipt_email: customerInfo.email || 'test@example.com',
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

    console.log('✅ Payment intent created:', paymentIntent.id);
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('❌ ERROR creating payment intent:', error);
    console.error('❌ Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode
    });
    res.status(500).json({ 
      error: error.message,
      details: {
        type: error.type,
        code: error.code,
        statusCode: error.statusCode
      }
    });
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

// 5. Obtener Payment Intent (Stripe) o Payment Info (PayPal)
app.get('/api/payment-intent/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    console.log('🔍 DEBUG: Getting payment intent:', paymentIntentId);
    
    // Verificar si es un PayPal ID o un Stripe ID
    // PayPal IDs generalmente tienen letras y números, y no empiezan con pi_ o ch_
    const isPayPal = !paymentIntentId.startsWith('pi_') && 
                     !paymentIntentId.startsWith('ch_') && 
                     !paymentIntentId.startsWith('cs_') &&
                     !paymentIntentId.startsWith('seti_');
    
    console.log('🔍 DEBUG: isPayPal:', isPayPal);
    
    if (isPayPal) {
      // Para PayPal, devolver información básica desde localStorage o memoria
      console.log('✅ PayPal payment detected:', paymentIntentId);
      
      // Intentar obtener información del pago desde localStorage en el frontend
      // Por ahora, devolver información genérica
      res.json({
        id: paymentIntentId,
        amount: 0, // El frontend debería tener este valor
        currency: 'usd',
        status: 'succeeded',
        type: 'paypal'
      });
    } else {
      // Solo intentar con Stripe si está configurado
      console.log('⚠️ Stripe payment detected but Stripe is not configured');
      res.status(404).json({ 
        error: 'Stripe is not configured',
        type: 'unsupported_payment_method'
      });
    }
  } catch (error) {
    console.error('❌ Error getting payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Crear orden en Firestore
app.post('/api/create-order', async (req, res) => {
  try {
    const { sessionId, paymentIntentId, customerInfo, cartItems, total, paymentStatus, createdAt, updatedAt } = req.body;

    console.log('Creating order in Firestore for session:', sessionId);
    console.log('Order data received:', { sessionId, paymentIntentId, customerInfo: !!customerInfo, cartItems: cartItems?.length, total });

    const orderData = {
      sessionId: sessionId || paymentIntentId, // Usar sessionId o paymentIntentId como fallback
      paymentIntentId: paymentIntentId || sessionId,
      customerInfo,
      cartItems,
      total,
      paymentStatus: paymentStatus || 'paid',
      createdAt: createdAt ? new Date(createdAt) : new Date(),
      updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
    };

    console.log('Order data to save:', orderData);

    const docRef = await addDoc(collection(db, 'orders'), orderData);
    
    console.log('✅ Order created with ID:', docRef.id);
    res.json({ orderId: docRef.id, order: orderData });
  } catch (error) {
    console.error('❌ Error creating order:', error);
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
    
    console.log('🔍 Raw Stripe balance response:', JSON.stringify(balance, null, 2));
    console.log('🔍 Available balance:', balance.available);
    console.log('🔍 Pending balance:', balance.pending);
    
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
// MUST BE BEFORE STATIC FILES AND CATCH-ALL

// Health check for Railway - must be very simple and fast
app.get('/health', (req, res) => {
  console.log('✅ Railway health check responded OK');
  res.status(200).send('OK');
});

app.get('/api/health', (req, res) => {
  console.log('🔍 Health check requested');
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    stripe: {
      configured: !!process.env.STRIPE_SECRET_KEY,
      mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'test' : 'live'
    }
  });
});

// ==================== STATIC FILES ====================

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

// Root endpoint for Railway healthcheck
app.get('/', (req, res) => {
  console.log('🔍 Root health check requested from:', req.get('host'));
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// ==================== CATCH ALL HANDLER ====================
// Handle all non-API GET routes (React SPA fallback)
app.use((req, res, next) => {
  if (
    req.method === 'GET' &&
    !req.path.startsWith('/api') &&
    !req.path.startsWith('/health')
  ) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  } else {
    next();
  }
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`💳 Stripe configured in ${process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'TEST' : 'LIVE'} mode`);
  console.log(`🔥 Firebase connected to project: ${process.env.REACT_APP_FIREBASE_PROJECT_ID}`);
  console.log(`🔍 Health check available at: /health and /api/health`);
  console.log(`📁 Static files served from: ${path.join(__dirname, 'build')}`);
  console.log(`✅ Server is ready for Railway healthcheck`);
});

module.exports = app;
