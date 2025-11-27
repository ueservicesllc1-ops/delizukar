# 🎯 Configuración Paso a Paso de Make.com

## ✅ Paso 1: Configurar API Key en tu App

### 1.1 Crear/Editar archivo `.env` o `.env.local`

En la raíz de tu proyecto, crea o edita el archivo `.env.local` y agrega:

```env
PIRATESHIP_API_KEY=delizukar_make_2025_abc123xyz
```

**Importante:** 
- Usa una clave única y segura
- No la compartas públicamente
- Reinicia tu servidor después de agregarla

### 1.2 Reiniciar el servidor

```bash
# Detén el servidor (Ctrl+C) y reinícialo
npm run server
```

---

## 🌐 Paso 2: Obtener tu URL de API

Necesitas saber la URL de tu aplicación:

- **Desarrollo:** `http://localhost:5000`
- **Producción:** Tu URL de Railway/Render/etc.

**Ejemplo:**
```
https://delizukar-production.up.railway.app
```

---

## 📝 Paso 3: Configurar Make.com - Módulo por Módulo

### Módulo 1: HTTP Request (Trigger)

1. En Make.com, haz clic en **"Edit"** en tu escenario
2. Haz clic en el botón **"+"** para agregar un módulo
3. Busca: **"HTTP"**
4. Selecciona: **"Make an HTTP Request"**
5. Configura:

```
Method: GET
URL: https://tu-dominio.com/api/pirateship/orders
Query String:
  - status: pending
  - limit: 10
  - api_key: delizukar_make_2025_abc123xyz

Headers:
  - Content-Type: application/json
```

6. Haz clic en **"OK"** o **"Save"**

### Módulo 2: Iterator (Procesar cada pedido)

1. Haz clic en **"+"** después del módulo HTTP
2. Busca: **"Tools"** → **"Iterator"**
3. En **"Array"**, selecciona: `orders` (del módulo anterior)
4. Haz clic en **"OK"**

### Módulo 3: Set Variables (Formatear datos)

**📍 IMPORTANTE:** Este módulo va DESPUÉS del Iterator y ANTES del módulo HTTP que llama a `/api/pirateship/export-order`.

1. Haz clic en **"+"** después del Iterator
2. Busca: **"Tools"** → **"Set Variables"**
3. Haz clic en **"Add variable"** para cada variable
4. **Para cada variable, haz clic en el ícono de lista 📋 junto al campo "Value"** para seleccionar los datos del Iterator

**Configuración de Variables:**

**Paso a paso para cada variable:**

1. Haz clic en **"Add variable"**
2. En el campo **"Variable name"**, escribe el nombre (ej: `id`)
3. En el campo **"Value"**, haz clic en el ícono 📋 (selector de campos)
4. En el menú desplegable, busca y selecciona el campo del Iterator

**Tabla de Variables a Configurar:**

| # | Variable Name | Value (del Iterator) | Ruta en Make.com |
|---|--------------|---------------------|------------------|
| 1 | `id` | `{{id}}` | Iterator → `id` |
| 2 | `order_number` | `{{order_number}}` | Iterator → `order_number` |
| 3 | `customer_first_name` | `{{customer.first_name}}` | Iterator → `customer` → `first_name` |
| 4 | `customer_last_name` | `{{customer.last_name}}` | Iterator → `customer` → `last_name` |
| 5 | `customer_email` | `{{customer.email}}` | Iterator → `customer` → `email` |
| 6 | `customer_phone` | `{{customer.phone}}` | Iterator → `customer` → `phone` |
| 7 | `address_street1` | `{{customer.address.address_1}}` | Iterator → `customer` → `address` → `address_1` |
| 8 | `address_street2` | `{{customer.address.address_2}}` | Iterator → `customer` → `address` → `address_2` |
| 9 | `address_city` | `{{customer.address.city}}` | Iterator → `customer` → `address` → `city` |
| 10 | `address_state` | `{{customer.address.state}}` | Iterator → `customer` → `address` → `state` |
| 11 | `address_zip` | `{{customer.address.postal_code}}` | Iterator → `customer` → `address` → `postal_code` |
| 12 | `address_country` | `{{customer.address.country}}` | Iterator → `customer` → `address` → `country` |
| 13 | `shipping_weight` | `{{shipping.weight}}` | Iterator → `shipping` → `weight` |
| 14 | `shipping_length` | `{{shipping.dimensions.length}}` | Iterator → `shipping` → `dimensions` → `length` |
| 15 | `shipping_width` | `{{shipping.dimensions.width}}` | Iterator → `shipping` → `dimensions` → `width` |
| 16 | `shipping_height` | `{{shipping.dimensions.height}}` | Iterator → `shipping` → `dimensions` → `height` |

