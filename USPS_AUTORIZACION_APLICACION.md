# Guía para Autorizar Aplicación USPS

## Portal de Autorización
URL: https://cop.usps.com/cop-navigator?wf=generic_user

## Pasos para Autorizar tu Aplicación

### Paso 1: Iniciar Sesión
1. Ve a: https://cop.usps.com/cop-navigator?wf=generic_user
2. Inicia sesión con tu cuenta de USPS Developer Portal

### Paso 2: Autorizar Aplicación
1. Una vez dentro, busca la opción para autorizar aplicaciones o "App Authorization"
2. Ingresa tu **Consumer Key** (Client ID): `1Tx0JPG6nGFoZ7fVHB7PLCR1QVBY7K4XP4AVbTqvZAS9sDAb`
3. Sigue los pasos para aprobar el acceso a las APIs

### Paso 3: Verificar APIs Habilitadas
Asegúrate de que tu aplicación tenga acceso a:
- ✅ **Domestic Prices 3.0** (para obtener tarifas)
- ✅ **Domestic Labels 3.0** (para crear etiquetas)

### Paso 4: Verificar Estado de la Aplicación
En el portal de desarrolladores (https://developer.usps.com/):
1. Ve a "My Apps" o "Applications"
2. Verifica que tu aplicación esté en estado **"Active"** o **"Approved"**
3. Si está en "Pending" o "Inactive", contacta al soporte de USPS

## Si la Aplicación No Está Aprobada

Si después de autorizar sigues teniendo problemas, contacta al soporte de USPS:

**Email**: web.tools@usps.gov
**Formulario**: https://emailus.usps.com/s/web-tools-inquiry

Menciona:
- Tu Consumer Key
- Que estás recibiendo error "invalid_request" o "invalid_client"
- Que necesitas acceso a Domestic Prices 3.0 y Domestic Labels 3.0

## Verificación de Credenciales

Tus credenciales actuales:
- **Consumer Key (Client ID)**: `1Tx0JPG6nGFoZ7fVHB7PLCR1QVBY7K4XP4AVbTqvZAS9sDAb`
- **Consumer Secret (Client Secret)**: `yCcmV9r5q7V2GUAlVwfGOjWHJaxFnQYxDI6FLYBv9Sx7XWokiEKkmrGIMgEPZAMJ`
- **CRID**: `55770137`
- **Label MID**: `904064333`

## Próximos Pasos

Una vez que autorices la aplicación:
1. Espera unos minutos para que los cambios se propaguen
2. Prueba de nuevo en tu aplicación
3. Si el error persiste, puede ser necesario regenerar las credenciales


