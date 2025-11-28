# Guía para Obtener Credenciales de UPS API

## Tu Información Actual
- **Shipping Account**: `1HR859 - delizukar`
- **Programa**: E-commerce Advantage ✅

## Pasos para Obtener Credenciales de UPS API

### Paso 1: Acceder al UPS Developer Portal
1. Ve a: **https://developer.ups.com/**
2. Haz clic en **"Get Started"** o **"Sign Up"** si no tienes cuenta
3. Si ya tienes cuenta, inicia sesión

### Paso 2: Crear una Nueva Aplicación
1. Una vez dentro del portal, ve a **"My Apps"** o **"Applications"**
2. Haz clic en **"Create New App"** o **"Add App"**
3. Completa el formulario:
   - **App Name**: `Delizukar Shipping Integration`
   - **Description**: `Integration for shipping rates and label creation`
   - **Application Type**: Selecciona **"Web Application"** o **"API Integration"**
   - **Redirect URI**: `http://localhost:5000` (para desarrollo)

### Paso 3: Seleccionar APIs Necesarias
UPS tiene varias APIs. Para envíos necesitas:
- ✅ **Rating API** (para obtener tarifas de envío)
- ✅ **Shipping API** (para crear etiquetas de envío)
- ✅ **Tracking API** (opcional, para rastreo de paquetes)

Selecciona estas APIs cuando crees la aplicación.

### Paso 4: Obtener Credenciales
Después de crear la aplicación, UPS te proporcionará:

1. **Client ID** (Consumer Key)
2. **Client Secret** (Consumer Secret)
3. **Account Number** (ya lo tienes: `1HR859`)

### Paso 5: Entornos de UPS
UPS tiene dos entornos:
- **Sandbox/Testing**: Para pruebas (https://wwwcie.ups.com)
- **Production**: Para producción (https://onlinetools.ups.com)

**Para desarrollo, usa el entorno de Sandbox primero.**

### Paso 6: Información Adicional Necesaria
Para crear etiquetas de envío, también necesitarás:
- **Shipper Number**: Puede ser el mismo Account Number (`1HR859`)
- **Address**: Dirección de origen (ya la tienes: 29 E 7TH ST, CLIFTON, NJ 07011)

## Después de Obtener las Credenciales

Una vez que tengas las credenciales, compártelas conmigo y:
1. Las agregaré al archivo `.env.local`
2. Implementaré los endpoints de UPS (similar a USPS)
3. Integraré UPS en el checkout para mostrar opciones de envío
4. Configuraré la compra automática de etiquetas

## Variables de Entorno que Necesitarás

```env
# UPS API
UPS_CLIENT_ID=tu_client_id_aqui
UPS_CLIENT_SECRET=tu_client_secret_aqui
UPS_ACCOUNT_NUMBER=1HR859
UPS_SHIPPER_NUMBER=1HR859
UPS_AUTO_PURCHASE_LABELS=true
```

## Notas Importantes

1. **OAuth 2.0**: UPS usa OAuth 2.0 similar a USPS
2. **Rate Limiting**: UPS tiene límites de solicitudes por minuto/hora
3. **Account Number**: Ya tienes una cuenta comercial (`1HR859`)
4. **Testing**: Usa el entorno de sandbox primero para probar sin costo

## Si Tienes Problemas

Si no encuentras la opción para crear una aplicación o tienes problemas:
- Contacta al soporte de UPS Developer Portal
- Verifica que tu cuenta de UPS esté completamente activa
- Asegúrate de tener permisos de administrador en la cuenta


