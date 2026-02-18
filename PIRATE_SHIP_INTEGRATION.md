# Integración con Pirate Ship - Guía Completa

## ✅ Solución Implementada

Hemos creado una **API REST estándar** en nuestra aplicación, similar a cómo Shopify/WooCommerce exponen sus APIs. Esto permite integrar con Pirate Ship usando servicios de automatización como **Zapier**, **Make.com** (Integromat), o **n8n**.

## 🔌 Endpoints Disponibles

### 1. Obtener Pedidos Pendientes
```
GET /api/pirateship/orders?status=pending&limit=50&api_key=TU_API_KEY
```

**Respuesta:**
```json
{
  "orders": [
    {
      "id": "order123",
      "order_number": "ORD-001",
      "created_at": "2025-01-15T10:30:00Z",
      "status": "pending",
      "customer": {
        "first_name": "Juan",
        "last_name": "Pérez",
        "email": "juan@example.com",
        "phone": "+1234567890",
        "address": {
          "address_1": "123 Main St",
          "address_2": "Apt 4B",
          "city": "Miami",
          "state": "FL",
          "postal_code": "33101",
          "country": "US"
        }
      },
      "line_items": [
        {
          "name": "Producto 1",
          "quantity": 2,
          "price": 25.99
        }
      ],
      "shipping": {
        "weight": 1.5,
        "weight_unit": "lb",
        "dimensions": {
          "length": 8,
          "width": 6,
          "height": 4,
          "unit": "in"
        }
      },
      "total": 77.97,
      "shipping_cost": 5.99
    }
  ],
  "count": 1,
  "total": 1
}
```

### 2. Obtener Pedido Específico
```
GET /api/pirateship/orders/:orderId?api_key=TU_API_KEY
```

### 3. Webhook para Nuevos Pedidos
```
POST /api/pirateship/webhook/order-created
Body: { "orderId": "order123" }
```

## 🔐 Configuración de Seguridad

Agrega a tu archivo `.env`:
```
PIRATESHIP_API_KEY=tu_clave_secreta_aqui
```

Luego usa esta clave en los requests:
- Como query parameter: `?api_key=tu_clave_secreta_aqui`
- O como header: `X-API-Key: tu_clave_secreta_aqui`

## 🔄 Integración con Zapier

### Paso 1: Crear un Zap
1. Ve a [Zapier.com](https://zapier.com) y crea un nuevo Zap
2. **Trigger**: "Webhooks by Zapier" → "Catch Hook"
3. Copia la URL del webhook que Zapier te da

### Paso 2: Configurar Webhook en tu App
Cuando se crea un nuevo pedido, llama al endpoint:
```
POST https://tu-dominio.com/api/pirateship/webhook/order-created
Body: { "orderId": "order123" }
```

### Paso 3: Conectar con Pirate Ship
1. En Zapier, agrega un paso: "Code by Zapier" o "Formatter"
2. Transforma los datos al formato CSV que Pirate Ship necesita
3. Agrega un paso: "Pirate Ship" (si tienen integración) o "Email" para enviar el CSV

## 🔄 Integración con Make.com (Integromat)

### Opción 1: Polling (Revisar cada X minutos)
1. Crea un escenario en Make.com
2. **Trigger**: "HTTP" → "Make a Request"
   - URL: `https://tu-dominio.com/api/pirateship/orders?status=pending&api_key=TU_API_KEY`
   - Método: GET
   - Schedule: Cada 15 minutos
3. **Action**: "Pirate Ship" → "Create Shipment" (si disponible)
   - O "Email" → Enviar CSV

### Opción 2: Webhook (Tiempo Real)
1. **Trigger**: "Webhooks" → "Custom Webhook"
2. Copia la URL del webhook
3. En tu app, cuando se crea un pedido, llama a esa URL con los datos

## 🔄 Integración con n8n

1. Crea un workflow en n8n
2. **Trigger**: "HTTP Request" (Webhook)
3. **Action**: "HTTP Request" para obtener datos del pedido
4. **Action**: "Code" para formatear a CSV
5. **Action**: "Email" o "Pirate Ship" para enviar

## 📋 Formato CSV para Pirate Ship

El endpoint `/api/pirateship/export-order` ya genera el CSV en el formato correcto:

```csv
Name,Company,Street1,Street2,City,State,Zip,Country,Phone,Email,Weight,Length,Width,Height,OrderNumber
"Juan Pérez","","123 Main St","Apt 4B","Miami","FL","33101","US","+1234567890","juan@example.com",24.00,8,6,4,"ORD-001"
```

## 🚀 Automatización Completa

### Flujo Recomendado:

1. **Pedido se crea** → Tu app llama al webhook
2. **Zapier/Make.com recibe webhook** → Obtiene datos del pedido
3. **Genera CSV** → Formatea datos al formato de Pirate Ship
4. **Envía a Pirate Ship** → Via email o importación automática
5. **Pirate Ship genera etiqueta** → Notifica de vuelta (opcional)

## 📝 Ejemplo de Código para Llamar Webhook

En tu código cuando se crea un pedido pagado:

```javascript
// Después de guardar el pedido en Firestore
const orderRef = doc(db, 'orders', orderId);
await addDoc(orderRef, orderData);

// Llamar webhook para notificar
try {
  await fetch('https://tu-dominio.com/api/pirateship/webhook/order-created', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId })
  });
} catch (error) {
  console.error('Error calling webhook:', error);
}
```

## 🔍 Testing

### Probar endpoint de pedidos:
```bash
curl "https://tu-dominio.com/api/pirateship/orders?status=pending&api_key=TU_API_KEY"
```

### Probar webhook:
```bash
curl -X POST https://tu-dominio.com/api/pirateship/webhook/order-created \
  -H "Content-Type: application/json" \
  -d '{"orderId": "order123"}'
```

## ✅ Ventajas de Esta Solución

1. **API Estándar**: Similar a Shopify/WooCommerce
2. **Automatización**: Usa Zapier/Make.com para conectar
3. **Tiempo Real**: Webhooks para notificaciones instantáneas
4. **Seguridad**: API keys para proteger endpoints
5. **Flexible**: Puedes conectar con cualquier servicio

## 🎯 Próximos Pasos

1. Configura `PIRATESHIP_API_KEY` en tu `.env`
2. Elige un servicio de automatización (Zapier, Make.com, n8n)
3. Configura el webhook o polling
4. Prueba con un pedido de prueba
5. Automatiza el flujo completo

---

**Nota**: Aunque Pirate Ship no tiene API pública, esta solución te permite automatizar la integración usando servicios de terceros, igual que lo hacen Shopify/WooCommerce.



