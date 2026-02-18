# Guía para Configurar UPS API

## Paso 1: Acceder al Portal de Desarrolladores de UPS

1. Ve a: https://developer.ups.com/
2. Haz clic en **"Get Started"** o **"Sign Up"** si no tienes cuenta
3. Si ya tienes cuenta, inicia sesión

## Paso 2: Crear una Aplicación

1. Una vez dentro del portal, ve a **"My Apps"** o **"Applications"**
2. Haz clic en **"Create New App"** o **"Add App"**
3. Completa el formulario:
   - **App Name**: `Delizukar Shipping` (o el nombre que prefieras)
   - **Description**: Descripción de tu aplicación
   - **Application Type**: Selecciona **"Web Application"** o **"API Integration"**
   - **Redirect URI**: Puede ser `http://localhost:5000` para desarrollo

## Paso 3: Seleccionar APIs

UPS tiene varias APIs. Para envíos necesitas:
- **Rating API** (para obtener tarifas)
- **Shipping API** (para crear etiquetas de envío)
- **Tracking API** (opcional, para rastreo)

Selecciona estas APIs cuando crees la aplicación.

## Paso 4: Obtener Credenciales

Después de crear la aplicación, UPS te proporcionará:

1. **Client ID** (Consumer Key)
2. **Client Secret** (Consumer Secret)
3. **Account Number** (Número de cuenta de UPS - lo necesitas para crear etiquetas)

## Paso 5: Configurar Variables de Entorno

Agrega estas variables a tu archivo `.env.local`:

```env
# UPS API
UPS_CLIENT_ID=tu_client_id_aqui
UPS_CLIENT_SECRET=tu_client_secret_aqui
UPS_ACCOUNT_NUMBER=tu_account_number_aqui
UPS_AUTO_PURCHASE_LABELS=true
```

## Paso 6: Entornos de UPS

UPS tiene dos entornos:
- **Sandbox/Testing**: Para pruebas (https://wwwcie.ups.com)
- **Production**: Para producción (https://onlinetools.ups.com)

Para desarrollo, usa el entorno de **Sandbox**.

## Información Adicional Necesaria

Para crear etiquetas de envío, también necesitarás:
- **Shipper Number** (número de cuenta del remitente)
- **Address** (dirección de origen - ya la tienes: 29 E 7TH ST, CLIFTON, NJ 07011)

## Notas Importantes

1. **OAuth 2.0**: UPS usa OAuth 2.0 similar a USPS, necesitarás obtener un token de acceso
2. **Rate Limiting**: UPS tiene límites de solicitudes por minuto/hora
3. **Account Number**: Necesitas una cuenta comercial de UPS para crear etiquetas reales
4. **Testing**: Usa el entorno de sandbox primero para probar sin costo

## Próximos Pasos

Una vez que tengas las credenciales:
1. Compártelas conmigo y las agregaré al código
2. Implementaré los endpoints de UPS (similar a USPS)
3. Integraré UPS en el checkout para mostrar opciones de envío
4. Configuraré la compra automática de etiquetas



