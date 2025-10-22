# Guía de Resolución de Problemas - Stripe

## Problemas Comunes y Soluciones

### 1. Errores de Configuración

#### ❌ Error: "Invalid API Key"
```bash
# Verificar variables de entorno
echo $REACT_APP_STRIPE_PUBLISHABLE_KEY
echo $STRIPE_SECRET_KEY
```

**Solución:**
- Verificar que las claves estén correctas
- Asegurar que las claves sean del mismo modo (test/live)
- Reiniciar el servidor después de cambiar variables

#### ❌ Error: "CORS policy"
```javascript
// Configurar CORS en backend
const cors = require('cors');
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### 2. Problemas de Pago

#### ❌ Error: "Payment method not available"
**Causas posibles:**
- Método no habilitado en Dashboard
- Restricciones de país/moneda
- Dominio no registrado

**Solución:**
1. Verificar configuración en [Stripe Dashboard > Payment methods](https://dashboard.stripe.com/settings/payment_methods)
2. Registrar dominios para wallets
3. Verificar restricciones de país

#### ❌ Error: "Insufficient funds"
```javascript
// Manejar error en frontend
const handlePaymentError = (error) => {
  if (error.code === 'card_declined') {
    if (error.decline_code === 'insufficient_funds') {
      setError('Fondos insuficientes. Intenta con otra tarjeta.');
    }
  }
};
```

### 3. Problemas de Webhooks

#### ❌ Webhook no se ejecuta
```bash
# Verificar con Stripe CLI
stripe listen --forward-to localhost:3000/api/webhook

# Verificar logs
stripe logs tail
```

**Solución:**
1. Verificar URL del webhook
2. Comprobar que el servidor esté ejecutándose
3. Verificar firma del webhook

#### ❌ Error: "Webhook signature verification failed"
```javascript
// Verificar configuración del webhook
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const sig = req.headers['stripe-signature'];

try {
  const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
} catch (err) {
  console.log(`Webhook signature verification failed.`, err.message);
  return res.status(400).send(`Webhook Error: ${err.message}`);
}
```

### 4. Problemas de Dominios

#### ❌ Apple Pay no aparece
**Solución:**
1. Registrar dominio en [Stripe Dashboard](https://dashboard.stripe.com/settings/payment_methods)
2. Verificar archivo de dominio:
   ```
   https://tu-dominio.com/.well-known/apple-developer-merchantid-domain-association
   ```
3. Verificar que el dominio esté en HTTPS

#### ❌ Google Pay no aparece
**Solución:**
1. Registrar dominio en Dashboard
2. Verificar que el dominio esté en HTTPS
3. Comprobar que el navegador soporte Google Pay

### 5. Problemas de Testing

#### ❌ Tarjetas de prueba no funcionan
```javascript
// Verificar que estés en modo test
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// Debe comenzar con sk_test_
```

**Tarjetas de prueba válidas:**
- Éxito: `4242424242424242`
- Declinada: `4000000000000002`
- Insuficientes fondos: `4000000000009995`

#### ❌ Webhook de prueba no funciona
```bash
# Usar Stripe CLI para testing
stripe trigger payment_intent.succeeded
```

### 6. Problemas de Producción

#### ❌ Error en producción pero no en desarrollo
**Verificaciones:**
1. Variables de entorno de producción
2. URLs de webhook en producción
3. Dominios registrados en producción
4. Certificados SSL válidos

#### ❌ Métodos de pago no aparecen en producción
**Solución:**
1. Verificar configuración en Dashboard de producción
2. Comprobar restricciones de país
3. Verificar que los métodos estén habilitados

### 7. Problemas de Rendimiento

#### ❌ Checkout lento
**Optimizaciones:**
```javascript
// Cargar Stripe de forma asíncrona
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Usar lazy loading para componentes
const StripeCheckout = lazy(() => import('./StripeCheckout'));
```

#### ❌ Webhook timeout
```javascript
// Configurar timeout apropiado
app.post('/api/webhook', (req, res) => {
  // Procesar webhook rápidamente
  res.json({ received: true });
  
  // Procesar lógica pesada de forma asíncrona
  processWebhookAsync(event);
});
```

### 8. Problemas de Monitoreo

#### ❌ No recibes notificaciones de errores
**Solución:**
1. Configurar alertas en Stripe Dashboard
2. Implementar logging de errores
3. Configurar notificaciones por email

```javascript
// Logging de errores
const logError = (error, context) => {
  console.error('Stripe Error:', {
    error: error.message,
    code: error.code,
    context,
    timestamp: new Date().toISOString()
  });
};
```

### 9. Problemas de Seguridad

#### ❌ Datos sensibles en logs
```javascript
// Sanitizar logs
const sanitizeForLogging = (data) => {
  const sanitized = { ...data };
  delete sanitized.card;
  delete sanitized.cvc;
  return sanitized;
};
```

#### ❌ Webhook no verificado
```javascript
// Siempre verificar webhooks
app.use('/api/webhook', express.raw({ type: 'application/json' }));

app.post('/api/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    // Procesar evento
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

## Herramientas de Debugging

### 1. Stripe CLI
```bash
# Instalar
npm install -g @stripe/stripe-cli

# Login
stripe login

# Escuchar webhooks
stripe listen --forward-to localhost:3000/api/webhook

# Simular eventos
stripe trigger payment_intent.succeeded
```

### 2. Logs de Stripe
```bash
# Ver logs en tiempo real
stripe logs tail

# Filtrar por tipo
stripe logs tail --filter payment_intent
```

### 3. Dashboard de Stripe
- **Events** - Ver todos los eventos
- **Logs** - Ver logs de API
- **Webhooks** - Ver estado de webhooks

## Contacto de Soporte

### Stripe Support
- **Email**: support@stripe.com
- **Chat**: Disponible en Dashboard
- **Documentación**: https://stripe.com/docs

### Recursos Adicionales
- [Stripe Status](https://status.stripe.com/)
- [Stripe Community](https://github.com/stripe/stripe-node/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/stripe-payments)
