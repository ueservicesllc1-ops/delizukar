# Guía de Despliegue - Stripe para Delizukar

## Preparación para Producción

### 1. Configuración de Variables de Entorno

#### Desarrollo
```env
# .env.development
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NODE_ENV=development
```

#### Producción
```env
# .env.production
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NODE_ENV=production
```

### 2. Configuración del Backend

#### Endpoints de Producción
```javascript
// server.js
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());

// Endpoint de Checkout
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'link', 'klarna', 'paypal'],
      line_items: req.body.cartItems.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            images: [item.image],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/checkout/success`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout`,
      customer_email: req.body.customerInfo.email,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'MX', 'ES', 'FR', 'DE', 'IT', 'GB'],
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook endpoint
app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Procesar pago exitoso
        break;
      case 'checkout.session.completed':
        // Procesar sesión completada
        break;
    }
    
    res.json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 3. Configuración de Dominios

#### Registrar Dominios en Stripe Dashboard
1. Ve a [Stripe Dashboard > Settings > Payment methods](https://dashboard.stripe.com/settings/payment_methods)
2. Registra tu dominio para:
   - **Apple Pay**: `https://tu-dominio.com`
   - **Google Pay**: `https://tu-dominio.com`
   - **Link**: `https://tu-dominio.com`

#### Verificación de Apple Pay
```bash
# Descargar archivo de verificación
curl -o .well-known/apple-developer-merchantid-domain-association \
  https://stripe.com/apple-developer-merchantid-domain-association

# Subir a tu servidor
# Debe estar disponible en:
# https://tu-dominio.com/.well-known/apple-developer-merchantid-domain-association
```

### 4. Configuración de Webhooks

#### Crear Webhook en Producción
1. Ve a [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Crea nuevo endpoint:
   - **URL**: `https://tu-dominio.com/api/webhook`
   - **Eventos**:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `checkout.session.completed`
     - `checkout.session.expired`

#### Verificar Webhook
```bash
# Usar Stripe CLI para verificar
stripe listen --forward-to https://tu-dominio.com/api/webhook

# Probar webhook
stripe trigger payment_intent.succeeded
```

### 5. Configuración de SSL

#### Certificado SSL
```nginx
# nginx.conf
server {
    listen 443 ssl;
    server_name tu-dominio.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 6. Configuración de Base de Datos

#### Esquema de Órdenes
```sql
CREATE TABLE orders (
    id VARCHAR(255) PRIMARY KEY,
    stripe_payment_intent_id VARCHAR(255),
    customer_email VARCHAR(255),
    total_amount INTEGER,
    currency VARCHAR(3),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(255),
    product_name VARCHAR(255),
    quantity INTEGER,
    price INTEGER,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

### 7. Monitoreo y Logging

#### Configuración de Logs
```javascript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

module.exports = logger;
```

#### Métricas de Stripe
```javascript
// metrics.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const getPaymentMetrics = async () => {
  try {
    const payments = await stripe.paymentIntents.list({
      limit: 100,
      created: {
        gte: Math.floor(Date.now() / 1000) - 86400 // Últimas 24 horas
      }
    });
    
    const metrics = {
      total: payments.data.length,
      succeeded: payments.data.filter(p => p.status === 'succeeded').length,
      failed: payments.data.filter(p => p.status === 'requires_payment_method').length
    };
    
    return metrics;
  } catch (error) {
    console.error('Error fetching metrics:', error);
  }
};
```

### 8. Configuración de Alertas

#### Alertas de Stripe
1. Ve a [Stripe Dashboard > Settings > Notifications](https://dashboard.stripe.com/settings/notifications)
2. Configura alertas para:
   - **Fallos de pago** críticos
   - **Disputas** nuevas
   - **Webhooks** fallidos

#### Alertas del Sistema
```javascript
// alerts.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendAlert = async (subject, message) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ALERT_EMAIL,
      subject: `[Delizukar] ${subject}`,
      text: message
    });
  } catch (error) {
    console.error('Error sending alert:', error);
  }
};
```

### 9. Testing en Producción

#### Pruebas de Smoke
```javascript
// smoke-tests.js
const testStripeIntegration = async () => {
  try {
    // Test 1: Crear sesión de checkout
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cartItems: [{ name: 'Test Product', price: 10, quantity: 1 }],
        total: 10,
        customerInfo: { email: 'test@example.com' }
      })
    });
    
    if (!response.ok) {
      throw new Error('Checkout session creation failed');
    }
    
    console.log('✅ Stripe integration working');
  } catch (error) {
    console.error('❌ Stripe integration failed:', error);
  }
};
```

### 10. Rollback Plan

#### Plan de Rollback
```bash
# 1. Revertir código
git revert <commit-hash>

# 2. Revertir variables de entorno
# Cambiar de pk_live_ a pk_test_

# 3. Revertir webhooks
# Cambiar URL de webhook a versión anterior

# 4. Notificar a usuarios
# Enviar email sobre mantenimiento
```

## Checklist de Despliegue

### Pre-Despliegue
- [ ] Variables de entorno configuradas
- [ ] Dominios registrados en Stripe
- [ ] Certificados SSL válidos
- [ ] Base de datos configurada
- [ ] Webhooks configurados
- [ ] Pruebas de smoke completadas

### Post-Despliegue
- [ ] Verificar webhooks funcionando
- [ ] Probar métodos de pago
- [ ] Verificar métricas
- [ ] Configurar alertas
- [ ] Documentar cambios

## Recursos Adicionales

- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Webhooks Testing](https://stripe.com/docs/webhooks/test)
- [Stripe Status](https://status.stripe.com/)
