# 🚚 Configurar UPS API - Guía Paso a Paso

## 📋 Información que Ya Tienes

- **Account Number**: `1HR859`
- **Company Name**: Delizukar
- **Address**: 29 E 7TH ST, CLIFTON, NJ 07011
- **Phone**: (862) 388-5616
- **Email**: delizukar@gmail.com

---

## 🎯 Paso 1: Acceder al UPS Developer Portal

1. Ve a: **https://developer.ups.com/**
2. Haz clic en **"Get Started"** o **"Sign Up"** si no tienes cuenta
3. Si ya tienes cuenta, **inicia sesión**

---

## 🎯 Paso 2: Crear una Nueva Aplicación

1. Una vez dentro del portal, ve a **"My Apps"** o **"Applications"**
2. Haz clic en **"Create New App"** o **"Add App"**
3. Completa el formulario:

   - **App Name**: `Delizukar Shipping Integration`
   - **Description**: `Integration for shipping rates and label creation for e-commerce orders`
   - **Application Type**: Selecciona **"Web Application"** o **"API Integration"**
   - **Callback URL**: `http://localhost:5000` (para desarrollo)

---

## 🎯 Paso 3: Seleccionar APIs (Productos)

En la sección **"Products Included In This App"**, selecciona:

### ✅ OBLIGATORIOS:
- ✅ **Rating API** (para obtener tarifas de envío)
- ✅ **Shipping API** (para crear etiquetas de envío)

### ⚠️ OPCIONALES (pero recomendados):
- ✅ **Tracking API** (para rastrear paquetes)
- ✅ **Address Validation API** (para validar direcciones)

---

## 🎯 Paso 4: Completar Información Adicional (si se solicita)

Si UPS te pide completar información adicional:

### Información de la Empresa:
- **Company Name**: Delizukar
- **Business Address**: 29 E 7TH ST, CLIFTON, NJ 07011
- **Phone Number**: (862) 388-5616
- **Email**: delizukar@gmail.com
- **Website**: https://delizukar.com

### Propósito de la Aplicación:
- **Use Case**: E-commerce shipping integration
- **Description**: Integration for calculating shipping rates and creating shipping labels for online orders
- **Expected Volume**: [Tu volumen estimado de envíos por mes]

---

## 🎯 Paso 5: Obtener Credenciales

Después de crear la aplicación, UPS te proporcionará:

1. **Client ID** (también llamado Consumer Key)
2. **Client Secret** (también llamado Consumer Secret)
3. **App ID** (puede ser necesario)

**⚠️ IMPORTANTE**: Guarda estas credenciales de forma segura. Las necesitarás para configurar las variables de entorno.

---

## 🎯 Paso 6: Entornos de UPS

UPS tiene dos entornos:

- **Sandbox/Testing**: Para pruebas (https://wwwcie.ups.com)
  - Usa este primero para probar sin costo
  
- **Production**: Para producción (https://onlinetools.ups.com)
  - Usa este cuando todo funcione correctamente

**Para desarrollo, usa el entorno de Sandbox primero.**

---

## 🎯 Paso 7: Compartir Credenciales

Una vez que tengas las credenciales, compártelas conmigo y:

1. ✅ Las agregaré al archivo `.env.local`
2. ✅ Implementaré los endpoints de UPS (similar a USPS)
3. ✅ Integraré UPS en el checkout para mostrar opciones de envío
4. ✅ Configuraré la compra automática de etiquetas

---

## 📝 Variables de Entorno que Necesitarás

Después de obtener las credenciales, necesitarás estas variables:

```env
# UPS API
UPS_CLIENT_ID=tu_client_id_aqui
UPS_CLIENT_SECRET=tu_client_secret_aqui
UPS_ACCOUNT_NUMBER=1HR859
UPS_SHIPPER_NUMBER=1HR859
UPS_AUTO_PURCHASE_LABELS=true
```

---

## ⚠️ Notas Importantes

1. **OAuth 2.0**: UPS usa OAuth 2.0 similar a USPS
2. **Rate Limiting**: UPS tiene límites de solicitudes por minuto/hora
3. **Account Number**: Ya tienes una cuenta comercial (`1HR859`)
4. **Testing**: Usa el entorno de sandbox primero para probar sin costo
5. **Aprobación**: UPS puede tardar 1-3 días hábiles en aprobar tu aplicación

---

## 🆘 Si Tienes Problemas

- **No encuentras la opción para crear una aplicación**: Contacta al soporte de UPS Developer Portal
- **Te piden información adicional**: Completa el formulario con la información de tu empresa
- **Las credenciales no funcionan**: Verifica que tu aplicación esté aprobada y activa
- **Error de permisos**: Asegúrate de tener permisos de administrador en la cuenta de UPS

---

## ✅ Checklist

- [ ] Accedí al UPS Developer Portal
- [ ] Creé una nueva aplicación
- [ ] Seleccioné Rating API y Shipping API
- [ ] Completé la información adicional (si se solicitó)
- [ ] Obtuve las credenciales (Client ID y Client Secret)
- [ ] Compartí las credenciales para integrarlas

---

## 🚀 Próximos Pasos

Una vez que tengas las credenciales y las compartas:

1. Implementaré los endpoints de UPS:
   - `/api/ups/get-rates` (para obtener tarifas)
   - `/api/ups/create-label` (para crear etiquetas)
   - `/api/ups/oauth/token` (para obtener token OAuth)

2. Integraré UPS en el checkout:
   - Mostrará opciones de envío de UPS junto con USPS
   - Permitirá seleccionar el servicio de UPS

3. Configuraré la compra automática:
   - Si `UPS_AUTO_PURCHASE_LABELS=true`, comprará etiquetas automáticamente al crear pedidos

---

**¿Listo para empezar? Ve al Paso 1 y comienza a configurar tu aplicación en UPS Developer Portal.**


