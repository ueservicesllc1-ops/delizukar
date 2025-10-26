# Sistema de Gestión de Envíos con EasyPost

Este es un proyecto completo de ejemplo que muestra cómo integrar EasyPost para crear envíos y enviar emails automáticos a los clientes.

## Instalación

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Variables de Entorno

Crear archivo `.env` en la raíz del backend:

```env
EASYPOST_API_KEY=tu_api_key_de_easypost
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion
PORT=5000
```

## Iniciar el Proyecto

### Terminal 1 - Backend
```bash
cd backend
npm start
```

### Terminal 2 - Frontend
```bash
cd frontend
npm start
```

El backend estará en `http://localhost:5000`
El frontend estará en `http://localhost:3000`

## Funcionalidades

### Enviar Email de Prueba
En la parte superior del panel hay un botón "Enviar Email de Prueba" que te permite:
- Ingresar cualquier email donde quieres recibir el email de prueba
- Enviar un email de prueba sin crear un envío real en EasyPost
- Verificar que la configuración de email (Nodemailer) funciona correctamente

### Crear Envíos Reales
Desde la tabla de pedidos puedes:
- Ver todos los pedidos pendientes
- Hacer clic en "Crear Envío" para cada pedido
- El sistema creará automáticamente un envío real en EasyPost
- Se comprará la etiqueta de envío
- Se enviará un email al cliente con la información de seguimiento
