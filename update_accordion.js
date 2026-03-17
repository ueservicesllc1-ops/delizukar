const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function updateAccordion() {
  const docRef = db.collection('settings').doc('accordionMenu');
  await docRef.set({
    aboutTitle: 'Recién horneadas para ti'
  }, { merge: true });
  console.log('✅ Accordion title updated in Firestore');
  process.exit(0);
}

updateAccordion().catch(err => {
  console.error(err);
  process.exit(1);
});
