# Guía de Shippo Shipping Elements

## 📦 ¿Qué es Shippo Shipping Elements?

Shippo Shipping Elements es un widget embebido que permite a los usuarios crear etiquetas de envío directamente desde tu sitio web sin necesidad de desarrollar toda la interfaz de usuario. Es una alternativa más visual e interactiva a la API directa de Shippo.

**Documentación oficial:** https://docs.goshippo.com/docs/shippingelements/

## 🎯 Características

- ✅ Interfaz pre-construida y lista para usar
- ✅ Validación automática de direcciones
- ✅ Comparación de tarifas entre carriers
- ✅ Compra de etiquetas directamente desde el widget
- ✅ Gestión de direcciones (address book)
- ✅ Soporte para seguros y confirmación de firma
- ✅ Etiquetas de retorno
- ✅ Envíos internacionales
- ✅ Materiales peligrosos (Hazmat)

## 🚀 Implementación en Delizukar

### Componentes Creados

1. **`src/components/ShippoShippingElements.js`**
   - Componente React que carga y muestra el widget de Shippo
   - Maneja la autenticación con JWT
   - Gestiona el ciclo de vida del widget

2. **Endpoint del servidor: `POST /api/shippo/elements/authz`**
   - Genera el JWT necesario para autenticar el widget
   - Usa el token de API de Shippo para obtener el JWT

3. **Integración en `OrdersManager.js`**
   - Botón "Widget" junto al botón "Auto" para crear envíos
   - Permite elegir entre creación automática o widget interactivo

## 📋 Uso

### Desde OrdersManager

1. Abre el gestor de pedidos desde el panel de administración
2. Para cada pedido pendiente, verás dos botones:
   - **"Auto"**: Crea la etiqueta automáticamente usando Shippo
   - **"Widget"**: Abre el widget de Shippo para crear la etiqueta manualmente

3. Al hacer clic en "Widget":
   - Se abre un diálogo con el widget de Shippo
   - Los datos del pedido se pre-llenan automáticamente
   - Puedes modificar direcciones, paquetes, y seleccionar el carrier
   - Al comprar la etiqueta, se actualiza el pedido automáticamente

### Configuración Requerida

1. **Token de API de Shippo**
   ```bash
   # En tu archivo .env
   SHIPPO_API_TOKEN=shippo_test_tu_token_aqui
   REACT_APP_SHIPPO_API_TOKEN=shippo_test_tu_token_aqui
   ```

2. **Obtener el token:**
   - Ve a https://apps.goshippo.com/
   - Inicia sesión o crea una cuenta
   - Ve a API Configuration > Developer keys
   - Crea un test key para desarrollo (comienza con `shippo_test_`)
   - Para producción, crea un live key (comienza con `shippo_live_`)

3. **Verificar configuración:**
   ```bash
   npm run setup-shippo
   ```

## 🔧 API del Widget

### Inicialización

