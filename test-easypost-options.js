// Script para probar las opciones de envío de EasyPost
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const EasyPost = require('@easypost/api');

const easypost = new EasyPost(process.env.EASYPOST_API_KEY);

async function getAvailableOptions() {
  try {
    console.log('🔍 Obteniendo opciones de envío disponibles de EasyPost...\n');
    
    // Crear direcciones de ejemplo (Miami, FL -> New York, NY)
    console.log('📍 Creando direcciones de ejemplo...');
    const fromAddress = await easypost.Address.create({
      name: 'Delizukar',
      company: 'Delizukar Bakery',
      street1: '123 Delizukar St',
      city: 'Miami',
      state: 'FL',
      zip: '33101',
      country: 'US',
      phone: '3055551234',
      email: 'support@delizukar.com'
    });

    const toAddress = await easypost.Address.create({
      name: 'Test Customer',
      street1: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'US',
      phone: '2125555678'
    });

    console.log('✅ Direcciones creadas\n');

    // Parcel de ejemplo (1 lb, 10x10x5 pulgadas)
    console.log('📦 Creando paquete de ejemplo (1 lb, 10x10x5 pulgadas)...');
    const parcel = await easypost.Parcel.create({
      length: 10,
      width: 10,
      height: 5,
      weight: 1
    });
    console.log('✅ Paquete creado\n');

    // Crear shipment
    console.log('🚀 Creando shipment en EasyPost...');
    const shipment = await easypost.Shipment.create({
      to_address: toAddress,
      from_address: fromAddress,
      parcel: parcel
    });

    console.log(`✅ Shipment creado: ${shipment.id}\n`);
    console.log(`📦 Total de opciones disponibles: ${shipment.rates ? shipment.rates.length : 0}\n`);

    if (!shipment.rates || shipment.rates.length === 0) {
      console.log('⚠️ No se encontraron opciones de envío disponibles');
      return;
    }

    // Agrupar por carrier
    const carriersMap = {};
    
    shipment.rates.forEach(rate => {
      const carrier = rate.carrier || 'Unknown';
      if (!carriersMap[carrier]) {
        carriersMap[carrier] = [];
      }
      carriersMap[carrier].push({
        service: rate.service || 'Unknown',
        price: parseFloat(rate.rate || 0),
        currency: rate.currency || 'USD',
        estimated_days: rate.est_delivery_days || null,
        delivery_date: rate.delivery_date || null,
        id: rate.id
      });
    });

    // Mostrar resultados
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 OPCIONES DE ENVÍO DISPONIBLES');
    console.log('═══════════════════════════════════════════════════════════\n');

    Object.keys(carriersMap).sort().forEach(carrier => {
      console.log(`\n🚚 ${carrier.toUpperCase()}`);
      console.log('─'.repeat(50));
      
      carriersMap[carrier]
        .sort((a, b) => a.price - b.price)
        .forEach((service, index) => {
          const days = service.estimated_days ? `(${service.estimated_days} días)` : '';
          const deliveryDate = service.delivery_date ? ` - Entrega: ${service.delivery_date}` : '';
          console.log(`  ${index + 1}. ${service.service}`);
          console.log(`     💰 $${service.price.toFixed(2)} ${service.currency} ${days}${deliveryDate}`);
        });
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`📊 RESUMEN:`);
    console.log(`   • Total de carriers: ${Object.keys(carriersMap).length}`);
    console.log(`   • Total de opciones: ${shipment.rates.length}`);
    console.log(`   • Paquete de ejemplo: 1 lb, 10" x 10" x 5"`);
    console.log(`   • Ruta: Miami, FL → New York, NY`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Guardar JSON completo
    const summary = {
      total_options: shipment.rates.length,
      carriers: Object.keys(carriersMap).map(carrier => ({
        name: carrier,
        services_count: carriersMap[carrier].length,
        services: carriersMap[carrier]
      })),
      shipment_id: shipment.id
    };

    console.log('📄 JSON completo guardado en resultado:\n');
    console.log(JSON.stringify(summary, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      console.error('   Detalles:', JSON.stringify(error.errors, null, 2));
    }
  }
}

getAvailableOptions();

