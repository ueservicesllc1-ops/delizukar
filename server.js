require('dotenv').config();
console.log('🔍 Environment variables loaded:');
console.log('EASYPOST_API_KEY:', process.env.EASYPOST_API_KEY ? 'SET' : 'NOT SET');

const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, getDoc, updateDoc, query, orderBy } = require('firebase/firestore');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Enhanced middleware with security best practices
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://192.168.13.173:3000',
    'https://delizukar-production.up.railway.app',
    'https://dia4qsw7.up.railway.app',
    'https://delizukar.com',
    'https://www.delizukar.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Allow Railway healthcheck hostname
app.use((req, res, next) => {
  if (req.get('host') === 'healthcheck.railway.app') {
    console.log('🔍 Railway healthcheck detected');
  }
  next();
});

// Enhanced JSON parsing with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Middleware para webhook (raw body)
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test endpoint para verificar conectividad con Firestore
app.get('/api/test-firestore', async (req, res) => {
  try {
    console.log('🔍 Testing Firestore connection...');
    
    // Intentar crear una colección de prueba
    const testDoc = {
      test: true,
      timestamp: new Date(),
      message: 'Firestore connection test'
    };
    
    const docRef = await addDoc(collection(db, 'test'), testDoc);
    console.log('✅ Test document created with ID:', docRef.id);
    
    res.json({
      success: true,
      message: 'Firestore connection successful',
      testDocId: docRef.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Firestore test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});

// ==================== EASYPOST ENDPOINTS ====================

// 1. Crear dirección en EasyPost
app.post('/api/easypost/create-address', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Creating address in EasyPost');
    console.log('🔍 DEBUG: EASYPOST_API_KEY exists:', !!process.env.EASYPOST_API_KEY);
    
    const response = await fetch('https://api.easypost.com/v2/addresses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EASYPOST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    console.log('✅ EasyPost address created:', data.id);
    res.json(data);
  } catch (error) {
    console.error('❌ EasyPost error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Obtener información de cuenta de EasyPost
app.get('/api/easypost/account', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Getting EasyPost account info');
    console.log('🔍 DEBUG: EASYPOST_API_KEY exists:', !!process.env.EASYPOST_API_KEY);
    
    const response = await fetch('https://api.easypost.com/v2/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.EASYPOST_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ EasyPost API error:', response.status, errorText);
      throw new Error(`EasyPost API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ EasyPost account info retrieved');
    res.json(data);
  } catch (error) {
    console.error('❌ EasyPost account error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Comprar etiqueta de envío en EasyPost
app.post('/api/easypost/buy-label', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Buying shipping label with EasyPost');
    console.log('🔍 DEBUG: Request body:', JSON.stringify(req.body, null, 2));
    
    const apiKey = process.env.EASYPOST_API_KEY;
    const { rateId } = req.body;
    
    if (!rateId) {
      return res.status(400).json({ error: 'Rate ID is required' });
    }
    
    const response = await fetch(`https://api.easypost.com/v2/shipments/${rateId.split('_')[0]}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rate: { id: rateId } }),
    });
    
    console.log('🔍 DEBUG: Buy label response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ EasyPost buy label error:', response.status, errorText);
      throw new Error(`EasyPost API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Label purchased successfully');
    console.log('🔍 DEBUG: Label data:', JSON.stringify(data, null, 2));
    
    res.json(data);
  } catch (error) {
    console.error('❌ EasyPost buy label error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Calcular tarifas de envío con EasyPost
app.post('/api/easypost/rates', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Calculating shipping rates with EasyPost');
    console.log('🔍 DEBUG: Request body:', JSON.stringify(req.body, null, 2));
    
    const apiKey = process.env.EASYPOST_API_KEY;
    
    // Convertir el formato de Shippo a EasyPost
    const { address_from, address_to, parcels } = req.body;
    
    const shipmentData = {
      shipment: {
        to_address: {
          name: address_to.name || '',
          street1: address_to.street1,
          city: address_to.city,
          state: address_to.state,
          zip: address_to.zip,
          country: address_to.country || 'US',
          phone: address_to.phone || '',
          email: address_to.email || ''
        },
        from_address: {
          name: address_from.name || 'Delizukar',
          street1: address_from.street1,
          city: address_from.city,
          state: address_from.state,
          zip: address_from.zip,
          country: address_from.country || 'US',
          phone: address_from.phone || '',
          email: address_from.email || 'support@delizukar.com'
        },
        parcel: {
          length: parcels[0].length || '10',
          width: parcels[0].width || '10',
          height: parcels[0].height || '10',
          weight: parcels[0].weight || '1'
        }
      }
    };
    
    console.log('🔍 DEBUG: Converted to EasyPost format:', JSON.stringify(shipmentData, null, 2));
    
    const response = await fetch('https://api.easypost.com/v2/shipments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shipmentData),
    });

    console.log('🔍 DEBUG: Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ EasyPost API error:', response.status, errorText);
      throw new Error(`EasyPost API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Shipping rates calculated');
    console.log('🔍 DEBUG: Response data:', JSON.stringify(data, null, 2));
    
    // EasyPost devuelve rates directamente en la raíz del objeto
    const easypostRates = data.rates || [];
    console.log('🔍 DEBUG: Rates count:', easypostRates.length);
    
    // Transformar rates de EasyPost al formato de Shippo para compatibilidad con el frontend
    // IMPORTANTE: No calculamos eta aquí, el frontend lo calculará basándose en la lógica de envío del lunes
    const rates = easypostRates.map(rate => ({
      object_id: rate.id,
      provider: rate.carrier?.toLowerCase() || rate.carrier,
      carrier: rate.carrier,
      servicelevel: {
        name: rate.service
      },
      service: rate.service,
      amount: parseFloat(rate.rate),
      currency: rate.currency,
      eta: null, // El frontend calculará la fecha correcta
      delivery_days: rate.delivery_days || rate.est_delivery_days
    }));
    
    // Devolver en formato similar a Shippo para compatibilidad con el frontend
    const responseData = {
      rates: rates,
      shipment: data
    };
    
    console.log('🔍 DEBUG: Transformed rates:', JSON.stringify(rates, null, 2));
    
    res.json(responseData);
  } catch (error) {
    console.error('❌ EasyPost rates error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ORDER MANAGEMENT ENDPOINTS ====================

// Helper function to automatically buy shipping label after payment
async function buyShippingLabelForOrder(shippingInfo) {
  try {
    console.log('📦 Attempting to buy shipping label automatically...');
    console.log('📦 Shipping info:', shippingInfo);
    
    if (!shippingInfo || !shippingInfo.rateId) {
      console.log('⚠️ No shipping info or rate ID provided, skipping label purchase');
      return null;
    }
    
    const apiKey = process.env.EASYPOST_API_KEY;
    const rateId = shippingInfo.rateId;
    
    // Extract shipment ID from rate ID
    const shipmentId = rateId.split('_')[0];
    
    const response = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rate: { id: rateId } }),
    });
    
    if (response.ok) {
      const labelData = await response.json();
      console.log('✅ Label purchased automatically:', labelData.id);
      console.log('📬 Tracking code:', labelData.tracking_code);
      return labelData;
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to buy label automatically:', errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ Error buying label automatically:', error);
    return null;
  }
}

// Endpoint: Crear envío completo con EasyPost
app.post('/api/create-shipment-complete', async (req, res) => {
  try {
    const { orderId, order } = req.body;
    
    console.log('🚚 Creando envío completo para pedido:', orderId);
    console.log('📦 Order data:', JSON.stringify(order, null, 2));
    
    if (!order || !order.customerInfo) {
      console.log('❌ Error: Datos del pedido incompletos');
      console.log('Order:', order);
      console.log('CustomerInfo:', order?.customerInfo);
      return res.status(400).json({
        success: false,
        error: 'Datos del pedido incompletos'
      });
    }

    const apiKey = process.env.EASYPOST_API_KEY;
    
    // Extraer información del pedido
    const customerInfo = order.customerInfo || order.customer || {};
    const shippingInfo = order.shippingInfo || order.shipping || {};
    
    console.log('👤 Customer Info:', JSON.stringify(customerInfo, null, 2));
    console.log('📍 Shipping Info:', JSON.stringify(shippingInfo, null, 2));
    
    // Validar datos mínimos requeridos
    const requiredFields = ['firstName', 'lastName', 'email'];
    const missingFields = requiredFields.filter(field => !customerInfo[field]);
    
    if (missingFields.length > 0) {
      console.log('❌ Campos faltantes:', missingFields);
      return res.status(400).json({
        success: false,
        error: `Datos incompletos del cliente. Faltan: ${missingFields.join(', ')}`
      });
    }
    
    // Crear direcciones en EasyPost
    const fromAddress = {
      name: 'Delizukar',
      street1: '123 Delizukar St',
      city: 'Miami',
      state: 'FL',
      zip: '33101',
      country: 'US',
      email: 'envios@delizukar.com'
    };
    
    // Extraer dirección del customerInfo (puede estar dentro de address object o como propiedades separadas)
    const address = customerInfo.address || {};
    console.log('🔍 [Address Debug] customerInfo.address:', JSON.stringify(address, null, 2));
    console.log('🔍 [Address Debug] customerInfo completo:', JSON.stringify(customerInfo, null, 2));
    
    const street1 = address.line1 || address.street1 || customerInfo.street1 || address.address || '123 Main St';
    const city = address.city || customerInfo.city || 'Miami';
    const zip = address.postal_code || address.zipCode || customerInfo.zipCode || customerInfo.zip || '33101';
    const country = address.country || customerInfo.country || 'US';
    
    console.log('🔍 [Address Debug] Extraídos:', { street1, city, zip, country });
    
    // Corregir estado basado en el código postal
    // Mapeo completo de códigos postales a estados (los primeros 2 dígitos)
    const zipToState = {
      // Massachusetts, Maine, New Hampshire, Vermont, Rhode Island
      '01': 'MA', '02': 'MA', '03': 'VT', '04': 'VT', '05': 'ME', '06': 'CT',
      // New York, New Jersey
      '07': 'NJ', '08': 'NJ', '09': 'NJ', '10': 'NY', '11': 'NY', '12': 'NY', 
      '13': 'NY', '14': 'NY',
      // Pennsylvania
      '15': 'PA', '16': 'PA', '17': 'PA', '18': 'PA', '19': 'PA',
      // Maryland, Delaware, Virginia, West Virginia, North Carolina
      '20': 'MD', '21': 'VA', '22': 'VA', '23': 'VA', '24': 'VA', '25': 'NC', 
      '26': 'NC', '27': 'NC', '28': 'NC',
      // South Carolina, Georgia
      '29': 'SC', '30': 'GA', '31': 'GA', '32': 'GA', '33': 'GA',
      // Florida
      '32': 'FL', '33': 'FL', '34': 'FL', '35': 'FL', '36': 'FL', '37': 'FL', 
      '38': 'FL', '39': 'FL',
      // Alabama, Mississippi, Louisiana, Arkansas
      '35': 'AL', '36': 'AL', '35': 'MS', '38': 'MS', '70': 'LA', '71': 'LA', 
      '72': 'LA', '73': 'LA',
      // Tennessee, Kentucky
      '37': 'TN', '38': 'TN', '40': 'KY', '41': 'KY', '42': 'KY',
      // Ohio
      '43': 'OH', '44': 'OH', '45': 'OH', '46': 'OH', '47': 'OH', '48': 'OH', 
      '49': 'OH',
      // Indiana, Michigan
      '46': 'IN', '47': 'IN', '48': 'IN', '48': 'MI', '49': 'MI',
      // Wisconsin, Minnesota, Iowa
      '53': 'WI', '54': 'WI', '55': 'MN', '56': 'MN', '50': 'IA', '51': 'IA', 
      '52': 'IA',
      // North Dakota, South Dakota, Nebraska, Kansas
      '58': 'ND', '57': 'SD', '68': 'SD', '67': 'NE', '66': 'KS', '67': 'KS',
      // Missouri, Oklahoma
      '63': 'MO', '64': 'MO', '65': 'MO', '73': 'OK', '74': 'OK',
      // Texas
      '75': 'TX', '76': 'TX', '77': 'TX', '78': 'TX', '79': 'TX',
      // Colorado, New Mexico, Arizona, Utah
      '80': 'CO', '81': 'CO', '85': 'AZ', '86': 'AZ', '84': 'UT',
      // Nevada, California
      '89': 'NV', '90': 'CA', '91': 'CA', '92': 'CA', '93': 'CA', '94': 'CA', 
      '95': 'CA', '96': 'CA',
      // Oregon, Washington, Idaho, Montana, Wyoming, Alaska, Hawaii
      '97': 'OR', '98': 'WA', '99': 'ID', '59': 'MT', '82': 'WY', '99': 'AK', 
      '96': 'HI',
      // Washington DC, Puerto Rico, Virgin Islands
      '20': 'DC', '00': 'PR', '00': 'VI'
    };
    
    let state = address.state || customerInfo.state || 'FL';
    
    // Si el código postal está en el mapeo, usar ese estado
    if (zip && zip.length >= 2) {
      const zipPrefix = zip.substring(0, 2);
      if (zipToState[zipPrefix]) {
        state = zipToState[zipPrefix];
        console.log(`✅ Estado corregido a ${state} basado en código postal ${zip}`);
      }
    }
    
    const toAddress = {
      name: `${customerInfo.firstName || 'Cliente'} ${customerInfo.lastName || ''}`,
      street1: street1,
      city: city,
      state: state,
      zip: zip,
      country: country,
      phone: customerInfo.phone || '',
      email: customerInfo.email || ''
    };
    
    console.log('📍 DIRECCIÓN EXACTA A ENVIAR A EASYPOST:');
    console.log('   Nombre:', toAddress.name);
    console.log('   Calle:', toAddress.street1);
    console.log('   Ciudad:', toAddress.city);
    console.log('   Estado:', toAddress.state);
    console.log('   Código Postal:', toAddress.zip);
    console.log('   País:', toAddress.country);
    console.log('📮 From Address:', JSON.stringify(fromAddress, null, 2));
    console.log('📮 To Address:', JSON.stringify(toAddress, null, 2));
    
    // Crear shipment en EasyPost SIN verificación estricta para evitar rechazos de USPS
    const shipmentData = {
      shipment: {
        to_address: toAddress,
        from_address: fromAddress,
        parcel: {
          length: '10',
          width: '10',
          height: '10',
          weight: '1'
        }
      }
    };
    
    console.log('📦 Creando shipment en EasyPost...');
    const shipmentResponse = await fetch('https://api.easypost.com/v2/shipments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shipmentData),
    });
    
    if (!shipmentResponse.ok) {
      const errorText = await shipmentResponse.text();
      console.error('❌ Error creando shipment:', errorText);
      return res.status(500).json({ 
        success: false,
        error: 'Error al crear shipment en EasyPost'
      });
    }
    
    const shipment = await shipmentResponse.json();
    console.log('✅ Shipment creado:', shipment.id);
    
    // Verificar si EasyPost sugirió correcciones a la dirección
    console.log('🔍 [Shipment Debug] shipment.to_address:', JSON.stringify(shipment.to_address, null, 2));
    console.log('🔍 [Shipment Debug] shipment.messages:', JSON.stringify(shipment.messages, null, 2));
    
    if (shipment.to_address && shipment.to_address.verifications && shipment.to_address.verifications.delivery) {
      const deliveryVerification = shipment.to_address.verifications.delivery;
      console.log('📋 Verificación de dirección completa:', JSON.stringify(deliveryVerification, null, 2));
      
      if (deliveryVerification.success === false) {
        console.log('❌ Dirección no verificada:', deliveryVerification.errors);
        const errorMessages = deliveryVerification.errors?.map(e => e.message || e).join(', ') || 'Unknown error';
        console.log('❌ [EasyPost Error] Message:', errorMessages);
        return res.status(400).json({
          success: false,
          error: `La dirección no pudo ser verificada: ${errorMessages}. Por favor, verifica que la dirección sea correcta y completa.`
        });
      }
      
      if (deliveryVerification.success === true) {
        console.log('✅ Dirección verificada y aceptada');
        if (shipment.to_address.street1 !== toAddress.street1) {
          console.log(`📝 Dirección corregida: "${toAddress.street1}" → "${shipment.to_address.street1}"`);
        }
      }
    } else {
      console.log('⚠️ No hay verificación de dirección en la respuesta de EasyPost');
    }
    
    // Verificar mensajes generales del shipment
    if (shipment.messages && shipment.messages.length > 0) {
      console.log('⚠️ Mensajes del shipment:', shipment.messages);
    }
    
    // Obtener rate disponible - priorizar UPS sobre USPS
    let rate = null;
    if (shipment.rates && shipment.rates.length > 0) {
      // Buscar primero UPS
      const upsRate = shipment.rates.find(r => r.carrier === 'UPS');
      if (upsRate) {
        rate = upsRate;
        console.log('✅ Seleccionando rate UPS:', rate.service);
      } else {
        // Si no hay UPS, usar el primero disponible
        rate = shipment.rates[0];
        console.log('⚠️ No hay UPS disponible, usando:', rate.carrier, rate.service);
      }
    }
    
    if (!rate) {
      return res.status(400).json({
        success: false,
        error: 'No hay tarifas disponibles para este envío'
      });
    }
    
    // Comprar la etiqueta usando el shipment ya verificado
    console.log('💰 Comprando etiqueta...');
    console.log('   Shipment ID:', shipment.id);
    console.log('   Rate ID:', rate.id);
    console.log('   Rate carrier:', rate.carrier);
    console.log('   Rate service:', rate.service);
    console.log('   Rate amount:', rate.amount);
    console.log('   Usando dirección VERIFICADA de EasyPost:', shipment.to_address.street1);
    
    const buyResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipment.id}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        rate: { id: rate.id }
      }),
    });
    
    if (!buyResponse.ok) {
      const errorText = await buyResponse.text();
      console.error('❌ Error comprando etiqueta - Status:', buyResponse.status);
      console.error('❌ Error comprando etiqueta - Response:', errorText);
      
      // Intentar parsear el error para dar más detalles
      let errorMessage = 'Error al comprar etiqueta';
      try {
        const errorData = JSON.parse(errorText);
        console.error('❌ Error data:', JSON.stringify(errorData, null, 2));
        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
          if (errorData.error.code === 'ADDRESS.VERIFY.FAILURE') {
            errorMessage = 'La dirección del cliente no pudo ser verificada por el servicio de envíos. Por favor, verifica que la dirección sea correcta.';
          }
        }
      } catch (e) {
        console.error('❌ Error parseando respuesta de error:', e);
      }
      
      return res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
    
    const label = await buyResponse.json();
    console.log('✅ Etiqueta comprada:', label.id);
    
    // Retornar datos del email para que el frontend use EmailJS
    res.json({
      success: true,
      data: {
        orderId: orderId,
        trackingCode: label.tracking_code,
        labelUrl: label.postage_label.label_url,
        emailData: {
          to_email: customerInfo.email,
          to_name: customerInfo.firstName,
          order_id: orderId,
          tracking_code: label.tracking_code,
          tracking_url: `https://track.easypost.com/d/${label.tracking_code}`,
          label_url: label.postage_label.label_url
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error creando envío completo:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== EMAIL ENDPOINTS ====================

// Endpoint: Enviar email de prueba (retorna los datos, el frontend usa EmailJS)
app.post('/api/send-test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email es requerido'
      });
    }

    console.log(`📧 Preparando datos de email de prueba para ${email}...`);

    // Crear datos de prueba
    const testOrder = {
      nombre: 'Cliente de Prueba',
      id: 'TEST-' + Date.now(),
      direccion: {
        street1: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        country: 'US'
      }
    };

    const testTrackingCode = 'EZ' + Date.now().toString().substring(4, 14);
    const testLabelUrl = 'https://www.easypost.com/example-label.pdf';

    // Retornar los datos para que el frontend use EmailJS
    res.json({
      success: true,
      message: 'Datos listos para enviar con EmailJS',
      emailData: {
        to_email: email,
        to_name: testOrder.nombre,
        order_id: testOrder.id,
        tracking_code: testTrackingCode,
        tracking_url: `https://track.easypost.com/d/${testTrackingCode}`,
        label_url: testLabelUrl
      }
    });

  } catch (error) {
    console.error('❌ Error preparando email de prueba:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== ORDER MANAGEMENT ENDPOINTS ====================

// 1. Obtener información de pago (solo PayPal)
app.get('/api/payment-intent/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    console.log('🔍 DEBUG: Getting PayPal payment info:', paymentIntentId);
    
    // Para PayPal, devolver información básica
    console.log('✅ PayPal payment detected:', paymentIntentId);
    
    res.json({
      id: paymentIntentId,
      amount: 0, // El frontend debería tener este valor
      currency: 'usd',
      status: 'succeeded',
      type: 'paypal'
    });
  } catch (error) {
    console.error('❌ Error getting payment info:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Crear orden en Firestore
app.post('/api/create-order', async (req, res) => {
  try {
    console.log('🔵 [Backend] POST /api/create-order recibido');
    console.log('🔵 [Backend] Request body:', JSON.stringify(req.body, null, 2));
    
    const { sessionId, paymentIntentId, customerInfo, cartItems, total, paymentStatus, createdAt, updatedAt, shippingInfo } = req.body;

    // Validar datos requeridos
    if (!customerInfo || !customerInfo.email) {
      console.error('❌ [Backend] Customer info missing or invalid');
      return res.status(400).json({ 
        error: 'Customer information is required',
        details: 'Email is mandatory'
      });
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      console.error('❌ [Backend] Cart items missing or empty');
      return res.status(400).json({ 
        error: 'Cart items are required',
        details: 'At least one item must be in the cart'
      });
    }

    if (!total || parseFloat(total) <= 0) {
      console.error('❌ [Backend] Invalid total amount');
      return res.status(400).json({ 
        error: 'Invalid total amount',
        details: 'Total must be greater than 0'
      });
    }

    console.log('🔵 [Backend] Creating order in Firestore for session:', sessionId);
    console.log('🔵 [Backend] Order data received:', { sessionId, paymentIntentId, customerInfo: !!customerInfo, cartItems: cartItems?.length, total });

    // Limpiar cartItems de campos que causan problemas - solo campos básicos
    const cleanedCartItems = cartItems.map(item => {
      // Crear objeto limpio sin campos problemáticos
      const cleanedItem = {
        id: String(item.id || ''),
        name: String(item.name || ''),
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 0,
        image: String(item.image || '')
      };
      
      // Validar que el item tiene datos mínimos
      if (!cleanedItem.id || !cleanedItem.name || cleanedItem.price <= 0 || cleanedItem.quantity <= 0) {
        console.warn('⚠️ [Backend] Invalid cart item:', cleanedItem);
      }
      
      // Remover cualquier campo extra que pueda causar problemas con Firestore
      return cleanedItem;
    });

    // Limpiar shippingInfo - solo campos esenciales, sin objetos anidados
    let cleanedShippingInfo = null;
    if (shippingInfo && Object.keys(shippingInfo).length > 0) {
      cleanedShippingInfo = {
        carrier: shippingInfo.carrier || null,
        serviceLevel: shippingInfo.serviceLevel || null,
        cost: parseFloat(shippingInfo.cost) || 0,
        trackingNumber: shippingInfo.trackingNumber || null
      };
    }

    const orderData = {
      sessionId: sessionId || paymentIntentId, // Usar sessionId o paymentIntentId como fallback
      paymentIntentId: paymentIntentId || sessionId,
      customerInfo: {
        firstName: String(customerInfo?.firstName || ''),
        lastName: String(customerInfo?.lastName || ''),
        email: String(customerInfo?.email || ''),
        phone: String(customerInfo?.phone || ''),
        address: {
          line1: String(customerInfo?.address?.line1 || ''),
          city: String(customerInfo?.address?.city || ''),
          postal_code: String(customerInfo?.address?.postal_code || ''),
          state: String(customerInfo?.address?.state || ''),
          country: String(customerInfo?.address?.country || 'US')
        }
      },
      cartItems: cleanedCartItems,
      total: parseFloat(total) || 0,
      paymentStatus: paymentStatus || 'paid',
      status: 'pending', // Estado inicial
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Solo agregar shippingInfo si existe
    if (cleanedShippingInfo) {
      orderData.shippingInfo = cleanedShippingInfo;
    }

    console.log('🔵 [Backend] Order data to save:', JSON.stringify(orderData, null, 2));

    console.log('🔵 [Backend] Guardando en Firestore...');
    const docRef = await addDoc(collection(db, 'orders'), orderData);
    
    console.log('✅ [Backend] Order created with ID:', docRef.id);
    
    // Retornar respuesta exitosa con más información
    res.json({ 
      success: true,
      orderId: docRef.id, 
      order: orderData,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('❌ [Backend] Error creating order:', error);
    console.error('❌ [Backend] Error message:', error.message);
    console.error('❌ [Backend] Error stack:', error.stack);
    console.error('❌ [Backend] Error details:', JSON.stringify(error, null, 2));
    
    // Determinar el tipo de error y responder apropiadamente
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error.code === 'permission-denied') {
      statusCode = 403;
      errorMessage = 'Permission denied - check Firebase rules';
    } else if (error.code === 'invalid-argument') {
      statusCode = 400;
      errorMessage = 'Invalid data format';
    } else if (error.code === 'unavailable') {
      statusCode = 503;
      errorMessage = 'Service temporarily unavailable';
    }
    
    res.status(statusCode).json({ 
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// 6. Actualizar orden
app.put('/api/update-order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const updateData = req.body;

    console.log('Updating order:', orderId);

    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      ...updateData,
      updatedAt: new Date(),
    });

    console.log('Order updated:', orderId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Obtener orden
app.get('/api/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (orderSnap.exists()) {
      res.json({ order: orderSnap.data() });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== HEALTH CHECK ====================

// Health check for Railway - must be very simple and fast
app.get('/health', (req, res) => {
  console.log('✅ Railway health check responded OK');
  res.status(200).send('OK');
});

app.get('/api/health', (req, res) => {
  console.log('🔍 Health check requested');
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ==================== STATIC FILES ====================

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

// Root endpoint for Railway healthcheck
app.get('/', (req, res) => {
  console.log('🔍 Root health check requested from:', req.get('host'));
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// ==================== TRANSLATE API (LibreTranslate Proxy) ====================

// Endpoint para traducir texto usando LibreTranslate
// Usa instancia propia si LIBRETRANSLATE_URL está configurada, sino usa la pública
app.post('/api/translate', async (req, res) => {
  try {
    const { q, source, target, format = 'text' } = req.body;

    if (!q || !source || !target) {
      return res.status(400).json({ 
        error: 'Missing required parameters: q, source, target' 
      });
    }

    // URL de LibreTranslate: usar instancia propia si está configurada, sino la pública
    const libretranslateUrl = process.env.LIBRETRANSLATE_URL || 'https://libretranslate.com';
    const translateEndpoint = `${libretranslateUrl}/translate`;

    console.log(`🌐 Traduciendo de ${source} a ${target} usando: ${libretranslateUrl}`);

    const response = await fetch(translateEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        q: q,
        source: source,
        target: target,
        format: format
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error de LibreTranslate (${response.status}):`, errorText);
      
      if (response.status === 429) {
        return res.status(429).json({ 
          error: 'Too many requests. Please wait a moment and try again.',
          code: 'RATE_LIMIT'
        });
      }
      
      return res.status(response.status).json({ 
        error: `Translation failed: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    
    if (data.translatedText) {
      console.log(`✅ Traducción exitosa: ${q.substring(0, 50)}... -> ${data.translatedText.substring(0, 50)}...`);
      return res.json({
        translatedText: data.translatedText
      });
    } else {
      return res.status(500).json({ 
        error: 'No translation returned from service' 
      });
    }
  } catch (error) {
    console.error('❌ Error en endpoint de traducción:', error);
    return res.status(500).json({ 
      error: 'Translation service error',
      message: error.message 
    });
  }
});

// ==================== BATCH PAGES TRANSLATION ====================
// POST /api/translate-pages
// Body: { pages: [ 'nosotros','terms','terms-service','faq','shipping','cookie-care' ], source: 'en', target: 'es' }
app.post('/api/translate-pages', async (req, res) => {
  try {
    const { pages = [], source = 'en', target = 'es' } = req.body || {};

    if (!Array.isArray(pages) || pages.length === 0) {
      return res.status(400).json({ error: 'pages array is required' });
    }

    const results = [];

    for (const pageId of pages) {
      try {
        const pageRef = doc(db, 'pages', pageId);
        const snap = await getDoc(pageRef);

        if (!snap.exists()) {
          results.push({ pageId, status: 'not_found' });
          continue;
        }

        const data = snap.data() || {};
        const originalTitle = data.title || '';
        const originalContent = data.content || '';

        // Traducir solo si hay texto
        const translateOne = async (q) => {
          if (!q || !q.trim()) return q;
          const resp = await fetch(`${process.env.FRONTEND_URL || ''}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q, source, target, format: 'text' })
          }).catch(async () => {
            // fallback a localhost si FRONTEND_URL no está disponible en local
            return await fetch(`http://localhost:${PORT}/api/translate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ q, source, target, format: 'text' })
            });
          });
          if (!resp || !resp.ok) {
            return q; // fallback: dejar original
          }
          const json = await resp.json();
          return json.translatedText || q;
        };

        const [translatedTitle, translatedContent] = await Promise.all([
          translateOne(originalTitle),
          translateOne(originalContent)
        ]);

        await updateDoc(pageRef, {
          title: translatedTitle || originalTitle,
          content: translatedContent || originalContent,
          updatedAt: new Date()
        });

        results.push({ pageId, status: 'ok' });
      } catch (e) {
        console.error('❌ Error translating page', pageId, e);
        results.push({ pageId, status: 'error', message: e.message });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('❌ translate-pages error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CATCH ALL HANDLER ====================
// Handle all non-API GET routes (React SPA fallback)
app.use((req, res, next) => {
  if (
    req.method === 'GET' &&
    !req.path.startsWith('/api') &&
    !req.path.startsWith('/health')
  ) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  } else {
    next();
  }
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ==================== START SERVER ====================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔥 Firebase connected to project: ${process.env.REACT_APP_FIREBASE_PROJECT_ID}`);
  console.log(`🔍 Health check available at: /health and /api/health`);
  console.log(`📁 Static files served from: ${path.join(__dirname, 'build')}`);
  console.log(`✅ Server is ready for Railway healthcheck`);
});

module.exports = app;
