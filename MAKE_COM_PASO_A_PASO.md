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

1. Haz clic en **"+"** después del Iterator
2. Busca: **"Tools"** → **"Set Variables"**
3. Agrega estas variables (una por una):

```
Variable 1:
  Name: customer_name
  Value: {{customer.first_name}} {{customer.last_name}}

Variable 2:
  Name: street1
  Value: {{customer.address.address_1}}

Variable 3:
  Name: street2
  Value: {{customer.address.address_2}}

Variable 4:
  Name: city
  Value: {{customer.address.city}}

Variable 5:
  Name: state
  Value: {{customer.address.state}}

Variable 6:
  Name: zip
  Value: {{customer.address.postal_code}}

Variable 7:
  Name: country
  Value: {{customer.address.country}}

Variable 8:
  Name: phone
  Value: {{customer.phone}}

Variable 9:
  Name: email
  Value: {{customer.email}}

Variable 10:
  Name: weight
  Value: {{shipping.weight}}

Variable 11:
  Name: length
  Value: {{shipping.dimensions.length}}

Variable 12:
  Name: width
  Value: {{shipping.dimensions.width}}

Variable 13:
  Name: height
  Value: {{shipping.dimensions.height}}

Variable 14:
  Name: order_number
  Value: {{order_number}}
```

4. Haz clic en **"OK"**

### Módulo 4: Text Parser (Generar CSV)

1. Haz clic en **"+"** después de Set Variables
2. Busca: **"Text parser"** → **"Text aggregator"**
3. En **"Text"**, pega esto:

```
Name,Company,Street1,Street2,City,State,Zip,Country,Phone,Email,Weight,Length,Width,Height,OrderNumber
"{{customer_name}}","","{{street1}}","{{street2}}","{{city}}","{{state}}","{{zip}}","{{country}}","{{phone}}","{{email}}",{{weight}},{{length}},{{width}},{{height}},"{{order_number}}"
```

4. Haz clic en **"OK"**

### Módulo 5: Email (Enviar CSV)

1. Haz clic en **"+"** después de Text Parser
2. Busca: **"Email"** → **"Send an email"**
3. Configura:

```
To: tu-email@delizukar.com
Subject: Pedido Pirate Ship - {{order_number}}
Text: Se adjunta el CSV para importar en Pirate Ship
Attachment:
  - File name: order_{{order_number}}.csv
  - File content: {{text}} (del módulo Text Parser)
```

4. Haz clic en **"OK"**

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
│  HTTP Request               │ ← Obtiene pedidos
│  GET /api/pirateship/orders │   cada 15 minutos
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
│  Set Variables               │ ← Formatea datos
│  14 variables                │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Text Parser                 │ ← Genera CSV
│  CSV format                  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Email                       │ ← Envía CSV
│  Send email                  │   por email
└─────────────────────────────┘
```

---

## 🎯 Checklist Final

Antes de activar, verifica:

- [ ] API key configurada en `.env.local`
- [ ] Servidor reiniciado
- [ ] URL correcta en Make.com
- [ ] Módulo HTTP configurado correctamente
- [ ] Iterator configurado con `orders`
- [ ] Todas las variables configuradas
- [ ] CSV generado correctamente
- [ ] Email configurado
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

