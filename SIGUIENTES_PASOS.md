# 🎯 Siguientes Pasos - Integración Pirate Ship con Make.com

## ✅ Paso 1: Verificar que el Escenario Funciona

1. En Make.com, haz clic en **"Run once"** (arriba a la derecha)
2. Espera a que termine la ejecución
3. Revisa cada módulo:
   - ✅ HTTP Request debe mostrar pedidos
   - ✅ Iterator debe procesar cada pedido
   - ✅ Set Variables debe tener datos
   - ✅ (Si tienes más módulos) Text Parser y Email también deben funcionar

**Nota:** Si solo tienes 3 módulos y funcionan correctamente, ¡perfecto! El flujo mínimo necesario es:
1. HTTP Request (GET) - Obtiene pedidos
2. Iterator - Procesa cada pedido
3. Set Variables - Extrae datos (y posiblemente genera CSV/envía email)

## ✅ Paso 2: Activar el Escenario

1. En Make.com, haz clic en el switch **"Inactive"** → **"Active"**
2. El escenario ahora se ejecutará automáticamente

**¡Importante!** Si tus 3 módulos funcionan correctamente, ya puedes activar el escenario.

## ✅ Paso 3: Configurar el Schedule (Programación)

1. Haz clic en el módulo **HTTP Request** (el primero)
2. Busca el ícono de reloj ⏰ o **"Schedule"**
3. Configura:
   - **Schedule:** `Every 15 minutes` (o el intervalo que prefieras)
   - **Time zone:** Tu zona horaria
4. Guarda los cambios

**Opciones de Schedule:**
- `Every 15 minutes` - Para pedidos urgentes
- `Every 30 minutes` - Balanceado
- `Every 1 hour` - Para pedidos normales
- `Every 6 hours` - Para procesamiento en lote

## ✅ Paso 4: Verificar que los Emails Llegan (si aplica)

**Si tu flujo incluye envío de emails:**
1. Revisa tu bandeja de entrada (delizukar@gmail.com)
2. Debe llegar un email por cada pedido nuevo
3. El email debe tener un adjunto CSV (si aplica)

**Si tu flujo NO incluye emails:**
- Los datos están disponibles en Make.com para usar en otros módulos
- Puedes agregar módulos adicionales si los necesitas más adelante

## ✅ Paso 5: Importar CSV en Pirate Ship

1. Abre el email con el CSV adjunto
2. Descarga el archivo CSV
3. Ve a [Pirate Ship](https://www.pirateship.com/)
4. Inicia sesión en tu cuenta
5. Ve a **"Import"** o **"Bulk Import"**
6. Sube el archivo CSV
7. Revisa que los datos se importen correctamente
8. Crea las etiquetas de envío

## ✅ Paso 6: Monitorear el Escenario

1. En Make.com, ve a **"Execution history"**
2. Revisa que no haya errores
3. Verifica que se ejecute según el schedule configurado

## 🔍 Troubleshooting

### No llegan emails
- ✅ Verifica que el módulo Email esté configurado correctamente
- ✅ Revisa la carpeta de spam
- ✅ Verifica que el email destino sea correcto

### El CSV está vacío o mal formateado
- ✅ Verifica que las variables en Set Variables coincidan con los nombres usados en Text Parser
- ✅ Revisa el output del módulo Text Parser
- ✅ Asegúrate de que los datos del Iterator tengan la estructura correcta

### No se ejecuta automáticamente
- ✅ Verifica que el escenario esté **"Active"**
- ✅ Verifica que el Schedule esté configurado
- ✅ Revisa que no haya errores en la última ejecución

### No hay pedidos nuevos
- ✅ Verifica que haya pedidos con `status: 'pending'` en Firestore
- ✅ Prueba el endpoint directamente:
  ```
  https://delizukar-production.up.railway.app/api/pirateship/orders?status=pending&api_key=TU_API_KEY
  ```

## 📊 Checklist Final

Antes de considerar la integración completa:

- [ ] Escenario probado con "Run once"
- [ ] Todos los módulos funcionan sin errores
- [ ] Emails llegan correctamente
- [ ] CSVs se generan correctamente
- [ ] Schedule configurado
- [ ] Escenario activado
- [ ] Probar importar un CSV en Pirate Ship
- [ ] Monitorear durante 24 horas para asegurar que funciona automáticamente

## 🎉 ¡Listo!

Una vez completados estos pasos, tu integración estará funcionando completamente:
- ✅ Los pedidos nuevos se detectan automáticamente
- ✅ Se generan CSVs compatibles con Pirate Ship
- ✅ Se envían por email automáticamente
- ✅ Puedes importarlos en Pirate Ship para crear etiquetas

---

**¿Necesitas ayuda?** Revisa los logs en Make.com y en Railway para identificar cualquier problema.