**💡 Ejemplo Visual:**

Cuando configures la variable `customer_first_name`:
1. Variable name: `customer_first_name`
2. Value: Haz clic en 📋 → Selecciona: `Iterator` → `customer` → `first_name`
3. Make.com mostrará: `{{customer.first_name}}`

**⚠️ IMPORTANTE:** 
- Los nombres de las variables (Variable Name) son los que usarás después en el módulo HTTP
- Los valores (Value) deben venir del Iterator usando el selector 📋
- Si no ves algún campo, haz clic en el módulo Iterator para ver qué datos está devolviendo

**💡 Tip:** Si no ves algún campo, haz clic en el módulo Iterator para ver qué datos está devolviendo.

5. Haz clic en **"OK"** para guardar

### Módulo 4: Text Parser (Generar CSV)

**📍 IMPORTANTE:** Este módulo va DESPUÉS de "Set Variables" y genera el CSV directamente en Make.com.

**⚠️ NO uses el módulo HTTP POST** - Genera el CSV directamente aquí.

1. Haz clic en **"+"** después de Set Variables
2. Busca: **"Text parser"** → **"Text aggregator"** (o **"Text"** → **"Create text"**)
3. En el campo **"Text"**, pega esto y **usa las variables del módulo "Set Variables"**:

```
Name,Company,Street1,Street2,City,State,Zip,Country,Phone,Email,Weight,Length,Width,Height,OrderNumber
"{{customer_first_name}} {{customer_last_name}}","","{{address_street1}}","{{address_street2}}","{{address_city}}","{{address_state}}","{{address_zip}}","{{address_country}}","{{customer_phone}}","{{customer_email}}",{{shipping_weight}},{{shipping_length}},{{shipping_width}},{{shipping_height}},"{{order_number}}"
```

**💡 IMPORTANTE:** 
- Para usar las variables, haz clic en el ícono 📋 junto al campo y selecciona las variables del módulo "Set Variables"
- O escribe `{{` y Make.com te mostrará las variables disponibles
- Asegúrate de usar los nombres exactos de las variables que configuraste en "Set Variables"

4. Haz clic en **"OK"** para guardar

### Módulo 5: Email (Enviar CSV)

**📍 IMPORTANTE:** Este módulo envía el CSV generado por email.

1. Haz clic en **"+"** después de Text Parser
2. Busca: **"Email"** → **"Send an email"**
3. Configura:

```
To: delizukar@gmail.com (o tu email)
Subject: Pedido Pirate Ship - {{order_number}}
Content Type: Plain text
Content: Nuevo pedido para importar en Pirate Ship

Pedido: {{order_number}}
Cliente: {{customer_first_name}} {{customer_last_name}}

Se adjunta el CSV para importar en Pirate Ship.
```

4. En la sección **"Attachments"**, haz clic en **"Add attachment"**:
   - **File name:** `order_{{order_number}}.csv`
   - **Data:** Haz clic en 📋 → Selecciona el campo `text` del módulo Text Parser (o `output` dependiendo de cómo se llame)

**💡 IMPORTANTE:** 
- El CSV viene del módulo Text Parser
- Usa el selector 📋 para seleccionar el texto CSV generado
- Asegúrate de que el nombre del archivo termine en `.csv`

5. Haz clic en **"OK"** para guardar

---

## ⚙️ Paso 4: Configurar Schedule (Programar)

1. Haz clic en el módulo HTTP (el primero)
2. Busca el ícono de reloj ⏰ o "Schedule"
3. Configura:
   - **Schedule:** `Every 15 minutes`
   - **Time zone:** Tu zona horaria

---

## ✅ Paso 5: Probar y Activar

