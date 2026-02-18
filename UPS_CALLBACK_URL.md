# Callback URL para UPS Developer Portal

## Para Desarrollo Local

Puedes usar cualquiera de estas opciones:

### Opción 1 (Recomendada para desarrollo):
```
http://localhost:5000
```

### Opción 2:
```
http://localhost:5000/callback
```

### Opción 3:
```
http://localhost:5000/oauth/callback
```

## Para Producción

Si quieres configurar también para producción:

### Opción 1:
```
https://delizukar.com
```

### Opción 2:
```
https://delizukar-production.up.railway.app
```

## Múltiples URLs

Si UPS permite múltiples URLs (separadas por comas sin espacios):

```
http://localhost:5000,https://delizukar.com,https://delizukar-production.up.railway.app
```

## Nota Importante

Para el flujo **OAuth 2.0 Client Credentials** (que es el que usaremos), el Callback URL no se usa realmente, pero UPS puede requerirlo en el formulario.

**Recomendación**: Usa `http://localhost:5000` para desarrollo.



