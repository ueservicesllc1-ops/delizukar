# Configuración de Stripe para Delizukar

## Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Configuración del Backend

### 1. Instalar dependencias del servidor

```bash
npm install stripe
```

### 2. Crear endpoints del servidor

Crea los siguientes endpoints en tu servidor backend:

#### `/api/create-checkout-session` (POST)

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/create-checkout-session', async (req, res) => {
  try {
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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethodTypes || ['card', 'link', 'klarna', 'paypal'],
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
      success_url: successUrl,
      cancel_url: cancelUrl,
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
      // Configuración para autorización separada (opcional)
      payment_intent_data: {
        capture_method: 'manual', // Para autorización separada
      },
      // Configuración para envío automático de recibos
      payment_intent_data: {
        receipt_email: customerInfo.email,
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### `/api/create-payment-intent` (POST)

```javascript
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { cartItems, total, customerInfo, captureMethod } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convertir a centavos
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always', // Permitir métodos que requieren redirección
      },
      capture_method: captureMethod || 'automatic',
      metadata: {
        customer_email: customerInfo.email,
        customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        order_items: JSON.stringify(cartItems),
      },
      receipt_email: customerInfo.email,
      // Configuración para autorización separada
      ...(captureMethod === 'manual' && {
        capture_method: 'manual',
      }),
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### `/api/capture-payment` (POST) - Para autorización separada

```javascript
app.post('/api/capture-payment', async (req, res) => {
  try {
    const { paymentIntentId, amountToCapture } = req.body;

    const paymentIntent = await stripe.paymentIntents.capture(
      paymentIntentId,
      {
        amount_to_capture: amountToCapture ? Math.round(amountToCapture * 100) : undefined,
      }
    );

    res.json({ paymentIntent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Configuración de Webhooks

### 1. Configurar webhook en Stripe Dashboard

1. Ve a [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Crea un nuevo endpoint
3. URL del endpoint: `https://tu-dominio.com/api/webhook`
4. Eventos a escuchar:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.amount_capturable_updated`
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### 2. Endpoint de webhook

```javascript
const express = require('express');
const app = express();

// Middleware para parsear el body
app.use('/api/webhook', express.raw({ type: 'application/json' }));

app.post('/api/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar el evento
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      // Aquí puedes actualizar tu base de datos, enviar emails, etc.
      break;
    case 'payment_intent.amount_capturable_updated':
      const capturablePaymentIntent = event.data.object;
      console.log('PaymentIntent capturable:', capturablePaymentIntent.id);
      // Manejar autorización lista para capturar
      break;
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Checkout session completed:', session.id);
      // Aquí puedes procesar el pedido completado
      break;
    case 'customer.subscription.created':
      const subscription = event.data.object;
      console.log('Subscription created:', subscription.id);
      // Manejar nueva suscripción
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});
```

## Configuración de Dominios

### 1. Registrar dominios en Stripe

1. Ve a [Stripe Dashboard > Settings > Payment methods](https://dashboard.stripe.com/settings/payment_methods)
2. En la sección "Apple Pay", agrega tu dominio
3. En la sección "Google Pay", agrega tu dominio
4. En la sección "Link", agrega tu dominio

### 2. Verificar dominios

Para Apple Pay, necesitas verificar tu dominio:

1. Descarga el archivo de verificación de Apple
2. Súbelo a `https://tu-dominio.com/.well-known/apple-developer-merchantid-domain-association`
3. Verifica en Apple Pay que el dominio esté activo

## Configuración de Métodos de Pago

### 1. Habilitar métodos de pago

En el Dashboard de Stripe, ve a Settings > Payment methods y habilita:

- **Cards**: Visa, Mastercard, American Express, Discover, Cartes Bancaires
- **Wallets**: Apple Pay, Google Pay, Link
- **Buy now, pay later**: Klarna, Afterpay, Affirm
- **Bank debits**: ACH Direct Debit, SEPA Direct Debit
- **Bank redirects**: iDEAL, Bancontact, EPS, P24
- **Real-time payments**: Pix, PayNow, PromptPay

### 2. Configurar países y monedas

- **Países soportados**: US, CA, MX, ES, FR, DE, IT, GB
- **Monedas**: USD, EUR, CAD, MXN
- **Idiomas**: Español, Inglés, Francés, Alemán

## Testing

### 1. Tarjetas de prueba

```javascript
// Tarjetas de prueba de Stripe
const testCards = {
  visa: '4242424242424242',
  visaDebit: '4000056655665556',
  mastercard: '5555555555554444',
  amex: '378282246310005',
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
  expired: '4000000000000069',
  incorrectCvc: '4000000000000127',
  requiresAuthentication: '4000002500003155'
};
```

### 2. Probar webhooks localmente

```bash
# Instalar Stripe CLI
stripe listen --forward-to localhost:3000/api/webhook
```

### 3. Probar autorización separada

```javascript
// Crear PaymentIntent con capture_method: 'manual'
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd',
  capture_method: 'manual',
  payment_method_types: ['card'],
});

// Capturar después de autorización
const capturedPayment = await stripe.paymentIntents.capture(
  paymentIntent.id,
  { amount_to_capture: 1500 } // Capturar solo $15.00
);
```

## Producción

### 1. Cambiar a claves de producción

```env
# Cambiar a claves de producción
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

### 2. Configurar webhooks de producción

1. Crear endpoint de webhook en tu servidor de producción
2. Configurar en Stripe Dashboard
3. Probar con eventos de prueba

### 3. Monitoreo

- Revisar logs de webhooks en Stripe Dashboard
- Monitorear métricas de conversión
- Configurar alertas para fallos de pago

## Recursos Adicionales

- [Documentación de Stripe](https://stripe.com/docs)
- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Webhooks Testing](https://stripe.com/docs/webhooks/test)
- [Payment Methods Overview](https://docs.stripe.com/payments/payment-methods/overview)
- [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element/accept-a-payment)
- [Manual Approval](https://docs.stripe.com/payments/custom/manual-approval)
- [Cartes Bancaires](https://docs.stripe.com/payments/cartes-bancaires)