### 5.1 Probar primero

1. Haz clic en **"Run once"** (arriba a la derecha)
2. Espera a que termine la ejecución
3. Revisa cada módulo para ver si hay errores
4. Si hay errores, haz clic en el módulo para ver los detalles

### 5.2 Verificar datos

En cada módulo, puedes hacer clic para ver:
- **Input:** Qué datos recibió
- **Output:** Qué datos generó

### 5.3 Activar

1. Si todo funciona, haz clic en el switch **"Inactive"** → **"Active"**
2. El escenario ahora se ejecutará automáticamente cada 15 minutos

---

## 🔍 Troubleshooting (Solución de Problemas)

### Error en Módulo HTTP: "Invalid API key"
- ✅ Verifica que `PIRATESHIP_API_KEY` esté en tu `.env.local`
- ✅ Verifica que la clave en Make.com sea EXACTAMENTE la misma
- ✅ Reinicia tu servidor

### Error: "Cannot connect" o "Connection refused"
- ✅ Verifica que tu servidor esté corriendo
- ✅ Verifica que la URL sea correcta
- ✅ Si estás en desarrollo local, usa `http://localhost:5000`
- ✅ Si estás en producción, usa la URL completa de Railway/Render

### No aparecen pedidos
- ✅ Verifica que los pedidos tengan `paymentStatus: 'paid'`
- ✅ Verifica que los pedidos tengan `status: 'pending'`
- ✅ Prueba el endpoint directamente:
  ```
  https://tu-dominio.com/api/pirateship/orders?status=pending&api_key=TU_API_KEY
  ```

### Error en Iterator: "Array is empty"
- ✅ Verifica que el módulo HTTP esté devolviendo datos
- ✅ Haz clic en el módulo HTTP para ver el output
- ✅ Verifica que tenga un campo `orders` con datos

### Variables no se mapean correctamente
- ✅ Haz clic en cada módulo para ver qué datos recibe
- ✅ Usa el selector de campos (ícono de lista) para seleccionar variables
- ✅ Verifica que los nombres de campos coincidan exactamente

---

## 📊 Estructura Visual del Escenario

```
┌─────────────────────────────┐
│  HTTP Request (GET)         │ ← Obtiene pedidos
│  /api/pirateship/orders     │   cada 15 minutos
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Iterator                    │ ← Procesa cada pedido
│  Array: orders               │   uno por uno
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Set Variables               │ ← Extrae y formatea datos
│  16 variables                │   del Iterator
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Text Parser                 │ ← Genera CSV
│  CSV format                  │   directamente
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Email                       │ ← Envía CSV por email
│  Send email                  │
└─────────────────────────────┘
```

---

## 🎯 Checklist Final

Antes de activar, verifica:

- [ ] API key configurada en `.env.local`
- [ ] Servidor reiniciado
- [ ] URL correcta en Make.com
- [ ] Módulo HTTP (GET) configurado correctamente
- [ ] Iterator configurado con `orders`
- [ ] Todas las variables configuradas en Set Variables
- [ ] Text Parser generando CSV correctamente
- [ ] Email configurado con adjunto CSV
- [ ] **NO** hay módulo HTTP POST (debe estar eliminado)
- [ ] Schedule configurado (15 minutos)
- [ ] Probado con "Run once"
- [ ] Sin errores en ningún módulo
- [ ] Escenario activado

---

## 💡 Tips Importantes

1. **Empieza simple:** Configura primero el módulo HTTP y verifica que funcione
2. **Revisa los logs:** Cada módulo muestra qué datos recibe/envía
3. **Prueba paso a paso:** Agrega un módulo, prueba, luego agrega el siguiente
4. **Guarda frecuentemente:** Haz clic en "Save" después de cada cambio
5. **Monitorea el uso:** Ve a "Usage" para ver cuántas operaciones usas

---

## 📞 Si Necesitas Ayuda

1. Revisa los logs de cada módulo en Make.com
2. Revisa los logs de tu servidor (console.log)
3. Prueba el endpoint directamente en el navegador
4. Verifica que los datos en Firestore estén correctos

---

**¡Listo!** Sigue estos pasos y tu integración estará funcionando. 🚀

