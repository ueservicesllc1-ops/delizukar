// Script para configurar CORS en Firebase Storage
// Ejecutar con: node setup-cors.js

const { Storage } = require('@google-cloud/storage');

async function setupCORS() {
  try {
    const storage = new Storage({
      projectId: 'delizukar', // Reemplaza con tu Project ID
      keyFilename: './service-account-key.json' // Necesitarás descargar la clave de servicio
    });

    const bucket = storage.bucket('delizukar.firebasestorage.app');
    
    const corsConfig = [
      {
        origin: ['http://localhost:3000', 'http://localhost:3001', 'https://delizukar.web.app', 'https://delizukar.firebaseapp.com'],
        method: ['GET'],
        maxAgeSeconds: 3600
      }
    ];

    await bucket.setCorsConfiguration(corsConfig);
    console.log('✅ CORS configurado correctamente para Firebase Storage');
    console.log('Dominios permitidos:', corsConfig[0].origin);
    
  } catch (error) {
    console.error('❌ Error configurando CORS:', error);
    console.log('\n📋 Pasos alternativos:');
    console.log('1. Ve a Google Cloud Console');
    console.log('2. Selecciona tu proyecto "delizukar"');
    console.log('3. Ve a Cloud Storage > Browser');
    console.log('4. Haz clic en el bucket "delizukar.firebasestorage.app"');
    console.log('5. Ve a la pestaña "Permissions"');
    console.log('6. Agrega una regla CORS manualmente');
  }
}

setupCORS();

