# 📋 Cómo Agregar Variables a Railway

## 🚀 Pasos Rápidos

1. **Ve a Railway**: https://railway.app
2. **Selecciona tu proyecto**: Delizukar
3. **Ve a "Variables"** (en el menú lateral)
4. **Copia y pega** las variables del archivo `railway-variables-complete-usps.json`

## 📝 Variables NUEVAS que debes agregar (si no están):

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

## 🔍 Verificación

Después de agregar las variables:
1. Railway debería reiniciar automáticamente
2. Revisa los logs para ver si hay errores
3. Busca en los logs: `✅ USPS OAuth token obtenido exitosamente` (cuando se use por primera vez)

## ⚙️ Configuración de Compra Automática

- **`USPS_AUTO_PURCHASE_LABELS=true`**: Compra etiquetas automáticamente cuando se crea un pedido
- **`USPS_AUTO_PURCHASE_LABELS=false`**: No compra automáticamente (solo cuando se llama manualmente)

## 📌 Nota

Si ya tienes las otras variables en Railway, solo necesitas agregar las 6 nuevas variables de USPS.



