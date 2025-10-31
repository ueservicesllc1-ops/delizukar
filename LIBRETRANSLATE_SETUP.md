# Configuración de LibreTranslate para Delizukar

## Opción 1: Usar tu propia instancia en Railway (Recomendado)

### Paso 1: Crear un nuevo servicio en Railway para LibreTranslate

1. En Railway, crea un nuevo servicio
2. Selecciona "Deploy from Dockerfile" o "Deploy from GitHub Repo"
3. Usa este `Dockerfile`:

```dockerfile
FROM libretranslate/libretranslate

# Puerto por defecto de LibreTranslate
EXPOSE 5000

CMD ["libretranslate", "--host", "0.0.0.0", "--port", "5000"]
```

### Paso 2: Obtener la URL del servicio

Después de desplegar, Railway te dará una URL como:
- `https://libretranslate-production.up.railway.app`

### Paso 3: Configurar la variable de entorno

En tu servicio principal (el que ejecuta `server.js`), agrega esta variable de entorno:

```
LIBRETRANSLATE_URL=https://libretranslate-production.up.railway.app
```

**NOTA:** Si ambos servicios están en el mismo proyecto de Railway, también puedes usar la URL interna:
```
LIBRETRANSLATE_URLR=http://libretranslate:5000
```

### Paso 4: Configurar el frontend (opcional)

Si quieres que el frontend detecte automáticamente la URL del backend en producción, agrega esta variable de entorno en Railway:

```
REACT_APP_API_URL=https://tu-backend.up.railway.app
```

## Opción 2: Instalar localmente (para desarrollo)

Si quieres probar localmente:

```bash
docker run -p 5000:5000 libretranslate/libretranslate
```

Luego, en tu archivo `.env` local:
```
LIBRETRANSLATE_URL=http://localhost:5000
```

## Ventajas de usar tu propia instancia

✅ **Sin límites de peticiones** (error 429)
✅ **Sin problemas de CORS** (el backend hace de proxy)
✅ **Gratis** (dentro de los límites de Railway)
✅ **Control total** sobre la traducción

## Estado actual

- ✅ Backend configurado con endpoint `/api/translate`
- ✅ Componente `AutoTranslateButton` configurado para usar el backend
- ✅ El backend actúa como proxy, evitando problemas de CORS
- ⏳ Falta: Instalar instancia propia de LibreTranslate en Railway

## Próximos pasos

1. Desplegar LibreTranslate en Railway (usando el Dockerfile de arriba)
2. Configurar `LIBRETRANSLATE_URL` en las variables de entorno
3. Reiniciar el servicio principal
4. ¡Listo! El botón de traducción funcionará sin límites

