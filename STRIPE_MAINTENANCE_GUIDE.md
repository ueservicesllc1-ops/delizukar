# Guía de Mantenimiento - Stripe para Delizukar

## Actualizaciones y Versionado

### 1. Control de Versiones de API

#### Verificar Versión Actual
```javascript
// Verificar versión de API en uso
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Hacer una llamada de prueba para ver la versión
const customer = await stripe.customers.create({
  email: 'test@example.com'
});

console.log('API Version:', customer.api_version);
```

#### Especificar Versión en Código
```javascript
// Especificar versión de API explícitamente
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' // Versión específica
});

// O usar header en requests individuales
const session = await stripe.checkout.sessions.create({
  // ... parámetros
}, {
  apiVersion: '2023-10-16'
});
```

### 2. Proceso de Actualización

#### Paso 1: Preparación
```bash
# 1. Verificar versión actual
stripe --version

# 2. Revisar changelog
# https://stripe.com/docs/upgrades

# 3. Probar en ambiente de desarrollo
npm install stripe@latest
```

#### Paso 2: Testing
```javascript
// test-api-version.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testNewApiVersion() {
  try {
    // Test 1: Crear customer
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test Customer'
    });
    console.log('✅ Customer creation works');
    
    // Test 2: Crear payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000,
      currency: 'usd',
      customer: customer.id
    });
    console.log('✅ Payment intent creation works');
    
    // Test 3: Crear checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Test Product' },
          unit_amount: 2000,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
    });
    console.log('✅ Checkout session creation works');
    
  } catch (error) {
    console.error('❌ API version test failed:', error.message);
  }
}

testNewApiVersion();
```

#### Paso 3: Actualización Gradual
```javascript
// Usar header Stripe-Version para testing
const testNewVersion = async () => {
  const response = await fetch('https://api.stripe.com/v1/customers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Stripe-Version': '2023-10-16', // Nueva versión
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'email=test@example.com'
  });
  
  return response.json();
};
```

### 3. Monitoreo de Cambios

#### Webhook Versioning
```javascript
// Manejar diferentes versiones de webhooks
app.post('/api/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    
    // Verificar versión del evento
    console.log('Event API Version:', event.api_version);
    
    // Manejar eventos según versión
    switch (event.type) {
      case 'payment_intent.succeeded':
        handlePaymentSuccess(event);
        break;
      case 'checkout.session.completed':
        handleCheckoutCompleted(event);
        break;
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

### 4. Cambios Compatibles vs Incompatibles

#### Cambios Compatibles (Seguros)
```javascript
// ✅ Agregar nuevos parámetros opcionales
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: lineItems,
  mode: 'payment',
  // Nuevo parámetro opcional
  automatic_tax: { enabled: true }
});

// ✅ Agregar nuevas propiedades a respuestas
const customer = await stripe.customers.retrieve('cus_123');
console.log(customer.new_property); // Nueva propiedad
```

#### Cambios Incompatibles (Requieren Actualización)
```javascript
// ❌ Cambios en estructura de objetos
// Antes: customer.active_card
// Después: customer.default_source

// ❌ Cambios en nombres de propiedades
// Antes: statement_description
// Después: statement_descriptor

// ❌ Cambios en tipos de datos
// Antes: count (number)
// Después: has_more (boolean)
```

### 5. Estrategia de Rollback

#### Rollback de API Version
```javascript
// Mantener versión anterior como fallback
const stripeOld = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15' // Versión anterior
});

const stripeNew = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' // Versión nueva
});

// Función con fallback
const createCustomer = async (customerData) => {
  try {
    return await stripeNew.customers.create(customerData);
  } catch (error) {
    console.warn('New API failed, falling back to old version');
    return await stripeOld.customers.create(customerData);
  }
};
```

#### Rollback de Webhooks
```javascript
// Manejar webhooks de diferentes versiones
const handleWebhook = (event) => {
  const apiVersion = event.api_version;
  
  if (apiVersion === '2023-10-16') {
    // Lógica para nueva versión
    handleNewVersionWebhook(event);
  } else if (apiVersion === '2022-11-15') {
    // Lógica para versión anterior
    handleOldVersionWebhook(event);
  }
};
```

### 6. Testing de Compatibilidad

#### Test Suite Automatizado
```javascript
// tests/stripe-compatibility.test.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