El widget se inicializa en dos pasos según la [documentación oficial](https://docs.goshippo.com/docs/shippingelements/install/):

1. **Cargar el script**: `https://js.goshippo.com/embeddable-client.js`
2. **Inicializar con `shippo.init()`**: Requiere token (JWT), org, locale y theme
3. **Renderizar con `shippo.labelPurchase()`**: Pasa el selector del contenedor y los datos del pedido

### Parámetros de `shippo.init()`

- **token** (requerido): JWT obtenido del endpoint `/api/shippo/elements/authz`
- **org** (requerido): Identificador de tu organización (ej: 'delizukar')
- **locale** (opcional): Código de idioma (ej: 'es', 'en', 'fr')
- **theme** (opcional): Objeto con personalización de estilos

### Parámetros de `shippo.labelPurchase()`

- **element** (requerido): Selector CSS del contenedor (ej: '#shippo-widget-container')
- **orderDetails** (requerido): Objeto con los datos del pedido en formato OrderDetails

### Eventos

El widget emite eventos que puedes escuchar con `shippo.on()`:

- **`LabelPurchased`**: Se ejecuta cuando se compra una etiqueta exitosamente
- **`Error`**: Se ejecuta si hay un error en el widget
- **`Close`**: Se ejecuta cuando se cierra el widget

Más información: https://docs.goshippo.com/docs/shippingelements/events/

### Formato de OrderDetails

El widget espera datos en formato `OrderDetails` según la [documentación](https://docs.goshippo.com/docs/shippingelements/install/):

```javascript
{
  address_from: {  // Opcional, usa la cuenta por defecto si no se proporciona
    name: 'Delizukar',
    street1: '123 Delizukar St',
    city: 'Miami',
    state: 'FL',
    zip: '33101',
    country: 'US',
    email: 'envios@delizukar.com',
    phone: ''
  },
  address_to: {  // Requerido
    name: 'Cliente',
    street1: 'Dirección del cliente',
    city: 'Ciudad',
    state: 'Estado',
    zip: 'Código postal',
    country: 'US',
    email: 'cliente@email.com',
    phone: ''
  },
  line_items: [{  // Requerido - array de items del pedido
    title: 'Item 1',
    sku: 'ITEM-1',
    quantity: 1,
    currency: 'USD',
    unit_amount: '12.00',
    unit_weight: '1',
    weight_unit: 'lb',
    country_of_origin: 'US'
  }],
  order_number: '12345'  // Opcional
}
```

**Nota**: Los `parcels` se convierten automáticamente a `line_items` en el componente.

## 🆚 Comparación: API vs Elements

### API Directa (Actual)
- ✅ Control total sobre el flujo
- ✅ Integración personalizada
- ❌ Requiere desarrollar toda la UI
- ❌ Más código para mantener

### Shipping Elements (Widget)
- ✅ UI pre-construida y profesional
- ✅ Menos código para mantener
- ✅ Actualizaciones automáticas de Shippo
- ❌ Menos control sobre la UI
- ❌ Requiere JWT adicional

## 📚 Recursos y Documentación

- **Documentación oficial:** https://docs.goshippo.com/docs/shippingelements/
- **Quickstart:** https://docs.goshippo.com/docs/shippingelements/quickstart/
- **Autorización (JWT):** https://docs.goshippo.com/docs/shippingelements/auth/
- **Instalación:** https://docs.goshippo.com/docs/shippingelements/install/
- **Personalización:** https://docs.goshippo.com/docs/shippingelements/customisation/
- **Flujo de datos:** https://docs.goshippo.com/docs/shippingelements/data_flow/
- **Eventos:** https://docs.goshippo.com/docs/shippingelements/events/
- **Bulk operations:** https://docs.goshippo.com/docs/shippingelements/bulk/
- **Manejo de errores:** https://docs.goshippo.com/docs/shippingelements/errors/
- **Changelog:** https://docs.goshippo.com/docs/shippingelements/elementschangelog/
- **Demo React:** https://github.com/goshippo/shipping-elements-react-demo

## 🐛 Troubleshooting

### El widget no carga

1. Verifica que el token de API esté configurado:
   ```bash
   npm run setup-shippo
   ```

2. Revisa la consola del navegador para errores

3. Verifica que el endpoint `/api/shippo/elements/authz` funcione:
   ```bash
   curl -X POST http://localhost:5001/api/shippo/elements/authz
   ```

### Error de autenticación

- Asegúrate de que el token de API sea válido
- Verifica que el token no haya expirado
- En modo test, usa tokens que comiencen con `shippo_test_`

### El widget no muestra datos del pedido

- Verifica que `orderData` tenga la estructura correcta
- Revisa los logs de la consola para ver qué datos se están enviando

## 💡 Próximos Pasos

1. **Personalización del tema**: Ajustar colores y estilos del widget
2. **Eventos adicionales**: Escuchar más eventos del widget
3. **Integración con webhooks**: Sincronizar con eventos de Shippo
4. **Gestión de direcciones**: Usar el address book del widget

## 📝 Notas Importantes

- **JWT Expiración**: El JWT expira después de **12 horas** (43200 segundos), no 1 hora
  - Según: https://docs.goshippo.com/docs/shippingelements/auth/
- **Modo Test vs Producción**: 
  - En modo test, las etiquetas están marcadas como "SAMPLE - DO NOT MAIL"
  - Usa tokens que comienzan con `shippo_test_` para desarrollo
  - Usa tokens que comienzan con `shippo_live_` para producción
- **Script URL**: El script correcto es `https://js.goshippo.com/embeddable-client.js`
- **Inicialización**: Debes llamar `shippo.init()` antes de `shippo.labelPurchase()`
- **Organización**: El parámetro `org` en `init()` debe ser un identificador único de tu organización
- **Eventos**: Los eventos se escuchan con `shippo.on()` y se limpian con `shippo.off()`

