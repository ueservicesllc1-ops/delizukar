# Guía Completa de Testing con Stripe Dashboard

Esta guía detalla cómo utilizar el [Stripe Dashboard](https://docs.stripe.com/dashboard/basics) para probar y monitorear la integración de pagos de Delizukar.

## 1. Configuración Inicial del Dashboard

### 1.1. Acceso al Dashboard
- **URL**: [https://dashboard.stripe.com/](https://dashboard.stripe.com/)
- **Navegadores soportados**: Chrome, Firefox, Edge (últimas 20 versiones), Safari (últimas 4 versiones)
- **Atajos de teclado**: Presiona `?` para ver atajos disponibles

### 1.2. Modo Test vs Live
```javascript
// Verificar modo actual
const isTestMode = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_');
console.log('Modo actual:', isTestMode ? 'Test' : 'Live');
```

## 2. Navegación del Dashboard

### 2.1. Sección Principal
- **Home**: Analytics y métricas de rendimiento
- **Balances**: Balance de Stripe, top-ups, payouts
- **Transactions**: Pagos de clientes, fees, transfers
- **Customers**: Gestión de perfiles de clientes
- **Product catalog**: Gestión de productos y precios

### 2.2. Sección de Productos
- **Payments**: Insights de rendimiento, prevención de fraude
- **Billing**: Gestión de facturas y suscripciones
- **Reporting**: Exportación de datos históricos

## 3. Testing con Tarjetas de Prueba

### 3.1. Tarjetas de Prueba Estándar
```javascript
const testCards = {
  // Éxito
  visa: '4242424242424242',
  visaDebit: '4000056655665556',
  mastercard: '5555555555554444',
  amex: '378282246310005',
  
  // Errores
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
  expired: '4000000000000069',
  incorrectCvc: '4000000000000127',
  
  // Autenticación 3D Secure
  requiresAuthentication: '4000002500003155',
  
  // Métodos específicos
  visaDebit: '4000056655665556',
  mastercardDebit: '5200828282828210',
  amex: '378282246310005',
  discover: '6011111111111117',
  diners: '30569309025904',
  jcb: '3530111333300000'
};
```

### 3.2. Testing de Wallets
```javascript
// Apple Pay - Requiere dominio registrado
const applePayTest = {
  domain: 'https://delizukar.com',
  verification: '/.well-known/apple-developer-merchantid-domain-association'
};

// Google Pay - Requiere HTTPS
const googlePayTest = {
  domain: 'https://delizukar.com',
  supported: ['Chrome', 'Safari', 'Edge']
};
```

## 4. Monitoreo con Dashboard

### 4.1. Workbench (Beta)
```bash
# Habilitar Workbench en Dashboard
# Settings > Beta features > Workbench
```

**Funcionalidades de Workbench:**
- API usage y webhook usage
- Upgrade de versión de API
- Review de errores de API filtrados por endpoint
- Logs de requests exitosos y fallidos

### 4.2. Logs de API
```javascript
// Cada request incluye:
const apiLog = {
  originalRequest: 'Detalles de la request original',
  success: 'boolean - si fue exitosa',
  response: 'Respuesta de Stripe',
  relatedResources: 'Referencias a recursos relacionados'
};
```

## 5. Testing de Webhooks

### 5.1. Configuración de Webhooks
```bash
# Usar Stripe CLI para testing local
stripe listen --forward-to localhost:3000/api/webhook

# Ver logs en tiempo real
stripe logs tail

# Filtrar por tipo de evento
stripe logs tail --filter payment_intent
```

### 5.2. Eventos de Testing
```bash
# Simular eventos específicos
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

### 5.3. Verificación de Webhooks
```javascript
// Endpoint de webhook con verificación
app.post('/api/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    
    // Log del evento para debugging
    console.log('Webhook recibido:', {
      type: event.type,
      id: event.id,
      created: new Date(event.created * 1000)
    });
    
    // Procesar evento
    handleWebhookEvent(event);
    
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  res.json({ received: true });
});
```

## 6. Testing de Métodos de Pago

### 6.1. Configuración en Dashboard
1. **Settings > Payment methods**
2. Habilitar métodos deseados:
   - Cards: Visa, Mastercard, Amex, Discover
   - Wallets: Apple Pay, Google Pay, Link
   - BNPL: Klarna, Afterpay, Affirm
   - Bank: ACH, SEPA

### 6.2. Testing de Dominios
```javascript
// Verificar configuración de dominios
const domainConfig = {
  applePay: {
    domain: 'delizukar.com',
    verification: '/.well-known/apple-developer-merchantid-domain-association'
  },
  googlePay: {
    domain: 'delizukar.com',
    https: true
  },
  link: {
    domain: 'delizukar.com'
  }
};
```

## 7. Testing de Sandboxes

### 7.1. Configuración de Sandbox
```javascript
// Usar sandbox para testing
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Verificar que esté en modo test
if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
  throw new Error('No estás en modo test');
}
```

### 7.2. Datos de Sandbox
- **Objetos simulados**: accounts, payments, customers, charges, refunds
- **Sin procesamiento real**: Card networks no procesan pagos
- **Identity sin verificación**: No se realizan verificaciones reales
- **Connect limitado**: Account objects no retornan campos sensibles

## 8. Testing de Producción

### 8.1. Checklist Pre-Producción
- [ ] Cambiar a claves live (`pk_live_`, `sk_live_`)
- [ ] Configurar webhooks de producción
- [ ] Registrar dominios en producción
- [ ] Verificar certificados SSL
- [ ] Configurar alertas de monitoreo

### 8.2. Monitoreo en Producción
```javascript
// Configurar alertas
const alertConfig = {
  paymentFailures: {
    threshold: 5,
    timeWindow: '1h',
    action: 'email'
  },
  webhookFailures: {
    threshold: 3,
    timeWindow: '30m',
    action: 'slack'
  }
};
```

## 9. Testing de Rendimiento

### 9.1. Métricas del Dashboard
- **Authorization rates**: Tasa de autorización de tarjetas
- **Conversion rates**: Tasa de conversión de checkout
- **Fraud rates**: Tasa de fraude detectado
- **Dispute rates**: Tasa de disputas

### 9.2. Optimización de Rendimiento
```javascript
// Cargar Stripe de forma asíncrona
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Lazy loading de componentes
const StripeCheckout = lazy(() => import('./StripeCheckout'));

