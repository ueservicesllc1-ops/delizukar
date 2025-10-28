# 🔧 Solución de Problemas de PayPal

## Error: "PayPal is not available. Please check your internet connection and try again."

Este error es común y puede tener varias causas. Aquí están las soluciones paso a paso:

### 🔍 **Diagnóstico Rápido**

Ejecuta este comando para diagnosticar el problema:

```bash
npm run debug-paypal
```

### 🛠️ **Soluciones Comunes**

#### 1. **Variables de Entorno No Configuradas**

**Síntoma**: Error "PayPal is not available" inmediatamente

**Solución**:
```bash
# Verificar que existe el archivo .env.local
ls .env.local

# Si no existe, crear con tus credenciales
echo "REACT_APP_PAYPAL_CLIENT_ID=tu_client_id_aqui" > .env.local
echo "PAYPAL_CLIENT_SECRET=tu_client_secret_aqui" >> .env.local
echo "REACT_APP_PAYPAL_ENVIRONMENT=sandbox" >> .env.local
```

#### 2. **Client ID Incorrecto**

**Síntoma**: Error persistente después de configurar variables

**Solución**:
- Verifica que tu Client ID sea correcto
- Debe empezar con "A" y tener al menos 50 caracteres
- Ejemplo: `AVB4RgfQ-5QsURuFvjuEozb155zmRaOnMq7K-8gZOQWSMRS2ChXP8YSo_RlLJ8HG9cCJvd7rglAnwS1m`

#### 3. **Problemas de Red/CORS**

**Síntoma**: Error en consola del navegador sobre CORS

**Solución**:
- Verifica tu conexión a internet
- Desactiva extensiones del navegador que bloqueen scripts
- Prueba en modo incógnito

#### 4. **Configuración del Navegador**

**Síntoma**: PayPal no carga en ciertos navegadores

**Solución**:
- Actualiza tu navegador a la última versión
- Habilita JavaScript
- Desactiva bloqueadores de anuncios
- Prueba en Chrome, Firefox, o Safari

#### 5. **Entorno de Desarrollo**

**Síntoma**: Funciona en producción pero no en desarrollo

**Solución**:
- Verifica que `REACT_APP_PAYPAL_ENVIRONMENT=sandbox`
- Reinicia el servidor de desarrollo
- Limpia la caché del navegador

### 🧪 **Pruebas Paso a Paso**

#### Paso 1: Verificar Configuración
```bash
npm run debug-paypal
```

#### Paso 2: Verificar en el Navegador
1. Abre la consola del navegador (F12)
2. Ve a la página de checkout
3. Busca errores relacionados con PayPal
4. Verifica que las variables de entorno se carguen

#### Paso 3: Probar Conexión
```bash
# Probar conexión directa con PayPal
curl -X POST https://api-m.sandbox.paypal.com/v1/oauth2/token \
  -H "Authorization: Basic $(echo -n 'TU_CLIENT_ID:TU_CLIENT_SECRET' | base64)" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials"
```

### 🔧 **Componentes de PayPal Disponibles**

#### PayPalSimple (Recomendado)
- Componente simplificado
- Mejor manejo de errores
- Más fácil de debuggear

#### PayPalCheckout
- Componente avanzado
- Más funcionalidades
- Mejor para casos complejos

#### PayPalCardPayment
- Solo tarjetas de crédito
- No requiere cuenta PayPal
- Ideal para usuarios sin PayPal

### 📋 **Checklist de Verificación**

- [ ] Archivo `.env.local` existe
- [ ] `REACT_APP_PAYPAL_CLIENT_ID` configurado
- [ ] `PAYPAL_CLIENT_SECRET` configurado
- [ ] `REACT_APP_PAYPAL_ENVIRONMENT=sandbox`
- [ ] Aplicación reiniciada después de configurar
- [ ] Navegador actualizado
- [ ] JavaScript habilitado
- [ ] Sin bloqueadores de scripts

### 🚨 **Errores Específicos y Soluciones**

#### "Invalid Client ID"
```bash
# Verificar formato del Client ID
echo $REACT_APP_PAYPAL_CLIENT_ID | wc -c
# Debe ser mayor a 50 caracteres
```

#### "Unauthorized"
```bash
# Verificar Client Secret
echo $PAYPAL_CLIENT_SECRET | wc -c
# Debe ser mayor a 50 caracteres
```

#### "Network Error"
- Verificar conexión a internet
- Verificar firewall
- Probar en modo incógnito

#### "Script Load Error"
- Verificar que el script de PayPal se carga
- Verificar que no hay bloqueadores
- Verificar que el Client ID es válido

### 🔄 **Reiniciar Configuración**

Si nada funciona, reinicia la configuración:

```bash
# Eliminar configuración actual
rm .env.local

# Reconfigurar PayPal
npm run setup-paypal

# Reiniciar aplicación
npm start
```

### 📞 **Soporte Adicional**

Si el problema persiste:

1. **Revisa los logs del navegador** (F12 → Console)
2. **Ejecuta el diagnóstico**: `npm run debug-paypal`
3. **Verifica la documentación**: [PayPal Developer Docs](https://developer.paypal.com/docs/)
4. **Contacta soporte**: [PayPal Developer Support](https://developer.paypal.com/support/)

### 🎯 **Solución Rápida**

Para la mayoría de casos, esta secuencia funciona:

```bash
# 1. Verificar configuración
npm run debug-paypal

# 2. Si hay errores, reconfigurar
npm run setup-paypal

# 3. Reiniciar aplicación
npm start

# 4. Probar en navegador
# Abrir http://localhost:3000
# Ir a checkout
# Probar PayPal
```

---

¡Con estas soluciones deberías poder resolver el error "PayPal is not available"! 🎉