describe('Stripe API Compatibility', () => {
  test('Customer creation works', async () => {
    const customer = await stripe.customers.create({
      email: 'test@example.com'
    });
    expect(customer.id).toMatch(/^cus_/);
  });
  
  test('Payment intent creation works', async () => {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000,
      currency: 'usd'
    });
    expect(paymentIntent.id).toMatch(/^pi_/);
  });
  
  test('Checkout session creation works', async () => {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Test' },
          unit_amount: 2000,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
    });
    expect(session.id).toMatch(/^cs_/);
  });
});
```

### 7. Monitoreo de Cambios

#### Alertas de Versión
```javascript
// monitoring/version-alerts.js
const checkApiVersion = async () => {
  try {
    const account = await stripe.accounts.retrieve();
    const currentVersion = account.api_version;
    const latestVersion = '2023-10-16'; // Última versión
    
    if (currentVersion !== latestVersion) {
      sendAlert({
        type: 'api_version_outdated',
        current: currentVersion,
        latest: latestVersion
      });
    }
  } catch (error) {
    console.error('Error checking API version:', error);
  }
};
```

#### Dashboard de Monitoreo
```javascript
// dashboard/version-monitor.js
const getVersionStatus = async () => {
  const status = {
    currentVersion: process.env.STRIPE_API_VERSION,
    lastUpdate: new Date().toISOString(),
    compatibility: 'unknown'
  };
  
  try {
    // Test básico de compatibilidad
    await stripe.customers.list({ limit: 1 });
    status.compatibility = 'compatible';
  } catch (error) {
    status.compatibility = 'incompatible';
    status.error = error.message;
  }
  
  return status;
};
```

### 8. Documentación de Cambios

#### Changelog Interno
```markdown
# Stripe API Changelog - Delizukar

## 2023-10-16
- ✅ Actualizado a versión 2023-10-16
- ✅ Agregado soporte para automatic_tax
- ✅ Mejorado manejo de webhooks
- ⚠️ Breaking change: customer.active_card → customer.default_source

## 2022-11-15
- ✅ Versión estable
- ✅ Soporte completo para Checkout Sessions
- ✅ Webhooks funcionando correctamente
```

### 9. Herramientas de Desarrollo

#### Stripe CLI para Testing
```bash
# Instalar Stripe CLI
npm install -g @stripe/stripe-cli

# Login
stripe login

# Test webhooks
stripe listen --forward-to localhost:3000/api/webhook

# Simular eventos
stripe trigger payment_intent.succeeded
stripe trigger checkout.session.completed

# Test con versión específica
stripe --api-version 2023-10-16 trigger payment_intent.succeeded
```

#### Workbench para Testing
```javascript
// Usar Stripe Workbench para testing
// https://dashboard.stripe.com/test/workbench

const testInWorkbench = async () => {
  // Código para probar en Workbench
  const customer = await stripe.customers.create({
    email: 'workbench-test@example.com'
  });
  
  return customer;
};
```

### 10. Checklist de Actualización

#### Pre-Actualización
- [ ] Revisar changelog de Stripe
- [ ] Probar en ambiente de desarrollo
- [ ] Ejecutar test suite completo
- [ ] Verificar compatibilidad de webhooks
- [ ] Documentar cambios necesarios

#### Post-Actualización
- [ ] Verificar funcionalidad básica
- [ ] Probar flujo de pago completo
- [ ] Verificar webhooks funcionando
- [ ] Monitorear errores por 24 horas
- [ ] Actualizar documentación

## Recursos Adicionales

- [Stripe API Changelog](https://stripe.com/docs/upgrades)
- [Stripe Workbench](https://dashboard.stripe.com/test/workbench)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Webhook Testing](https://stripe.com/docs/webhooks/test)
