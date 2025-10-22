# 🚀 Instrucciones Rápidas - Stripe API v2

## ✅ Estado Actual
- ✅ Servidor funcionando en puerto 5000
- ✅ Stripe API v2 implementado
- ✅ Variables de entorno configuradas
- ✅ Scripts de prueba creados

## 🚀 Inicio Rápido

### Opción 1: Inicio Automático (Recomendado)
```bash
npm run quick
```
Esto iniciará automáticamente tanto el servidor como la aplicación React.

### Opción 2: Configuración Manual
```bash
# 1. Configurar Stripe (opcional)
npm run setup

# 2. Iniciar aplicación
npm run dev
```

### Opción 3: Desarrollo Separado
```bash
# Terminal 1 - Servidor
npm run server

# Terminal 2 - React
npm start
```

## 🧪 Probar el Pago

### Probar API
```bash
npm run test-payment
```

### Probar Integración Completa
```bash
npm run test-stripe
```

## 🔑 Configurar Stripe (Opcional)

Si quieres usar tus propias claves de Stripe:

1. **Obtener claves**:
   - Ve a https://dashboard.stripe.com/apikeys
   - Asegúrate de estar en modo TEST
   - Copia tu `STRIPE_SECRET_KEY` (sk_test_...)
   - Copia tu `REACT_APP_STRIPE_PUBLISHABLE_KEY` (pk_test_...)

2. **Configurar**:
   ```bash
   npm run setup
   ```
   O edita manualmente el archivo `.env`

## 💳 Tarjetas de Prueba

### Tarjetas de Éxito
```
4242424242424242 - Visa
4000056655665556 - Visa débito
5555555555554444 - Mastercard
```

### Tarjetas de Error
```
4000000000000002 - Tarjeta rechazada
4000000000009995 - Fondos insuficientes
4000002500003155 - 3D Secure requerido
```

## 🌐 URLs de la Aplicación

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health
- **Stripe Dashboard**: https://dashboard.stripe.com/

## 🔧 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run quick` | Inicio rápido automático |
| `npm run setup` | Configurar Stripe paso a paso |
| `npm run dev` | Desarrollo completo |
| `npm run server` | Solo servidor backend |
| `npm start` | Solo frontend React |
| `npm run test-payment` | Probar pago simple |
| `npm run test-stripe` | Probar integración completa |

## 🎯 Flujo de Prueba

1. **Iniciar aplicación**:
   ```bash
   npm run quick
   ```

2. **Abrir navegador**:
   - Ve a http://localhost:3000

3. **Probar pago**:
   - Agrega productos al carrito
   - Ve al checkout
   - Usa tarjeta de prueba: `4242424242424242`
   - Completa el pago

4. **Verificar resultado**:
   - Revisa los logs del servidor
   - Verifica en Stripe Dashboard
   - Comprueba que el pago se procesó

## 🐛 Solución de Problemas

### Error: "Stripe not configured"
- Ejecuta: `npm run setup`
- O edita manualmente el archivo `.env`

### Error: "Server not responding"
- Verifica que el puerto 5000 esté libre
- Revisa los logs del servidor

### Error: "React not starting"
- Verifica que el puerto 3000 esté libre
- Revisa los logs de React

## 🎉 ¡Listo!

Tu aplicación está configurada con:
- ✅ Stripe API v2
- ✅ Métodos de pago BNPL
- ✅ Seguridad avanzada
- ✅ Webhooks configurados
- ✅ Monitoreo completo

**¡Tu e-commerce está listo para recibir pagos!** 🚀
