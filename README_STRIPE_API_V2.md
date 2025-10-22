# 🚀 Delizukar - E-commerce con Stripe API v2

## ✨ Características Implementadas

### 🔥 Stripe API v2 Integration
- **Última versión de API**: `2024-09-30.acacia`
- **Manejo de errores avanzado**: Tipos específicos de errores con mensajes localizados
- **Seguridad mejorada**: Headers de seguridad, CSRF protection, límites de tamaño
- **Idempotencia**: Claves únicas para prevenir pagos duplicados
- **Retry logic**: Reintentos automáticos con backoff exponencial

### 💳 Métodos de Pago Soportados
- **Tarjetas**: Visa, Mastercard, American Express
- **Buy Now, Pay Later**: Afterpay, Klarna, Affirm
- **Digital Wallets**: Apple Pay, Google Pay
- **Bank Transfers**: ACH, SEPA
- **Link**: Pagos con cuenta Stripe

### 🛡️ Seguridad Avanzada
- **Headers de seguridad**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- **CORS configurado**: Orígenes específicos permitidos
- **Límites de tamaño**: 10MB para payloads JSON
- **Verificación de webhooks**: Firmas Stripe verificadas
- **Variables de entorno**: Configuración segura

### 📊 Monitoreo y Analytics
- **Health checks**: Estado del servidor y Stripe
- **Balance tracking**: Monitoreo de fondos disponibles
- **Webhook events**: Manejo completo de eventos Stripe
- **Error logging**: Registro detallado de errores
- **Performance monitoring**: Métricas de rendimiento

## 🚀 Inicio Rápido

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno
Copia `config.env.example` a `.env` y configura tus claves:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51234567890abcdef...
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef...
STRIPE_WEBHOOK_SECRET=whsec_...

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=tu_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=tu_proyecto_id
# ... más configuración
```

### 3. Iniciar la Aplicación

#### Opción 1: Desarrollo Completo (Recomendado)
```bash
npm run dev
```
Esto inicia tanto el servidor backend como el frontend automáticamente.

#### Opción 2: Desarrollo Separado
```bash
# Terminal 1 - Servidor Backend
npm run server

# Terminal 2 - Frontend React
npm start
```

#### Opción 3: Desarrollo con Concurrently
```bash
npm run dev:full
```

### 4. Probar la Integración
```bash
npm run test-stripe
```

## 🔧 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm start` | Inicia solo el frontend React |
| `npm run server` | Inicia solo el servidor backend |
| `npm run dev` | Inicia ambos con script personalizado |
| `npm run dev:full` | Inicia ambos con concurrently |
| `npm run test-stripe` | Prueba la integración de Stripe |
| `npm run build` | Construye la aplicación para producción |

## 📱 URLs de la Aplicación

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health
- **Stripe Dashboard**: https://dashboard.stripe.com/
- **Firebase Console**: https://console.firebase.google.com/

## 🧪 Tarjetas de Prueba

### Tarjetas de Éxito
```
4242424242424242 - Visa
4000056655665556 - Visa (débito)
5555555555554444 - Mastercard
```

### Tarjetas de Error
```
4000000000000002 - Tarjeta rechazada
4000000000009995 - Fondos insuficientes
4000002500003155 - 3D Secure requerido
```

### Tarjetas BNPL
```
4242424242424242 - Afterpay
4000000000000002 - Klarna
4000000000009995 - Affirm
```

## 🔗 Endpoints de la API

### Stripe Endpoints
- `POST /api/create-payment-intent` - Crear Payment Intent
- `POST /api/create-checkout-session` - Crear Checkout Session
- `POST /api/capture-payment` - Capturar pago autorizado
- `GET /api/checkout-session/:sessionId` - Obtener sesión
- `GET /api/receipt/:paymentIntentId` - Obtener recibo
- `POST /api/send-receipt` - Enviar recibo
- `GET /api/balance` - Obtener balance de Stripe

### Webhook Endpoints
- `POST /api/webhook` - Recibir eventos de Stripe

### Health Check
- `GET /api/health` - Estado del servidor y Stripe

## 🎯 Eventos de Webhook Soportados

- `payment_intent.succeeded` - Pago exitoso
- `payment_intent.payment_failed` - Pago fallido
- `payment_intent.amount_capturable_updated` - Pago listo para capturar
- `checkout.session.completed` - Checkout completado
- `checkout.session.expired` - Checkout expirado
- `balance.available` - Fondos disponibles
- `charge.dispute.created` - Disputa creada
- `payment_intent.requires_action` - 3D Secure requerido
- `invoice.payment_succeeded` - Pago de suscripción

## 🔐 Configuración de Seguridad

### Variables de Entorno Requeridas
```bash
# Stripe (Obligatorio)
STRIPE_SECRET_KEY=sk_test_...
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Firebase (Obligatorio)
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...

# Servidor (Opcional)
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Headers de Seguridad
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `X-Requested-With: XMLHttpRequest` (CSRF protection)

## 🚀 Despliegue a Producción

### 1. Configurar Variables de Producción
```bash
# Cambiar a claves de producción
STRIPE_SECRET_KEY=sk_live_...
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Configurar dominio
FRONTEND_URL=https://tudominio.com
```

### 2. Configurar Webhooks en Stripe
1. Ve a https://dashboard.stripe.com/webhooks
2. Crea un nuevo endpoint: `https://tudominio.com/api/webhook`
3. Selecciona los eventos necesarios
4. Copia el secreto del webhook a `STRIPE_WEBHOOK_SECRET`

### 3. Construir para Producción
```bash
npm run build
```

## 🐛 Solución de Problemas

### Error: "Stripe not configured"
- Verifica que `STRIPE_SECRET_KEY` esté configurado
- Asegúrate de que la clave sea válida

### Error: "Webhook signature verification failed"
- Verifica que `STRIPE_WEBHOOK_SECRET` esté configurado
- Asegúrate de que el secreto coincida con el de Stripe

### Error: "Firebase not configured"
- Verifica que todas las variables de Firebase estén configuradas
- Asegúrate de que el proyecto Firebase exista

### Error: "CORS error"
- Verifica que `FRONTEND_URL` esté configurado correctamente
- Asegúrate de que el frontend esté ejecutándose en el puerto correcto

## 📚 Documentación Adicional

- [Stripe API v2 Documentation](https://docs.stripe.com/api-v2-overview)
- [Stripe.js ES Module](https://docs.stripe.com/sdks/stripejs-esmodule)
- [React Stripe.js](https://docs.stripe.com/sdks/stripejs-react)
- [Stripe Testing Guide](https://docs.stripe.com/testing)
- [Firebase Documentation](https://firebase.google.com/docs)

## 🆘 Soporte

Si encuentras algún problema:

1. **Revisa los logs**: Verifica los logs del servidor y del navegador
2. **Ejecuta las pruebas**: `npm run test-stripe`
3. **Verifica la configuración**: Asegúrate de que todas las variables estén configuradas
4. **Consulta la documentación**: Revisa la documentación de Stripe y Firebase
5. **Contacta soporte**: Si el problema persiste, contacta al soporte técnico

## 🎉 ¡Felicitaciones!

Tu aplicación ahora tiene:
- ✅ Stripe API v2 completamente implementado
- ✅ Seguridad avanzada configurada
- ✅ Métodos de pago BNPL habilitados
- ✅ Webhooks funcionando
- ✅ Monitoreo y analytics
- ✅ Manejo de errores robusto
- ✅ Documentación completa

¡Tu e-commerce está listo para recibir pagos de forma segura y eficiente! 🚀
