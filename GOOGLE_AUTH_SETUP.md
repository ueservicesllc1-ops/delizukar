# Configuración de Google Authentication en Firebase

Para habilitar el inicio de sesión con Google, necesitas seguir estos pasos:

## 1. Habilitar Google Auth en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto "Delizukar"
3. Ve a **Authentication** en el menú lateral
4. Haz clic en **Sign-in method**
5. En la lista de proveedores, encuentra **Google** y haz clic en él
6. **Activa** el toggle de "Enable"
7. Agrega tu **Project support email** (tu email)
8. Haz clic en **Save**

## 2. Configurar el Dominio Autorizado

1. En la misma página de **Sign-in method**
2. Ve a la pestaña **Authorized domains**
3. Asegúrate de que estén agregados:
   - `localhost` (para desarrollo)
   - Tu dominio de producción (cuando despliegues)

## 3. Obtener las Credenciales (Opcional)

Si necesitas las credenciales OAuth:
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs & Services** > **Credentials**
4. Crea o configura las credenciales OAuth 2.0

## 4. Probar la Funcionalidad

Una vez configurado:
1. Ve a `http://localhost:3000/login`
2. Haz clic en "Continuar con Google"
3. Se abrirá una ventana de Google para autenticación
4. Después de autenticarte, serás redirigido al admin dashboard

## Notas Importantes

- **Desarrollo**: Funciona automáticamente en localhost
- **Producción**: Necesitarás agregar tu dominio a los dominios autorizados
- **Seguridad**: Solo usuarios autenticados pueden acceder al admin dashboard
- **Datos**: Los datos se guardan en Firestore y son visibles para todos los usuarios

¡Listo! El inicio de sesión con Google ya está implementado en el código.