// Optimizar webhooks
app.post('/api/webhook', (req, res) => {
  // Responder rápidamente
  res.json({ received: true });
  
  // Procesar de forma asíncrona
  setImmediate(() => processWebhookAsync(event));
});
```

## 10. Testing de Seguridad

### 10.1. Verificación de Claves
```javascript
// Verificar que las claves sean correctas
const validateStripeKeys = () => {
  const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!publishableKey.startsWith('pk_')) {
    throw new Error('Invalid publishable key format');
  }
  
  if (!secretKey.startsWith('sk_')) {
    throw new Error('Invalid secret key format');
  }
  
  // Verificar que sean del mismo modo
  const isTestMode = publishableKey.startsWith('pk_test_');
  const isSecretTest = secretKey.startsWith('sk_test_');
  
  if (isTestMode !== isSecretTest) {
    throw new Error('Mismatched test/live keys');
  }
};
```

### 10.2. Sanitización de Logs
```javascript
// Sanitizar datos sensibles en logs
const sanitizeForLogging = (data) => {
  const sanitized = { ...data };
  
  // Remover datos sensibles
  delete sanitized.card;
  delete sanitized.cvc;
  delete sanitized.number;
  
  // Enmascarar datos parcialmente sensibles
  if (sanitized.email) {
    sanitized.email = sanitized.email.replace(/(.{2}).*(@.*)/, '$1***$2');
  }
  
  return sanitized;
};
```

## 11. Herramientas de Debugging

### 11.1. Stripe CLI
```bash
# Instalación
npm install -g @stripe/stripe-cli

# Login
stripe login

# Escuchar webhooks
stripe listen --forward-to localhost:3000/api/webhook

# Simular eventos
stripe trigger payment_intent.succeeded

# Ver logs
stripe logs tail
```

### 11.2. Dashboard de Stripe
- **Events**: Ver todos los eventos
- **Logs**: Ver logs de API
- **Webhooks**: Ver estado de webhooks
- **Customers**: Ver clientes de prueba
- **Payments**: Ver pagos de prueba

## 12. Testing de Casos Específicos

### 12.1. Testing de Autorización Separada
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

### 12.2. Testing de Impuestos Automáticos
```javascript
// Configurar impuestos automáticos
const session = await stripe.checkout.sessions.create({
  // ... otros parámetros
  automatic_tax: {
    enabled: true,
  },
  tax_id_collection: {
    enabled: true,
  },
});
```

### 12.3. Testing de Métodos de Pago Específicos
```javascript
// Testing de Klarna
const klarnaSession = await stripe.checkout.sessions.create({
  payment_method_types: ['klarna'],
  line_items: [/* items */],
  mode: 'payment',
});

// Testing de PayPal
const paypalSession = await stripe.checkout.sessions.create({
  payment_method_types: ['paypal'],
  line_items: [/* items */],
  mode: 'payment',
});
```

## 13. Recursos Adicionales

### 13.1. Documentación Oficial
- [Stripe Dashboard](https://docs.stripe.com/dashboard/basics)
- [Stripe Testing](https://docs.stripe.com/testing)
- [Stripe CLI](https://docs.stripe.com/stripe-cli)
- [Stripe Webhooks](https://docs.stripe.com/webhooks)

### 13.2. Herramientas de Monitoreo
- [Stripe Status](https://status.stripe.com/)
- [Stripe Community](https://github.com/stripe/stripe-node/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/stripe-payments)

### 13.3. Contacto de Soporte
- **Email**: support@stripe.com
- **Chat**: Disponible en Dashboard
- **Documentación**: https://stripe.com/docs

## 14. Checklist de Testing

### 14.1. Testing Básico
- [ ] Tarjetas de prueba funcionan
- [ ] Webhooks se ejecutan correctamente
- [ ] Métodos de pago aparecen
- [ ] Errores se manejan apropiadamente

### 14.2. Testing Avanzado
- [ ] Autorización separada funciona
- [ ] Impuestos automáticos se calculan
- [ ] Wallets (Apple Pay, Google Pay) funcionan
- [ ] Métodos BNPL (Klarna, Afterpay) funcionan

### 14.3. Testing de Producción
- [ ] Claves de producción configuradas
- [ ] Webhooks de producción funcionan
- [ ] Dominios registrados
- [ ] Monitoreo configurado
- [ ] Alertas configuradas

---

**Nota**: Esta guía se basa en la [documentación oficial de Stripe Dashboard](https://docs.stripe.com/dashboard/basics) y las mejores prácticas de testing de Stripe.
