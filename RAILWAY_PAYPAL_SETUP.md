# 🚂 Configuración de PayPal en Railway

## ⚠️ IMPORTANTE: Variables REACT_APP_* en Railway

Las variables de entorno que empiezan con `REACT_APP_*` se incrustan en el código JavaScript durante el **BUILD**, no en tiempo de ejecución.

### ✅ Pasos para configurar PayPal en Railway:

1. **Ve a tu proyecto en Railway**
   - Abre https://railway.app
   - Selecciona tu proyecto "delizukar"

2. **Configura las variables ANTES del build:**
   - Ve a la pestaña **"Variables"**
   - Agrega o actualiza estas variables:

   ```
   REACT_APP_PAYPAL_CLIENT_ID=tu_client_id_aqui
   REACT_APP_PAYPAL_ENVIRONMENT=sandbox
   REACT_APP_PAYPAL_CURRENCY=USD
   REACT_APP_PAYPAL_INTENT=capture
   ```

3. **IMPORTANTE: Después de configurar las variables:**
   - Railway debería hacer un **redeploy automático**
   - Si no lo hace, ve a **"Deployments"** y haz clic en **"Redeploy"**
   - **ESPERA** a que el build complete (puede tardar 3-5 minutos)

4. **Verifica que las variables estén configuradas:**
   - Abre la consola del navegador (F12) en tu sitio
   - Busca los logs que empiezan con `🔧 [PayPal]`
   - Deberías ver el Client ID y el environment configurado

## 🔍 Troubleshooting

### Error: "PayPal is not available"

**Posibles causas:**

1. **Variables no configuradas antes del build:**
   - ✅ Solución: Configura las variables y haz un redeploy completo

2. **Client ID incorrecto:**
   - Los Client IDs de **sandbox** normalmente empiezan con `sb` o `A`
   - Los Client IDs de **producción** pueden empezar con `B`, `A`, etc.
   - ✅ Solución: Verifica que el Client ID corresponda al environment

3. **Environment no coincide con Client ID:**
   - Si usas un Client ID de producción, pon `REACT_APP_PAYPAL_ENVIRONMENT=production`
   - Si usas un Client ID de sandbox, pon `REACT_APP_PAYPAL_ENVIRONMENT=sandbox`
   - ✅ Solución: Asegúrate de que coincidan

4. **Build hecho antes de configurar variables:**
   - ✅ Solución: Haz un redeploy completo después de configurar las variables

### Cómo verificar las variables en Railway:

1. Ve a **Variables** en Railway
2. Busca las variables que empiezan con `REACT_APP_PAYPAL_`
3. Verifica que estén configuradas correctamente
4. Si las cambias, haz un **redeploy completo**

## 📋 Checklist

- [ ] Variables `REACT_APP_PAYPAL_*` configuradas en Railway
- [ ] `REACT_APP_PAYPAL_ENVIRONMENT` está en `sandbox` (para pruebas)
- [ ] Client ID corresponde al environment (sandbox/production)
- [ ] Se hizo un redeploy completo después de configurar las variables
- [ ] El build completó exitosamente
- [ ] Se revisaron los logs en la consola del navegador

## 🔗 Links útiles

- [Railway Variables Docs](https://docs.railway.app/develop/variables)
- [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
- [PayPal SDK Docs](https://developer.paypal.com/sdk/js/)

