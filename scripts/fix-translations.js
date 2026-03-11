const admin = require('firebase-admin');
const fs = require('fs');
require('dotenv').config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function fixTranslations() {
  console.log('--- Iniciando limpieza de traducciones en Firebase ---');
  const productsRef = db.collection('products');
  const snapshot = await productsRef.get();

  if (snapshot.empty) {
    console.log('No se encontraron productos.');
    return;
  }

  const batch = db.batch();

  snapshot.forEach(doc => {
    const data = doc.data();
    const updates = {};
    let needsUpdate = false;

    // Si no tiene name_es, lo creamos
    if (!data.name_es) {
      // Intentamos traducir nombres comunes o usamos el name actual
      let nameEs = data.name || 'Producto sin nombre';
      if (nameEs.toLowerCase().includes('chocolate chip')) nameEs = nameEs.replace(/chocolate chip/gi, 'con Chispas de Chocolate');
      if (nameEs.toLowerCase().includes('vanilla')) nameEs = nameEs.replace(/vanilla/gi, 'Vainilla');
      if (nameEs.toLowerCase().includes('deluxe')) nameEs = nameEs.replace(/deluxe/gi, 'Deluxe');
      
      updates.name_es = nameEs;
      needsUpdate = true;
    }

    // Si no tiene description_es, lo creamos
    if (!data.description_es) {
      let descEs = data.description || '';
      // Si la descripción está en inglés (podemos detectar palabras clave inglesas)
      if (descEs.toLowerCase().includes('an intense cookie') || descEs.toLowerCase().includes('chocolate lovers')) {
        descEs = "Una galleta intensa con cuatro tipos de chocolate, textura cremosa y un sabor profundo para los verdaderos amantes del cacao. Una poderosa mezcla de cuatro tipos de chocolate en una sola galleta: barra de chocolate artesanal, chispas de chocolate oscuro, mini chispas semidulces y chispas de chocolate con leche. ¿Quién podría resistirse? Es como una sinfonía de texturas y sabores. No es solo una galleta de chocolate... es LA galleta de chocolate.";
      }
      
      updates.description_es = descEs || data.description;
      needsUpdate = true;
    }

    // Aseguramos que name_en y description_en existan también
    if (!data.name_en) { updates.name_en = data.name || ''; needsUpdate = true; }
    if (!data.description_en) { updates.description_en = data.description || ''; needsUpdate = true; }

    if (needsUpdate) {
      console.log(`Actualizando producto: ${data.name || doc.id}`);
      batch.update(doc.ref, updates);
    }
  });

  await batch.commit();
  console.log('--- Limpieza completada con éxito ---');
  process.exit(0);
}

fixTranslations().catch(err => {
  console.error('Error al actualizar productos:', err);
  process.exit(1);
});
