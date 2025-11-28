# 🚀 Instrucciones de Configuración USPS API

## ✅ Credenciales Obtenidas

- **Consumer Key (Client ID)**: `1Tx0JPG6nGFoZ7fVHB7PLCR1QVBY7K4XP4AVbTqvZAS9sDAb`
- **Consumer Secret (Client Secret)**: `yCcmV9r5q7V2GUAlVwfGOjWHJaxFnQYxDI6FLYBv9Sx7XWokiEKkmrGIMgEPZAMJ`
- **CRID**: `55770137`
- **Label MID**: `904064333`

## 📋 Variables de Entorno a Agregar

### En `.env.local` (desarrollo local):

```env
USPS_OAUTH_CLIENT_ID=1Tx0JPG6nGFoZ7fVHB7PLCR1QVBY7K4XP4AVbTqvZAS9sDAb
USPS_OAUTH_CLIENT_SECRET=yCcmV9r5q7V2GUAlVwfGOjWHJaxFnQYxDI6FLYBv9Sx7XWokiEKkmrGIMgEPZAMJ
USPS_CRID=55770137
USPS_LABEL_MID=904064333
USPS_MASTER_MID=904064332
USPS_AUTO_PURCHASE_LABELS=true
```

### En Railway (producción):

1. Ve a tu proyecto en Railway
2. Ve a "Variables"
3. Agrega estas variables:

```json
{
  "USPS_OAUTH_CLIENT_ID": "1Tx0JPG6nGFoZ7fVHB7PLCR1QVBY7K4XP4AVbTqvZAS9sDAb",
  "USPS_OAUTH_CLIENT_SECRET": "yCcmV9r5q7V2GUAlVwfGOjWHJaxFnQYxDI6FLYBv9Sx7XWokiEKkmrGIMgEPZAMJ",
  "USPS_CRID": "55770137",
  "USPS_LABEL_MID": "904064333",
  "USPS_MASTER_MID": "904064332",
  "USPS_AUTO_PURCHASE_LABELS": "true"
}
```

## 🎯 Funcionalidades Implementadas

### 1. Obtener Tarifas de Envío
- **Endpoint**: `POST /api/usps/get-rates`
- **Funcionalidad**: Obtiene todas las opciones de envío USPS con tarifas comerciales
- **Uso**: Se puede usar en el checkout para mostrar opciones de envío

### 2. Comprar Etiquetas Automáticamente
- **Endpoint**: `POST /api/usps/create-label`
- **Funcionalidad**: Compra etiqueta de envío automáticamente
- **Uso**: Se ejecuta automáticamente cuando se crea un pedido pagado (si `USPS_AUTO_PURCHASE_LABELS=true`)

## ⚙️ Configuración

### Compra Automática de Etiquetas

Para habilitar/deshabilitar la compra automática:

- **Habilitar**: `USPS_AUTO_PURCHASE_LABELS=true`
- **Deshabilitar**: `USPS_AUTO_PURCHASE_LABELS=false` (o no definir la variable)

Cuando está habilitado:
- Al crear un pedido pagado, automáticamente:
  1. Obtiene las tarifas disponibles
  2. Selecciona la más económica
  3. Compra la etiqueta
  4. Actualiza el pedido con tracking number y URL de etiqueta
  5. Marca el pedido como "shipped"

## 🔍 Pruebas

### Probar Obtener Tarifas:

```bash
curl -X POST http://localhost:5000/api/usps/get-rates \
  -H "Content-Type: application/json" \
  -d '{
    "fromAddress": {"postal_code": "07011"},
    "toAddress": {"postal_code": "10001"},
    "weight": {"value": 1},
    "dimensions": {"length": 8, "width": 6, "height": 4}
  }'
```

### Probar Comprar Etiqueta:

```bash
curl -X POST http://localhost:5000/api/usps/create-label \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-order-id",
    "order": {
      "customerInfo": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "address": {
          "line1": "123 Main St",
          "city": "New York",
          "state": "NY",
          "postal_code": "10001",
          "country": "US"
        }
      },
      "packageInfo": {
        "weight": "1",
        "length": "8",
        "width": "6",
        "height": "4"
      }
    },
    "selectedRate": {
      "service": "USPS_GROUND_ADVANTAGE",
      "amount": "5.00"
    }
  }'
```

## 📝 Notas Importantes

1. **OAuth Token**: Se obtiene automáticamente y se cachea (expira en ~1 hora)
2. **Tarifas Comerciales**: Se usan tarifas comerciales (más baratas que retail)
3. **Dirección de Origen**: Hardcodeada a Clifton, NJ (29 E 7TH ST, CLIFTON, NJ 07011)
4. **Formato de Etiqueta**: PDF, tamaño 4X6

## 🚨 Troubleshooting

### Error: "USPS OAuth credentials not configured"
- Verifica que las variables `USPS_OAUTH_CLIENT_ID` y `USPS_OAUTH_CLIENT_SECRET` estén configuradas

### Error: "USPS CRID o Label MID no configurados"
- Verifica que `USPS_CRID` y `USPS_LABEL_MID` estén configurados

### Error: "401 Unauthorized"
- Verifica que las credenciales OAuth sean correctas
- Verifica que la aplicación esté autorizada en el portal de desarrolladores de USPS

### La compra automática no funciona
- Verifica que `USPS_AUTO_PURCHASE_LABELS=true`
- Revisa los logs del servidor para ver errores específicos
- Verifica que el pedido tenga `packageInfo` completo


