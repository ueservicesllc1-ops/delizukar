# Acción Inmediata Requerida - Error USPS OAuth

## Error Actual
```
"error": "invalid_client",
"error_description": "InvalidApiKey: The client application credentials provided in the request are missing, invalid, inactive or not approved for access."
```

## Diagnóstico
✅ **El código está correcto** - La implementación de OAuth 2.0 es correcta
❌ **El problema es de configuración/autorización en el portal de USPS**

## Pasos a Seguir (EN ORDEN)

### Paso 1: Verificar Estado de la Aplicación
1. Ve a: https://developer.usps.com/
2. Inicia sesión
3. Ve a **"My Apps"** o **"Applications"**
4. Busca tu aplicación: `delipagos` (o el nombre que le diste)
5. Verifica:
   - **Estado**: ¿Está "Active", "Pending" o "Inactive"?
   - **APIs habilitadas**: ¿Tiene acceso a "Domestic Prices 3.0" y "Domestic Labels 3.0"?
   - **OAuth**: ¿Está configurado OAuth 2.0?

### Paso 2: Si la Aplicación Está "Pending" o "Inactive"

**OPCIÓN A: Contactar Soporte de USPS (RECOMENDADO)**

**Email**: web.tools@usps.gov
**Teléfono**: 1-877-672-0007 Option 7, Option 1
**Formulario**: https://emailus.usps.com/s/web-tools-inquiry

**Mensaje a enviar**:
```
Hola,

Tengo una aplicación en el USPS Developer Portal que necesita ser activada/aprobada.

Detalles de la aplicación:
- Consumer Key (Client ID): 1Tx0JPG6nGFoZ7fVHB7PLCR1QVBY7K4XP4AVbTqvZAS9sDAb
- Nombre de la aplicación: delipagos (o el nombre que le diste)
- APIs necesarias: Domestic Prices 3.0 y Domestic Labels 3.0
- Error recibido: "InvalidApiKey: The client application credentials provided in the request are missing, invalid, inactive or not approved for access."

Estoy intentando usar OAuth 2.0 Client Credentials flow para obtener un token de acceso, pero recibo el error de "invalid_client".

¿Pueden verificar el estado de mi aplicación y activarla/aprobarla si es necesario?

Gracias.
```

**OPCIÓN B: Regenerar Credenciales**

1. En el portal de desarrolladores, ve a tu aplicación
2. Busca la opción **"Regenerate Credentials"** o **"Reset Credentials"**
3. Genera nuevas credenciales
4. Actualiza el archivo `.env.local` con las nuevas credenciales
5. Reinicia el servidor

### Paso 3: Verificar que la Aplicación Esté Enrollada en USPS SHIP

Según la documentación, para usar las APIs de USPS necesitas:
- ✅ **CRID** (Customer Registration ID): `55770137` ✅ Ya lo tienes
- ✅ **MID** (Mailer ID): `904064333` ✅ Ya lo tienes
- ✅ **Enterprise Payment Account (EPA)**: Debe estar configurado

Verifica en el **Business Customer Gateway** que tu cuenta esté completamente configurada.

### Paso 4: Después de Contactar Soporte

1. Espera respuesta de USPS (puede tomar 1-3 días hábiles)
2. Una vez que te confirmen que está activa, prueba de nuevo
3. Si sigue fallando, regenera las credenciales

## Mientras Tanto

Puedes continuar trabajando en otras partes de la aplicación. La integración de USPS está lista en el código, solo falta la aprobación/autorización del lado de USPS.

## Verificación Rápida

Para verificar si las credenciales están siendo leídas correctamente, puedes agregar este log temporal en `server.js` (línea ~4111):

```javascript
console.log('🔑 [USPS OAuth] Client ID:', clientId ? clientId.substring(0, 10) + '...' : 'NOT SET');
console.log('🔑 [USPS OAuth] Client Secret:', clientSecret ? 'SET (' + clientSecret.length + ' chars)' : 'NOT SET');
```

Esto te ayudará a confirmar que las variables de entorno se están leyendo correctamente.



