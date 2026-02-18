# Integración con USPS Ship

## Referencia
- **USPS Ship Tech Sheet**: https://postalpro.usps.com/node/12167
- **USPS Ship** es una plataforma modernizada que permite:
  - Pago comercial de paquetes
  - Verificación
  - Visibilidad de extremo a extremo
  - Productos domésticos e internacionales

## Estado Actual de la Integración

Tu aplicación ya está configurada para usar:
- **USPS API v3** (Domestic Prices 3.0 y Domestic Labels 3.0)
- **OAuth 2.0** para autenticación
- **Enterprise Payment System (EPS)** para pagos comerciales

## Credenciales Configuradas

```
USPS_OAUTH_CLIENT_ID=1Tx0JPG6nGFoZ7fVHB7PLCR1QVBY7K4XP4AVbTqvZAS9sDAb
USPS_OAUTH_CLIENT_SECRET=yCcmV9r5q7V2GUAlVwfGOjWHJaxFnQYxDI6FLYBv9Sx7XWokiEKkmrGIMgEPZAMJ
USPS_CRID=55770137
USPS_LABEL_MID=904064333
USPS_MASTER_MID=904064332
```

## Endpoints Implementados

### 1. Obtener Tarifas
- **Endpoint**: `POST /api/usps/get-rates`
- **API USPS**: Domestic Prices 3.0
- **URL**: `https://api.usps.com/shipping/v3/prices/total-rates/search`

### 2. Crear Etiqueta
- **Endpoint**: `POST /api/usps/create-label`
- **API USPS**: Domestic Labels 3.0
- **URL**: `https://api.usps.com/shipping/v3/labels`

## Problema Actual

El error "invalid_request" indica que:
1. La aplicación puede no estar completamente autorizada en el portal de USPS
2. Las credenciales pueden necesitar ser regeneradas
3. Puede faltar algún paso de configuración en el Business Portal

## Próximos Pasos

### 1. Verificar en Business Portal
- Ve a: https://postalpro.usps.com/
- Verifica que tu cuenta esté activa
- Confirma que tienes acceso a USPS Ship

### 2. Verificar Estado de la Aplicación
- Portal de Desarrolladores: https://developer.usps.com/
- Ve a "My Apps"
- Verifica que la aplicación esté "Active" o "Approved"

### 3. Contactar Soporte si es Necesario
Si el problema persiste:
- **Email**: web.tools@usps.gov
- **Formulario**: https://emailus.usps.com/s/web-tools-inquiry

Menciona:
- Tu Consumer Key
- Que estás intentando usar Domestic Prices 3.0 y Domestic Labels 3.0
- El error "invalid_request" que estás recibiendo

## Documentación Adicional

- **Publication 199**: Guía técnica para USPS Ship
- **USPS Ship Data Dictionary**: Referencia de datos
- **Business Customer Gateway**: Portal para clientes comerciales

## Notas Importantes

1. **Enterprise Payment System (EPS)**: Tu cuenta está configurada con EPS, que es necesario para pagos comerciales
2. **CRID y MID**: Ya tienes configurados tu CRID (55770137) y Label MID (904064333)
3. **OAuth 2.0**: La autenticación está implementada correctamente en el código



