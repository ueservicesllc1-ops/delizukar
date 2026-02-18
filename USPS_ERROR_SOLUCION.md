# Solución al Error "invalid_request" de USPS OAuth

## Situación Actual

Estás recibiendo el error:
```
"error": "invalid_request",
"error_description": "The request is missing one or more required parameters or is otherwise malformed."
```

## Posibles Causas

1. **Aplicación no completamente configurada**: La aplicación puede estar creada pero no activada/aprobada
2. **Credenciales incorrectas**: Las credenciales pueden necesitar ser regeneradas
3. **Portal de migración**: USPS está migrando de Web Tools APIs a nuevas APIs (fecha límite: 25 de enero de 2026)

## Soluciones a Probar

### Opción 1: Verificar Estado de la Aplicación

1. Ve a: https://developer.usps.com/
2. Inicia sesión
3. Ve a "My Apps" o "Applications"
4. Verifica que tu aplicación esté:
   - ✅ **Estado**: "Active" o "Approved"
   - ✅ **APIs habilitadas**: Domestic Prices 3.0 y Domestic Labels 3.0
   - ✅ **OAuth configurado**: Verifica que OAuth 2.0 esté habilitado

### Opción 2: Regenerar Credenciales

Si la aplicación está inactiva o las credenciales no funcionan:

1. En el portal de desarrolladores, ve a tu aplicación
2. Busca la opción "Regenerate Credentials" o "Reset Credentials"
3. Genera nuevas credenciales
4. Actualiza el archivo `.env.local` con las nuevas credenciales

### Opción 3: Contactar Soporte de USPS

Si las opciones anteriores no funcionan, contacta al soporte:

**Email**: web.tools@usps.gov o uspsshipsupport@usps.gov
**Teléfono**: 1-877-672-0007 Option 7, Option 1
**Formulario**: https://emailus.usps.com/s/web-tools-inquiry

**Información a proporcionar**:
- Consumer Key: `1Tx0JPG6nGFoZ7fVHB7PLCR1QVBY7K4XP4AVbTqvZAS9sDAb`
- Error recibido: "invalid_request" al intentar obtener token OAuth
- APIs que necesitas: Domestic Prices 3.0 y Domestic Labels 3.0
- Que estás usando OAuth 2.0 Client Credentials flow

### Opción 4: Verificar URL del Endpoint OAuth

El endpoint correcto debería ser:
- **Producción**: `https://api.usps.com/oauth2/v3/token`
- **Sandbox/Testing**: Puede ser diferente

## Código Actual

El código actual está configurado correctamente para OAuth 2.0 Client Credentials flow:

```javascript
const bodyParams = new URLSearchParams({
  grant_type: 'client_credentials',
  client_id: clientId,
  client_secret: clientSecret,
});

const response = await fetch('https://api.usps.com/oauth2/v3/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: bodyParams.toString(),
});
```

## Próximos Pasos Recomendados

1. **Primero**: Verifica el estado de la aplicación en el portal
2. **Segundo**: Si está inactiva, contacta al soporte para activarla
3. **Tercero**: Si está activa pero sigue fallando, regenera las credenciales
4. **Cuarto**: Si nada funciona, contacta al soporte con todos los detalles

## Nota Importante

Según la documentación, USPS está migrando a nuevas APIs. Asegúrate de estar usando:
- ✅ Portal nuevo: https://developer.usps.com/
- ✅ APIs v3: Domestic Prices 3.0 y Domestic Labels 3.0
- ❌ NO uses las Web Tools APIs antiguas (se retiran el 25 de enero de 2026)



