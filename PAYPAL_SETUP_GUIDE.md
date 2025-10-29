# 🚀 Guía de Configuración de PayPal para Delizukar

Esta guía te ayudará a configurar PayPal en tu aplicación de manera rápida y sencilla.

## 📋 Requisitos Previos

1. **Cuenta de PayPal Developer**: Necesitas una cuenta en [PayPal Developer](https://developer.paypal.com/)
2. **Node.js**: Versión 14 o superior
3. **npm**: Gestor de paquetes de Node.js

## 🛠️ Configuración Rápida

### Paso 1: Configurar PayPal Developer

1. Ve a [PayPal Developer](https://developer.paypal.com/)
2. Inicia sesión con tu cuenta de PayPal
3. Ve a "My Apps & Credentials"
4. Crea una nueva aplicación:
   - **App Name**: Delizukar
   - **Merchant**: Tu cuenta de PayPal
   - **Features**: Checkout, Payments, Invoicing
5. Copia el **Client ID** y **Client Secret**

### Paso 2: Configurar la Aplicación

Ejecuta el script de configuración automática:

```bash
npm run setup-paypal
```

Este script te guiará paso a paso para configurar PayPal.

### Paso 3: Verificar la Configuración

Prueba que todo esté funcionando:

```bash
npm run test-paypal
```

### Paso 4: Iniciar la Aplicación

```bash
npm start
```

## 🔧 Configuración Manual

Si prefieres configurar manualmente:

### 1. Crear archivo .env.local

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# PayPal Configuration
REACT_APP_PAYPAL_CLIENT_ID=tu_client_id_aqui
PAYPAL_CLIENT_SECRET=tu_client_secret_aqui
REACT_APP_PAYPAL_ENVIRONMENT=sandbox
REACT_APP_PAYPAL_CURRENCY=USD
REACT_APP_PAYPAL_INTENT=capture
```

### 2. Reemplazar Credenciales

- Reemplaza `tu_client_id_aqui` con tu Client ID de PayPal
- Reemplaza `tu_client_secret_aqui` con tu Client Secret de PayPal

## 🌍 Entornos

### Desarrollo (Sandbox)
- **Environment**: `sandbox`
- **URL**: `https://api-m.sandbox.paypal.com`
- **Propósito**: Pruebas sin procesar pagos reales

### Producción (Live)
- **Environment**: `production`
- **URL**: `https://api-m.paypal.com`
- **Propósito**: Pagos reales

## 🧪 Pruebas

### Tarjetas de Prueba (Sandbox)

Para probar pagos con tarjeta en sandbox:

- **Visa**: 4032035495730604
- **Mastercard**: 5555555555554444
- **American Express**: 378282246310005
- **CVV**: Cualquier número de 3 dígitos
- **Fecha de expiración**: Cualquier fecha futura

### Cuentas de Prueba

PayPal te proporciona cuentas de prueba automáticamente en el sandbox.

## 🔍 Solución de Problemas

### Error: "PayPal is not available"

**Causa**: Client ID incorrecto o no configurado
**Solución**: 
1. Verifica que `REACT_APP_PAYPAL_CLIENT_ID` esté configurado
2. Ejecuta `npm run test-paypal` para verificar

### Error: "Invalid credentials"

**Causa**: Client Secret incorrecto
**Solución**:
1. Verifica que `PAYPAL_CLIENT_SECRET` esté configurado
2. Asegúrate de usar las credenciales correctas para el entorno

### Error: "Payment failed"

**Causa**: Configuración incorrecta del entorno
**Solución**:
1. Verifica que `REACT_APP_PAYPAL_ENVIRONMENT` sea correcto
2. Asegúrate de usar credenciales del entorno correcto

## 📁 Archivos Importantes

- `src/paypal/config.js` - Configuración de PayPal
- `src/services/paypalService.js` - Servicio de PayPal
- `src/components/PayPalPaymentForm.js` - Formulario de pago
- `src/components/PayPalCardPayment.js` - Pago con tarjeta
- `.env.local` - Variables de entorno

## 🚀 Despliegue a Producción

### 1. Obtener Credenciales de Producción

1. Ve a [PayPal Developer](https://developer.paypal.com/)
2. Cambia a "Live" en el dashboard
3. Crea una nueva aplicación para producción
4. Copia las credenciales de producción

### 2. Actualizar Variables de Entorno

```env
REACT_APP_PAYPAL_CLIENT_ID=tu_client_id_live
PAYPAL_CLIENT_SECRET=tu_client_secret_live
REACT_APP_PAYPAL_ENVIRONMENT=production
```

### 3. Verificar Configuración

```bash
npm run test-paypal
```

## 📞 Soporte

Si tienes problemas con la configuración:

1. **Revisa los logs**: Abre la consola del navegador
2. **Ejecuta las pruebas**: `npm run test-paypal`
3. **Verifica las credenciales**: Asegúrate de usar las credenciales correctas
4. **Consulta la documentación**: [PayPal Developer Docs](https://developer.paypal.com/docs/)

## 🔒 Seguridad

- **Nunca** compartas tus credenciales de producción
- **Usa** variables de entorno para las credenciales
- **Mantén** actualizadas las credenciales
- **Monitorea** los pagos en el dashboard de PayPal

## 📊 Monitoreo

- **Dashboard de PayPal**: [PayPal Developer Dashboard](https://developer.paypal.com/)
- **Logs de la aplicación**: Revisa la consola del navegador
- **Métricas**: Usa el dashboard de PayPal para monitorear pagos

---

¡Listo! 🎉 Tu aplicación ahora tiene PayPal configurado y funcionando.






