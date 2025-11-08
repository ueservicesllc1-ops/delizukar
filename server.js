// Cargar variables de entorno - primero .env.local, luego .env
require('dotenv').config({ path: '.env.local' });
require('dotenv').config(); // .env como fallback
// Fallback para fetch en entornos Node que no lo traen nativo
// Evita crasheos del backend cuando se llama a Google Translate u otras APIs HTTP
if (typeof fetch === 'undefined') {
  global.fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
}
console.log('🔍 Environment variables loaded:');
console.log('SHIPPO_API_TOKEN:', process.env.SHIPPO_API_TOKEN ? 'SET' : 'NOT SET');
console.log('REACT_APP_SHIPPO_API_TOKEN:', process.env.REACT_APP_SHIPPO_API_TOKEN ? 'SET' : 'NOT SET');
console.log('DEFAULT_SHIPPO_TOKEN:', process.env.DEFAULT_SHIPPO_TOKEN ? 'SET' : 'NOT SET');

const DEFAULT_SHIPPO_TOKEN = process.env.DEFAULT_SHIPPO_TOKEN || '';

const resolveShippoToken = () =>
  process.env.SHIPPO_API_TOKEN ||
  process.env.REACT_APP_SHIPPO_API_TOKEN ||
  DEFAULT_SHIPPO_TOKEN ||
  '';

// Importar Shippo (nueva API v2)
// Token debe estar en .env como SHIPPO_API_TOKEN o REACT_APP_SHIPPO_API_TOKEN
const shippoToken = resolveShippoToken();

// Nueva API de Shippo v2: usar new Shippo.Shippo({ apiKeyHeader })
const shippoModule = require('shippo');
let shippo = null;
if (shippoToken) {
  try {
    shippo = new shippoModule.Shippo({ apiKeyHeader: shippoToken });
    console.log('✅ Shippo client initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Shippo client:', error.message);
  }
} else {
  console.error('❌ Shippo token not configured. Shippo API calls will fail until a token is provided.');
}

console.log('🔑 Shippo token configured:', shippoToken ? `${shippoToken.substring(0, 20)}...` : 'NOT SET');
console.log('🔑 Shippo mode:', shippoToken?.startsWith('shippo_live_') ? 'PRODUCTION' : shippoToken?.startsWith('shippo_test_') ? 'TEST' : 'UNKNOWN');

const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, getDoc, updateDoc, query, orderBy } = require('firebase/firestore');

const app = express();
// En Railway usa PORT de la variable de entorno (Railway la configura automáticamente)
// En desarrollo local usa 5000 (puerto estándar)
const PORT = process.env.PORT || 5000;
// Fallback (no recomendado en producción): clave embebida si no hay .env ni header/body
const FALLBACK_GOOGLE_API_KEY = 'AIzaSyCvUYONprzgPBjEHXp6bEJ7mRfW0GSl54w';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

console.log('🔥 Firebase Configuration:');
console.log('   Project ID:', firebaseConfig.projectId || 'NOT SET');
console.log('   API Key:', firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 20) + '...' : 'NOT SET');
console.log('   Auth Domain:', firebaseConfig.authDomain || 'NOT SET');

if (!firebaseConfig.projectId) {
  console.error('❌ ERROR: REACT_APP_FIREBASE_PROJECT_ID no está configurado');
  console.error('   Las órdenes NO se podrán guardar en Firestore');
}

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
console.log('✅ Firebase inicializado correctamente');

// Enhanced middleware with security best practices
app.use(cors({
  origin: (origin, callback) => {
    // Permitir cualquier origen en desarrollo/local
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
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

// ==================== GOOGLE TRANSLATE PROXY (v2) - PORT 5050 ====================
// Servidor ligero separado en puerto 5050 solo para traducción
const translateServer = express();
translateServer.use(express.json());
translateServer.use(cors({ origin: (o, cb) => cb(null, true) }));

const handleGoogleTranslate = async (req, res) => {
  try {
    const body = req.body || {};
    const qRaw = body.q ?? body.text;
    const target = body.target ?? body.targetLanguage ?? 'en';
    const source = body.source;

    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY 
      || req.get('x-google-api-key') 
      || body.apiKey 
      || process.env.GOOGLE_API_KEY
      || FALLBACK_GOOGLE_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'Missing Google Translate API key' });
    if (!qRaw || !target) return res.status(400).json({ error: 'Missing q/text or target/targetLanguage' });

    const endpoint = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    const payload = { q: Array.isArray(qRaw) ? qRaw : [qRaw], target, format: 'text' };
    if (source) payload.source = source;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: json.error?.message || 'Translation failed' });

    const translations = (json.data?.translations || []).map(t => t.translatedText);
    const result = Array.isArray(qRaw) ? translations : (translations[0] || String(qRaw));
    return res.json({ translated: result });
  } catch (e) {
    console.error('❌ Google translate proxy error:', e);
    return res.status(500).json({ error: 'Google translate proxy error', message: e.message });
  }
};

translateServer.post('/api/translate-google', handleGoogleTranslate);
translateServer.listen(5050, '0.0.0.0', () => {
  console.log('🌐 Translate server running on port 5050');
});

// Also expose translate endpoint on main server port (useful in production where port 5050 may not be accessible)
app.post('/api/translate-google', handleGoogleTranslate);

// ==================== GOOGLE TRANSLATE PROXY (v2) ====================
// POST /api/translate-google { q: string|string[], target: 'en', source?: 'es' }
// Traducción eliminada

// (Traducción eliminada)

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

// ==================== SHIPPO ENDPOINTS ====================

// 1. Crear dirección en Shippo (con validación automática)
app.post('/api/shippo/create-address', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Creating address in Shippo');
    console.log('🔍 DEBUG: Request body:', JSON.stringify(req.body, null, 2));
    
    const apiToken = resolveShippoToken();
    
    if (!apiToken) {
      return res.status(500).json({ error: 'SHIPPO_API_TOKEN no está configurada' });
    }

    // Inicializar Shippo si no está inicializado
    let shippoClient = shippo;
    if (!shippoClient) {
      shippoClient = new shippoModule.Shippo({ apiKeyHeader: apiToken });
    }

    // Según la documentación oficial, usar street1, city, state, zip, country
    const addressData = {
      name: req.body.name || '',
      organization: req.body.organization || req.body.company || '',
      street1: req.body.street1 || req.body.address_line_1 || req.body.line1 || '',
      street2: req.body.street2 || req.body.address_line_2 || req.body.line2 || '',
      city: req.body.city || req.body.city_locality || '',
      state: req.body.state || req.body.state_province || '',
      zip: req.body.zip || req.body.postal_code || req.body.zipCode || '',
      country: req.body.country || req.body.country_code || 'US',
      phone: req.body.phone || '',
      email: req.body.email || '',
      is_residential: req.body.is_residential !== false && req.body.address_type !== 'commercial'
    };

    const address = await shippoClient.addresses.create(addressData);
    
    // API v2 estructura: address.id y address.address para los campos
    const addressId = address.id || address.objectId || address.object_id;
    const addrFields = address.address || address;
    const validationResult = address.validation_result || address.validation_results || address.validationResult;
    
    console.log('✅ Shippo address created:', addressId);
    console.log('📋 Validation results:', validationResult);
    
    // Si hay correcciones sugeridas, incluirlas en la respuesta
    const response = {
      object_id: addressId, // Compatibilidad
      objectId: addressId,
      id: addressId,
      ...address,
      validation_results: validationResult || null,
      validationResults: validationResult || null,
      is_valid: validationResult?.is_valid !== false,
      isValid: validationResult?.is_valid !== false,
      corrections_suggested: validationResult?.messages || validationResult?.reasons || []
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ Shippo address error:', error);
    res.status(500).json({ error: error.message || 'Error creating address in Shippo' });
  }
});

// 1b. Validar dirección en Shippo (endpoint específico para validación)
app.post('/api/shippo/validate-address', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Validating address in Shippo');
    console.log('🔍 DEBUG: Request body:', JSON.stringify(req.body, null, 2));
    
    const apiToken = resolveShippoToken();
    
    if (!apiToken) {
      return res.status(500).json({ error: 'SHIPPO_API_TOKEN no está configurada' });
    }

    // Inicializar Shippo si no está inicializado
    let shippoClient = shippo;
    if (!shippoClient) {
      shippoClient = new shippoModule.Shippo({ apiKeyHeader: apiToken });
    }

    // Según la documentación oficial, usar street1, city, state, zip, country
    // Asegurar que country siempre tenga un valor (requerido por Shippo)
    const addressData = {
      name: req.body.name || '',
      organization: req.body.organization || req.body.company || '',
      street1: req.body.street1 || req.body.address_line_1 || req.body.line1 || '',
      street2: req.body.street2 || req.body.address_line_2 || req.body.line2 || '',
      city: req.body.city || req.body.city_locality || '',
      state: req.body.state || req.body.state_province || '',
      zip: req.body.zip || req.body.postal_code || req.body.zipCode || '',
      country: req.body.country || req.body.country_code || 'US',  // Siempre asegurar valor por defecto
      phone: req.body.phone || '',
      email: req.body.email || '',
      is_residential: req.body.is_residential !== false && req.body.address_type !== 'commercial'
    };
    
    // Validar que country no esté vacío
    if (!addressData.country || addressData.country.trim() === '') {
      addressData.country = 'US';
      console.warn('⚠️ Country no proporcionado, usando US por defecto');
    }
    
    console.log('📤 Datos de dirección para validar:', JSON.stringify(addressData, null, 2));

    // Crear dirección - API v2 valida automáticamente
    const address = await shippoClient.addresses.create(addressData);
    
    // API v2 estructura: address.id y address.address para los campos
    const addressId = address.id || address.objectId || address.object_id;
    const addrFields = address.address || address;
    
    console.log('✅ Address validated:', addressId);
    
    // Validar resultados - API v2 puede tener validation_result o validation_results
    const validationResult = address.validation_result || address.validation_results || address.validationResult;
    const isValid = validationResult?.is_valid !== false;
    
    console.log('📋 Validation status:', isValid ? 'VALID' : 'INVALID');
    
    // Preparar respuesta con información de validación (compatibilidad con frontend)
    const validationResponse = {
      object_id: addressId, // Compatibilidad
      objectId: addressId,
      id: addressId,
      is_valid: isValid,
      isValid: isValid,
      original_address: {
        street1: req.body.street1 || req.body.address_line_1,
        city: req.body.city || req.body.city_locality,
        state: req.body.state || req.body.state_province,
        zip: req.body.zip || req.body.postal_code,
        country: req.body.country || req.body.country_code || 'US'
      },
      validated_address: {
        street1: addrFields.street1 || addrFields.address_line_1,
        street2: addrFields.street2 || addrFields.address_line_2,
        city: addrFields.city || addrFields.city_locality,
        state: addrFields.state || addrFields.state_province,
        zip: addrFields.zip || addrFields.postal_code,
        country: addrFields.country || addrFields.country_code || 'US'
      },
      validation_messages: validationResult?.messages || validationResult?.reasons || [],
      corrections: validationResult?.messages?.filter(m => m.source === 'shippo') || []
    };
    
    // Si la dirección fue corregida, indicarlo
    const originalLine1 = req.body.street1 || req.body.address_line_1 || req.body.line1;
    const validatedLine1 = addrFields.street1 || addrFields.address_line_1;
    if (validatedLine1 && originalLine1 && validatedLine1 !== originalLine1) {
      validationResponse.was_corrected = true;
      console.log('📝 Address was corrected by Shippo');
    }
    
    res.json(validationResponse);
  } catch (error) {
    console.error('❌ Shippo validation error:', error);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    console.error('   Request body:', JSON.stringify(req.body, null, 2));
    
    // Mejorar mensaje de error para el frontend
    let errorMessage = 'Error al validar la dirección en Shippo';
    if (error.message) {
      errorMessage = error.message;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: error.message || 'Error desconocido al validar la dirección',
      requestData: req.body
    });
  }
});

// 2. Crear shipment y obtener rates
app.post('/api/shippo/shipments', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Creating shipment in Shippo');
    console.log('🔍 DEBUG: Request body:', JSON.stringify(req.body, null, 2));
    
    const apiToken = resolveShippoToken();
    
    if (!apiToken) {
      return res.status(500).json({ error: 'SHIPPO_API_TOKEN no está configurada' });
    }

    const { address_from, address_to, parcels, async } = req.body;
    
    console.log('🔍 DEBUG: address_from:', JSON.stringify(address_from, null, 2));
    console.log('🔍 DEBUG: address_to:', JSON.stringify(address_to, null, 2));
    console.log('🔍 DEBUG: parcels:', JSON.stringify(parcels, null, 2));
    
    if (!address_from || !address_to || !parcels || !Array.isArray(parcels) || parcels.length === 0) {
      console.error('❌ Datos inválidos recibidos:', { address_from: !!address_from, address_to: !!address_to, parcels: !!parcels });
      return res.status(400).json({ error: 'Datos inválidos: se requieren address_from, address_to y parcels' });
    }

    // Crear direcciones si no tienen object_id (no están creadas en Shippo)
    let fromAddressId = address_from.object_id || address_from.objectId;
    let toAddressId = address_to.object_id || address_to.objectId;

    // Inicializar Shippo si no está inicializado
    let shippoClient = shippo;
    if (!shippoClient) {
      shippoClient = new shippoModule.Shippo({ apiKeyHeader: apiToken });
    }

    if (!fromAddressId) {
      console.log('📝 Creando dirección origen en Shippo...');
      try {
        // Según la documentación oficial de Shippo, el SDK acepta los mismos campos que la API REST
        // Usar street1, city, state, zip, country (no address_line_1, city_locality, etc.)
        const fromAddrData = {
          name: address_from.name || 'Delizukar',
          street1: address_from.street1 || address_from.address_line_1 || address_from.line1 || '',
          street2: address_from.street2 || address_from.address_line_2 || address_from.line2 || '',
          city: address_from.city || address_from.city_locality || '',
          state: address_from.state || address_from.state_province || '',
          zip: address_from.zip || address_from.postal_code || address_from.zipCode || '',
          country: address_from.country || address_from.country_code || 'US',
          phone: address_from.phone || '',
          email: address_from.email || 'support@delizukar.com',
          is_residential: address_from.is_residential !== false && address_from.address_type !== 'commercial'
        };
        
        console.log('📤 Datos dirección origen:', JSON.stringify(fromAddrData, null, 2));
        const fromAddr = await shippoClient.addresses.create(fromAddrData);
        
        // El SDK puede devolver 'id', 'objectId' o 'object_id'
        fromAddressId = fromAddr.id || fromAddr.objectId || fromAddr.object_id;
        console.log('✅ Dirección origen creada:', fromAddressId);
        console.log('📋 Respuesta completa dirección origen:', JSON.stringify(fromAddr, null, 2));
        
        // Validar que tenemos un ID válido
        if (!fromAddressId) {
          throw new Error('No se obtuvo un ID válido de la dirección origen');
        }
      } catch (error) {
        console.error('❌ Error creando dirección origen:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        if (error.response) {
          console.error('❌ Response data:', JSON.stringify(error.response.data, null, 2));
        }
        return res.status(500).json({ 
          error: 'Error creando dirección origen', 
          details: error.message || error
        });
      }
    }

    if (!toAddressId) {
      console.log('📝 Creando dirección destino en Shippo...');
      try {
        // Según la documentación oficial de Shippo, el SDK acepta los mismos campos que la API REST
        // Usar street1, city, state, zip, country (no address_line_1, city_locality, etc.)
        const toAddrData = {
          name: address_to.name || '',
          street1: address_to.street1 || address_to.address_line_1 || address_to.line1 || '',
          street2: address_to.street2 || address_to.address_line_2 || address_to.line2 || '',
          city: address_to.city || address_to.city_locality || '',
          state: address_to.state || address_to.state_province || '',
          zip: address_to.zip || address_to.postal_code || address_to.zipCode || '',
          country: address_to.country || address_to.country_code || 'US',
          phone: address_to.phone || '',
          email: address_to.email || '',
          is_residential: address_to.is_residential !== false && address_to.address_type !== 'commercial'
        };
        
        console.log('📤 Datos dirección destino:', JSON.stringify(toAddrData, null, 2));
        const toAddr = await shippoClient.addresses.create(toAddrData);
        
        // El SDK puede devolver 'id', 'objectId' o 'object_id'
        toAddressId = toAddr.id || toAddr.objectId || toAddr.object_id;
        console.log('✅ Dirección destino creada:', toAddressId);
        console.log('📋 Respuesta completa dirección destino:', JSON.stringify(toAddr, null, 2));
        
        // Validar que tenemos un ID válido
        if (!toAddressId) {
          throw new Error('No se obtuvo un ID válido de la dirección destino');
        }
      } catch (error) {
        console.error('❌ Error creando dirección destino:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        if (error.response) {
          console.error('❌ Response data:', JSON.stringify(error.response.data, null, 2));
        }
        return res.status(500).json({ 
          error: 'Error creando dirección destino', 
          details: error.message || error
        });
      }
    }

    // Validar que tenemos IDs de direcciones
    if (!fromAddressId || !toAddressId) {
      console.error('❌ No se pudieron obtener IDs de direcciones:', { fromAddressId, toAddressId });
      return res.status(500).json({ 
        error: 'No se pudieron crear las direcciones en Shippo' 
      });
    }

    // Preparar parcels - Validar y formatear correctamente
    const shippoParcels = parcels.map((parcel, index) => {
      // Extraer y validar valores numéricos
      let length = parcel.length || '5';
      let width = parcel.width || '5';
      let height = parcel.height || '5';
      let weight = parcel.weight || '1';
      let distanceUnit = parcel.distanceUnit || parcel.distance_unit || 'in';
      let massUnit = parcel.massUnit || parcel.mass_unit || 'lb';
      
      // Convertir a string y validar que sean números válidos
      length = String(length).trim();
      width = String(width).trim();
      height = String(height).trim();
      weight = String(weight).trim();
      
      // Validar que los valores sean números válidos
      if (isNaN(parseFloat(length)) || parseFloat(length) <= 0) {
        console.warn(`⚠️ Parcel ${index}: length inválido (${length}), usando 5`);
        length = '5';
      }
      if (isNaN(parseFloat(width)) || parseFloat(width) <= 0) {
        console.warn(`⚠️ Parcel ${index}: width inválido (${width}), usando 5`);
        width = '5';
      }
      if (isNaN(parseFloat(height)) || parseFloat(height) <= 0) {
        console.warn(`⚠️ Parcel ${index}: height inválido (${height}), usando 5`);
        height = '5';
      }
      if (isNaN(parseFloat(weight)) || parseFloat(weight) <= 0) {
        console.warn(`⚠️ Parcel ${index}: weight inválido (${weight}), usando 1`);
        weight = '1';
      }
      
      // Validar unidades - asegurar valores válidos
      const validMassUnits = ['lb', 'oz', 'kg', 'g'];
      if (!validMassUnits.includes(massUnit)) {
        console.warn(`⚠️ Parcel ${index}: massUnit inválido (${massUnit}), usando lb`);
        massUnit = 'lb';
      }
      
      const validDistanceUnits = ['in', 'ft', 'cm', 'm', 'mm', 'yd'];
      if (!validDistanceUnits.includes(distanceUnit)) {
        console.warn(`⚠️ Parcel ${index}: distanceUnit inválido (${distanceUnit}), usando in`);
        distanceUnit = 'in';
      }
      
      // Formato intermedio para validación (guardamos en camelCase internamente)
      const formattedParcel = {
        length: length,
        width: width,
        height: height,
        distanceUnit: distanceUnit,
        weight: weight,
        massUnit: massUnit
      };
      
      console.log(`✅ Parcel ${index} formateado:`, JSON.stringify(formattedParcel, null, 2));
      console.log(`   📦 Datos del paquete ${index}:`);
      console.log(`      - Peso: ${weight} ${massUnit}`);
      console.log(`      - Dimensiones: ${length}" x ${width}" x ${height}" (${distanceUnit})`);
      return formattedParcel;
    });

    // Validar que tenemos todo lo necesario
    if (!fromAddressId || !toAddressId) {
      console.error('❌ Faltan IDs de direcciones:', { fromAddressId, toAddressId });
      return res.status(500).json({ 
        error: 'No se pudieron crear las direcciones necesarias' 
      });
    }
    
    if (!shippoParcels || shippoParcels.length === 0) {
      console.error('❌ No hay parcels válidos');
      return res.status(400).json({ 
        error: 'No hay paquetes válidos para el envío' 
      });
    }
    
    // Verificar que tenemos los IDs válidos
    console.log('🔍 IDs de direcciones:', { fromAddressId, toAddressId });
    console.log('🔍 Tipos de IDs:', { 
      fromType: typeof fromAddressId, 
      toType: typeof toAddressId,
      fromValid: !!fromAddressId && fromAddressId !== 'undefined',
      toValid: !!toAddressId && toAddressId !== 'undefined'
    });
    
    // Validar que los IDs existen y no son undefined/null
    if (!fromAddressId || fromAddressId === 'undefined' || fromAddressId === 'null') {
      console.error('❌ fromAddressId inválido:', fromAddressId);
      return res.status(500).json({ 
        error: 'Dirección de origen no válida. No se pudo crear la dirección en Shippo.' 
      });
    }
    
    if (!toAddressId || toAddressId === 'undefined' || toAddressId === 'null') {
      console.error('❌ toAddressId inválido:', toAddressId);
      return res.status(500).json({ 
        error: 'Dirección de destino no válida. No se pudo crear la dirección en Shippo.' 
      });
    }
    
    // Preparar parcels con formato correcto - El SDK de Shippo v2 espera camelCase
    // Shippo requiere que el peso tenga máximo 10 dígitos en total
    const formattedParcels = shippoParcels.map((p, index) => {
      // Función helper para formatear números con máximo 10 dígitos
      const formatNumber = (value, fieldName, defaultValue) => {
        let numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) {
          console.warn(`⚠️ Parcel ${index}: ${fieldName} inválido (${value}), usando ${defaultValue}`);
          numValue = defaultValue;
        }
        
        // Para peso, asegurar máximo 10 dígitos en total (incluyendo decimales)
        if (fieldName === 'weight') {
          // Redondear a máximo 4 decimales
          numValue = Math.round(numValue * 10000) / 10000;
          
          // Convertir a string y validar que no exceda 10 dígitos
          let weightStr = numValue.toString();
          
          // Si tiene punto decimal, contar todos los dígitos
          if (weightStr.includes('.')) {
            const digitsOnly = weightStr.replace('.', '');
            if (digitsOnly.length > 10) {
              // Reducir decimales hasta que tenga máximo 10 dígitos
              let decimals = 4;
              while (digitsOnly.length > 10 && decimals > 0) {
                decimals--;
                numValue = Math.round(numValue * Math.pow(10, decimals)) / Math.pow(10, decimals);
                weightStr = numValue.toString();
              }
              console.warn(`⚠️ Parcel ${index}: weight tiene más de 10 dígitos, redondeado a ${weightStr}`);
            }
          } else {
            // Sin decimales, verificar que no exceda 10 dígitos
            if (weightStr.length > 10) {
              weightStr = weightStr.substring(0, 10);
              numValue = parseFloat(weightStr);
              console.warn(`⚠️ Parcel ${index}: weight truncado a ${weightStr} (máximo 10 dígitos)`);
            }
          }
          
          return weightStr;
        }
        
        // Para dimensiones, redondear a máximo 2 decimales y convertir a string
        numValue = Math.round(numValue * 100) / 100;
        return numValue.toString();
      };
      
      const parcel = {
        length: formatNumber(p.length, 'length', 5),
        width: formatNumber(p.width, 'width', 5),
        height: formatNumber(p.height, 'height', 5),
        distanceUnit: String(p.distanceUnit || p.distance_unit || 'in'),  // camelCase para SDK
        weight: formatNumber(p.weight, 'weight', 1),  // Formateado con máximo 10 dígitos
        massUnit: String(p.massUnit || p.mass_unit || 'lb')  // camelCase para SDK
      };
      
      // Validar unidades
      const validMassUnits = ['lb', 'oz', 'kg', 'g'];
      if (!validMassUnits.includes(parcel.massUnit)) {
        console.warn(`⚠️ Parcel ${index}: massUnit inválido (${parcel.massUnit}), usando lb`);
        parcel.massUnit = 'lb';
      }
      
      const validDistanceUnits = ['in', 'ft', 'cm', 'm', 'mm', 'yd'];
      if (!validDistanceUnits.includes(parcel.distanceUnit)) {
        console.warn(`⚠️ Parcel ${index}: distanceUnit inválido (${parcel.distanceUnit}), usando in`);
        parcel.distanceUnit = 'in';
      }
      
      // Validación final: verificar que el peso no exceda 10 dígitos
      const weightDigits = parcel.weight.replace('.', '').length;
      if (weightDigits > 10) {
        console.error(`❌ Parcel ${index}: weight aún tiene ${weightDigits} dígitos después del formateo`);
        // Forzar a 10 dígitos máximo
        const numWeight = parseFloat(parcel.weight);
        parcel.weight = numWeight.toFixed(Math.max(0, 10 - Math.floor(numWeight).toString().length));
      }
      
      console.log(`✅ Parcel ${index} validado:`, JSON.stringify(parcel, null, 2));
      console.log(`   - Weight digits count: ${parcel.weight.replace('.', '').length}`);
      return parcel;
    });
    
    // El SDK de Shippo Node.js v2 espera camelCase (addressFrom, addressTo, massUnit, distanceUnit)
    const shipmentData = {
      addressFrom: String(fromAddressId).trim(),  // camelCase para SDK
      addressTo: String(toAddressId).trim(),      // camelCase para SDK
      parcels: formattedParcels,
      async: async !== undefined ? async : false
    };
    
    console.log('📝 Validación final antes de enviar a Shippo (camelCase para SDK):');
    console.log('   - addressFrom:', shipmentData.addressFrom, '(tipo:', typeof shipmentData.addressFrom, ')');
    console.log('   - addressTo:', shipmentData.addressTo, '(tipo:', typeof shipmentData.addressTo, ')');
    console.log('   ⚠️ VERIFICA ESTOS DATOS DEL PAQUETE (para calcular tarifas):');
    shipmentData.parcels.forEach((parcel, idx) => {
      console.log(`      Paquete ${idx + 1}:`);
      console.log(`         - Peso: ${parcel.weight} ${parcel.massUnit}`);
      console.log(`         - Dimensiones: ${parcel.length}" x ${parcel.width}" x ${parcel.height}"`);
      console.log(`         - Estas son las dimensiones y peso que Shippo usará para calcular las tarifas`);
    });
    console.log('   - parcels count:', shipmentData.parcels.length);
    console.log('   - async:', shipmentData.async);
    console.log('   - Primer parcel:', JSON.stringify(shipmentData.parcels[0], null, 2));
    
    console.log('📦 Shipment data completo para Shippo SDK:', JSON.stringify(shipmentData, null, 2));

    try {
      console.log('🚀 Llamando a shippoClient.shipments.create...');
      console.log('📦 [Shipment Creation] Datos EXACTOS enviados a Shippo:');
      console.log('   Parcels:', JSON.stringify(shipmentData.parcels, null, 2));
      console.log('   Address From:', JSON.stringify(shipmentData.addressFrom, null, 2));
      console.log('   Address To:', JSON.stringify(shipmentData.addressTo, null, 2));
      
      const shipment = await shippoClient.shipments.create(shipmentData);
      
      const shipmentId = shipment.id || shipment.objectId || shipment.object_id;
      console.log('✅ Shippo shipment created:', shipmentId);
      console.log('📦 Rates available:', shipment.rates ? shipment.rates.length : 0);
      
      // Obtener userSelectedAmount del body si existe (opcional, solo para logging)
      // Este endpoint se usa durante el checkout, donde aún no hay un rate seleccionado
      const userSelectedAmount = req.body?.userSelectedAmount || req.body?.shippingInfo?.cost || req.body?.shippingInfo?.amount || null;
      
      // Si hay rates, loggear información detallada
      if (shipment.rates && shipment.rates.length > 0) {
        console.log('📋 [Rates] Shipping options recibidos de Shippo (NUEVOS rates calculados):');
        console.log('   ⚠️ Estos rates son NUEVOS - Shippo los calculó con los datos del paquete actuales');
        console.log('   ⚠️ Si estos datos son diferentes a los del checkout, los precios serán diferentes');
        console.log('');
        shipment.rates.forEach((rate, index) => {
          const rateId = rate.id || rate.objectId || rate.object_id;
          const carrier = rate.provider || rate.carrier;
          const service = rate.servicelevel?.name || rate.service;
          const amount = rate.amount_local || rate.amount;
          const expectedAmount = userSelectedAmount ? parseFloat(userSelectedAmount) : null;
          const match = expectedAmount && Math.abs(parseFloat(amount) - expectedAmount) < 0.01 ? '✅ MATCH CON PRECIO ESPERADO' : '';
          console.log(`   ${index + 1}. ID: ${rateId}`);
          console.log(`      Carrier: ${carrier}`);
          console.log(`      Service: ${service}`);
          console.log(`      Amount: $${amount} ${match}`);
          if (expectedAmount && !match) {
            const diff = Math.abs(parseFloat(amount) - expectedAmount);
            console.log(`      Diferencia con precio esperado ($${expectedAmount.toFixed(2)}): $${diff.toFixed(2)}`);
          }
          console.log(`      ServiceLevel Token: ${rate.servicelevel?.token || rate.servicelevel_token || 'N/A'}`);
          console.log('');
        });
        console.log('💰 [Comparación] Precio esperado (del checkout):', userSelectedAmount || 'N/A');
        console.log('💰 [Comparación] Si no hay un rate que coincida exactamente, se mostrará un error');
      } else {
        console.warn('⚠️ No shipping rates available for this shipment');
      }
      
      // Asegurar que la respuesta incluya todas las opciones de envío
      // Asegurar que los rates usen IDs correctos
      const rates = (shipment.rates || []).map(rate => ({
        ...rate,
        object_id: rate.id || rate.objectId || rate.object_id,
        objectId: rate.id || rate.objectId || rate.object_id
      }));
      
      const response = {
        ...shipment,
        object_id: shipmentId,
        objectId: shipmentId,
        rates: rates,
        rates_count: rates.length
      };
      
      res.json(response);
    } catch (error) {
      console.error('❌ Shippo shipment error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      res.status(500).json({ 
        error: error.message || 'Error creating shipment in Shippo',
        details: error.response?.data || error
      });
    }
  } catch (error) {
    console.error('❌ Error general en endpoint:', error);
    res.status(500).json({ 
      error: error.message || 'Error processing request',
      details: error
    });
  }
});

// 3. Obtener rates de un shipment existente
app.get('/api/shippo/shipments/:shipmentId/rates', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Getting rates for shipment:', req.params.shipmentId);
    
    const apiToken = resolveShippoToken();
    
    if (!apiToken) {
      return res.status(500).json({ error: 'SHIPPO_API_TOKEN no está configurada' });
    }

    // Inicializar Shippo si no está inicializado
    let shippoClient = shippo;
    if (!shippoClient) {
      shippoClient = new shippoModule.Shippo({ apiKeyHeader: apiToken });
    }

    const shipment = await shippoClient.shipments.get(req.params.shipmentId);
    
    if (!shipment.rates || shipment.rates.length === 0) {
      return res.status(404).json({ error: 'No rates found for this shipment' });
    }
    
    res.json({ rates: shipment.rates });
  } catch (error) {
    console.error('❌ Shippo rates error:', error);
    res.status(500).json({ error: error.message || 'Error retrieving rates' });
  }
});

// 4. Crear transaction (comprar etiqueta)
app.post('/api/shippo/transactions', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Creating transaction in Shippo');
    console.log('🔍 DEBUG: Request body:', JSON.stringify(req.body, null, 2));
    
    const apiToken = resolveShippoToken();
    
    if (!apiToken) {
      return res.status(500).json({ error: 'SHIPPO_API_TOKEN no está configurada' });
    }

    const { rate } = req.body;
    
    if (!rate) {
      return res.status(400).json({ error: 'Rate ID is required' });
    }

    // rate puede ser un object_id o un objeto rate completo
    const rateId = typeof rate === 'string' ? rate : rate.object_id;
    
    // Inicializar Shippo si no está inicializado
    let shippoClient = shippo;
    if (!shippoClient) {
      shippoClient = new shippoModule.Shippo({ apiKeyHeader: apiToken });
    }
    
    const transaction = await shippoClient.transactions.create({
      rate: rateId,
      async: false
    });
    
    console.log('✅ Shippo transaction created:', transaction.objectId);
    console.log('📦 Tracking number:', transaction.tracking_number);
    
    res.json(transaction);
  } catch (error) {
    console.error('❌ Shippo transaction error:', error);
    res.status(500).json({ error: error.message || 'Error creating transaction in Shippo' });
  }
});

// 5. Crear etiqueta con una sola llamada (instant transaction)
app.post('/api/shippo/transactions/instant', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Creating instant transaction in Shippo');
    console.log('🔍 DEBUG: Request body:', JSON.stringify(req.body, null, 2));
    
    const apiToken = resolveShippoToken();
    
    if (!apiToken) {
      return res.status(500).json({ error: 'SHIPPO_API_TOKEN no está configurada' });
    }

    const { shipment, carrier_account, servicelevel_token } = req.body;
    
    if (!shipment || !carrier_account || !servicelevel_token) {
      return res.status(400).json({ 
        error: 'Se requieren shipment, carrier_account y servicelevel_token' 
      });
    }

    // Crear direcciones si no tienen object_id
    let fromAddressId = shipment.address_from?.object_id;
    let toAddressId = shipment.address_to?.object_id;

    // Inicializar Shippo si no está inicializado
    let shippoClient = shippo;
    if (!shippoClient) {
      shippoClient = new shippoModule.Shippo({ apiKeyHeader: apiToken });
    }

    if (!fromAddressId && shipment.address_from) {
      const fromAddr = await shippoClient.addresses.create(shipment.address_from);
      fromAddressId = fromAddr.objectId;
    }

    if (!toAddressId && shipment.address_to) {
      const toAddr = await shippoClient.addresses.create(shipment.address_to);
      toAddressId = toAddr.objectId;
    }

    // Crear shipment si no tiene object_id - v2 API usa camelCase
    let shipmentId = shipment.object_id || shipment.objectId;
    if (!shipmentId) {
      // Convertir parcels a formato camelCase si es necesario
      const formattedParcels = (shipment.parcels || []).map(parcel => {
        if (parcel.distance_unit || parcel.mass_unit) {
          return {
            length: parcel.length,
            width: parcel.width,
            height: parcel.height,
            distanceUnit: parcel.distanceUnit || parcel.distance_unit || 'in',
            weight: parcel.weight,
            massUnit: parcel.massUnit || parcel.mass_unit || 'lb'
          };
        }
        return parcel;
      });
      
      const shipmentData = {
        addressFrom: fromAddressId || shipment.addressFrom || shipment.address_from,
        addressTo: toAddressId || shipment.addressTo || shipment.address_to,
        parcels: formattedParcels
      };
      const createdShipment = await shippoClient.shipments.create(shipmentData);
      shipmentId = createdShipment.objectId;
    }

    // Crear transaction instantánea
    const transaction = await shippoClient.transactions.create({
      shipment: shipmentId,
      carrier_account: carrier_account,
      servicelevel_token: servicelevel_token,
      async: false
    });
    
    console.log('✅ Shippo instant transaction created:', transaction.object_id);
    console.log('📦 Tracking number:', transaction.tracking_number);
    
    res.json(transaction);
  } catch (error) {
    console.error('❌ Shippo instant transaction error:', error);
    res.status(500).json({ error: error.message || 'Error creating instant transaction in Shippo' });
  }
});

// 6. Obtener información de cuenta de Shippo
app.get('/api/shippo/account', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Getting Shippo account info');
    
    const apiToken = resolveShippoToken();
    
    if (!apiToken) {
      return res.status(500).json({ error: 'SHIPPO_API_TOKEN no está configurada' });
    }

    // Inicializar Shippo si no está inicializado
    let shippoClient = shippo;
    if (!shippoClient) {
      shippoClient = new shippoModule.Shippo({ apiKeyHeader: apiToken });
    }

    // Verificar la conexión creando una dirección de prueba válida
    // Usar los campos según la documentación oficial: street1, city, state, zip, country
    const testAddress = await shippoClient.addresses.create({
      name: 'Connection Test',
      street1: '215 Clayton St.',
      city: 'San Francisco',
      state: 'CA',
      zip: '94117',
      country: 'US',
      phone: '+1 555 341 9393',
      email: 'test@delizukar.com',
      is_residential: true
    });
    
    // El SDK puede devolver 'id', 'objectId' o 'object_id'
    const addressId = testAddress.id || testAddress.objectId || testAddress.object_id;
    
    res.json({ 
      status: 'connected',
      mode: apiToken.startsWith('shippo_test_') ? 'TEST' : apiToken.startsWith('shippo_live_') ? 'PRODUCTION' : 'UNKNOWN',
      token_preview: apiToken.substring(0, 20) + '...',
      test_address_id: addressId,
      message: 'Shippo API connection successful'
    });
  } catch (error) {
    console.error('❌ Shippo account error:', error);
    res.status(500).json({ 
      error: error.message || 'Error connecting to Shippo API',
      details: error.response?.data || error
    });
  }
});

// 7. Generar JWT para Shippo Shipping Elements (widget embebido)
app.post('/api/shippo/elements/authz', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Generating JWT for Shippo Shipping Elements');
    
    const apiToken = resolveShippoToken();
    
    if (!apiToken) {
      return res.status(500).json({ error: 'SHIPPO_API_TOKEN no está configurada' });
    }

    // Generar JWT usando el endpoint de autorización de Shippo
    // Según la documentación: https://docs.goshippo.com/docs/shippingelements/quickstart/
    const response = await fetch('https://api.goshippo.com/embedded/authz/', {
      method: 'POST',
      headers: {
        'Authorization': `ShippoToken ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        scope: 'embedded:carriers'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error generating JWT:', response.status, errorText);
      throw new Error(`Error generating JWT: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ JWT generated successfully for Shipping Elements');
    
    // El JWT expira después de 12 horas según la documentación
    // https://docs.goshippo.com/docs/shippingelements/auth/
    res.json({ 
      jwt: data.token || data.jwt,
      expires_in: data.expires_in || 43200 // 12 horas en segundos
    });
  } catch (error) {
    console.error('❌ Shippo Elements authz error:', error);
    res.status(500).json({ error: error.message || 'Error generating JWT for Shipping Elements' });
  }
});

// ==================== ORDER MANAGEMENT ENDPOINTS ====================

// Helper function to automatically buy shipping label after payment (usando Shippo)
async function buyShippingLabelForOrder(shippingInfo) {
  try {
    console.log('📦 Attempting to buy shipping label automatically with Shippo...');
    console.log('📦 Shipping info:', shippingInfo);
    
    if (!shippingInfo || !shippingInfo.rateId) {
      console.log('⚠️ No shipping info or rate ID provided, skipping label purchase');
      return null;
    }
    
    const apiToken = resolveShippoToken();
    
    if (!apiToken) {
      console.error('❌ SHIPPO_API_TOKEN no está configurada');
      return null;
    }

    // Inicializar Shippo si no está inicializado
    let shippoClient = shippo;
    if (!shippoClient) {
      shippoClient = new shippoModule.Shippo({ apiKeyHeader: apiToken });
    }

    const rateId = shippingInfo.rateId;
    
    // Crear transacción en Shippo usando el rate ID
    const transaction = await shippoClient.transactions.create({
      rate: rateId,
      async: false
    });
    
    // API v2 puede usar diferentes nombres de campos
    const transactionId = transaction.id || transaction.objectId || transaction.object_id;
    const trackingNumber = transaction.tracking_number || transaction.trackingNumber;
    const labelUrl = transaction.label_url || transaction.labelUrl || transaction.labelURL;
    const trackingUrl = transaction.tracking_url_provider || transaction.trackingUrlProvider || 
                        (trackingNumber ? `https://goshippo.com/tracking/${trackingNumber}` : null);
    
    console.log('✅ Label purchased automatically with Shippo:', transactionId);
    console.log('📬 Tracking code:', trackingNumber);
    
    return {
      id: transactionId,
      tracking_code: trackingNumber,
      label_url: labelUrl,
      tracking_url: trackingUrl
    };
  } catch (error) {
    console.error('❌ Error buying label automatically with Shippo:', error);
    return null;
  }
}

// Endpoint: Crear envío completo con Shippo
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

    const apiToken = resolveShippoToken();
    
    if (!apiToken) {
      return res.status(500).json({
        success: false,
        error: 'SHIPPO_API_TOKEN no está configurada'
      });
    }

    // Inicializar Shippo
    let shippoClient = shippo;
    if (!shippoClient) {
      shippoClient = new shippoModule.Shippo({ apiKeyHeader: apiToken });
    }
    
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
    
    // Crear direcciones en Shippo - usar formato según documentación oficial
    const fromAddress = {
      name: 'Delizukar',
      street1: '123 Delizukar St',
      city: 'Miami',
      state: 'FL',
      zip: '33101',
      country: 'US',
      email: 'envios@delizukar.com',
      is_residential: false
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
    
    // Formato para Shippo según documentación oficial
    const toAddress = {
      name: `${customerInfo.firstName || 'Cliente'} ${customerInfo.lastName || ''}`,
      street1: street1,
      city: city,
      state: state,
      zip: zip,
      country: country,
      phone: customerInfo.phone || '',
      email: customerInfo.email || '',
      is_residential: true
    };
    
    console.log('📍 DIRECCIÓN EXACTA A ENVIAR A SHIPPO:');
    console.log('   Nombre:', toAddress.name);
    console.log('   Calle:', toAddress.street1);
    console.log('   Ciudad:', toAddress.city);
    console.log('   Estado:', toAddress.state);
    console.log('   Código Postal:', toAddress.zip);
    console.log('   País:', toAddress.country);
    console.log('📮 From Address:', JSON.stringify(fromAddress, null, 2));
    console.log('📮 To Address:', JSON.stringify(toAddress, null, 2));
    
    // Crear direcciones en Shippo v2
    console.log('📦 Creando direcciones en Shippo v2...');
    let fromAddr, toAddr, fromAddrId, toAddrId;
    
    try {
      fromAddr = await shippoClient.addresses.create(fromAddress);
      fromAddrId = fromAddr.id || fromAddr.objectId || fromAddr.object_id;
      console.log('✅ Dirección origen creada:', fromAddrId);
      console.log('   Tipo de ID:', typeof fromAddrId);
      console.log('   Respuesta completa:', JSON.stringify(fromAddr, null, 2));
      
      if (!fromAddrId) {
        throw new Error('No se recibió ID de la dirección origen');
      }
    } catch (error) {
      console.error('❌ Error creando dirección origen:', error);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      return res.status(500).json({
        success: false,
        error: 'Error creando dirección origen: ' + (error.message || 'Error desconocido')
      });
    }
    
    try {
      toAddr = await shippoClient.addresses.create(toAddress);
      toAddrId = toAddr.id || toAddr.objectId || toAddr.object_id;
      console.log('✅ Dirección destino creada:', toAddrId);
      console.log('   Tipo de ID:', typeof toAddrId);
      console.log('   Respuesta completa:', JSON.stringify(toAddr, null, 2));
      
      if (!toAddrId) {
        throw new Error('No se recibió ID de la dirección destino');
      }
    } catch (error) {
      console.error('❌ Error creando dirección destino:', error);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      return res.status(500).json({
        success: false,
        error: 'Error creando dirección destino: ' + (error.message || 'Error desconocido')
      });
    }
    
    // Verificar si Shippo sugirió correcciones - API v2 estructura
    const toAddrValidation = toAddr.validation_result || toAddr.validation_results || toAddr.validationResult;
    if (toAddrValidation && toAddrValidation.is_valid === false) {
      console.log('⚠️ Dirección no validada completamente:', toAddrValidation.messages || toAddrValidation.reasons);
    }
    
    // Validar que los IDs de direcciones estén definidos
    if (!fromAddrId || !toAddrId) {
      console.error('❌ Error: IDs de direcciones no válidos');
      console.error('   fromAddrId:', fromAddrId);
      console.error('   toAddrId:', toAddrId);
      return res.status(500).json({
        success: false,
        error: 'Error: No se pudieron crear las direcciones en Shippo'
      });
    }
    
    // CRÍTICO: Usar packageInfo exacto de la orden si existe
    // Esto asegura que se use el mismo peso/dimensiones que se usaron para calcular los rates originales
    const cartItems = order.cartItems || [];
    
    console.log('📦 [PackageInfo] Verificando packageInfo de la orden...');
    console.log('   order.packageInfo existe?', !!order.packageInfo);
    console.log('   order.packageInfo completo:', JSON.stringify(order.packageInfo, null, 2));
    
    let packageWeight, packageDimensions;
    
    if (order.packageInfo && order.packageInfo.weight && order.packageInfo.length) {
      // Usar el packageInfo exacto guardado en la orden
      console.log('✅ [PackageInfo] Usando packageInfo EXACTO de la orden (del checkout)');
      packageWeight = String(order.packageInfo.weight);
      packageDimensions = {
        length: String(order.packageInfo.length || '8'),
        width: String(order.packageInfo.width || '6'),
        height: String(order.packageInfo.height || '4'),
        distanceUnit: order.packageInfo.distanceUnit || 'in'
      };
      console.log('   Peso (exacto del checkout):', packageWeight, order.packageInfo.weightUnit || 'lb');
      console.log('   Dimensiones (exactas del checkout):', `${packageDimensions.length}" x ${packageDimensions.width}" x ${packageDimensions.height}"`);
      console.log('   ✅ Estos son los MISMOS datos que se usaron para calcular el precio de $' + (order.shippingInfo?.cost || order.shippingInfo?.amount || 'N/A'));
    } else {
      // Fallback: calcular con valores estándar
      console.warn('⚠️ [PackageInfo] PROBLEMA: No hay packageInfo en orden!');
      console.warn('   Esto significa que los datos del paquete NO se guardaron correctamente');
      console.warn('   Se calcularán con valores estándar, pero pueden ser diferentes a los del checkout');
      console.warn('   Por eso los precios pueden ser diferentes!');
      packageWeight = calculatePackageWeight(cartItems);
      packageDimensions = getStandardPackageDimensions(cartItems);
      console.log('   Peso (calculado ahora):', packageWeight, 'lb');
      console.log('   Dimensiones (calculadas ahora):', `${packageDimensions.length}" x ${packageDimensions.width}" x ${packageDimensions.height}"`);
      console.log('   ⚠️ Estos valores pueden ser DIFERENTES a los usados en el checkout');
    }
    
    console.log('📦 [PackageInfo] Datos finales del paquete para shipment:');
    console.log('   Peso:', packageWeight, 'lb');
    console.log('   Dimensiones:', packageDimensions);
    console.log('   Cantidad de galletas:', cartItems.reduce((total, item) => total + (item.quantity || 1), 0));
    console.log('   ⚠️ IMPORTANTE: Estos valores deben ser EXACTAMENTE iguales a los usados en el checkout');
    console.log('');
    
    // Obtener información del precio esperado (shippingInfo ya está declarado arriba en línea 1139)
    const expectedPriceFromCheckout = shippingInfo.cost || shippingInfo.amount || null;
    console.log('💰 [Precio Esperado] El cliente seleccionó un rate de:', expectedPriceFromCheckout || 'N/A');
    console.log('💰 [Precio Esperado] Este precio viene de Shippo cuando el cliente seleccionó la opción en el checkout');
    console.log('💰 [Precio Esperado] Shippo calculó ese precio usando los datos del paquete del checkout');
    console.log('💰 [Precio Esperado] Si los datos del paquete son diferentes ahora, Shippo dará un precio diferente');
    console.log('');
    
    // Crear shipment en Shippo - El SDK v2 espera camelCase
    const shipmentData = {
      addressFrom: String(fromAddrId).trim(),  // camelCase para SDK v2
      addressTo: String(toAddrId).trim(),      // camelCase para SDK v2
      parcels: [{
        length: packageDimensions.length,
        width: packageDimensions.width,
        height: packageDimensions.height,
        distanceUnit: packageDimensions.distanceUnit,  // camelCase para SDK v2
        weight: packageWeight,
        massUnit: 'lb'       // camelCase para SDK v2
      }],
      async: false
    };
    
    console.log('📦 Shipment data para Shippo (camelCase para SDK v2):');
    console.log('   addressFrom:', shipmentData.addressFrom, '(tipo:', typeof shipmentData.addressFrom, ')');
    console.log('   addressTo:', shipmentData.addressTo, '(tipo:', typeof shipmentData.addressTo, ')');
    console.log('   parcels:', JSON.stringify(shipmentData.parcels, null, 2));
    console.log('   ⚠️ VERIFICA ESTOS DATOS DEL PAQUETE:');
    console.log('      - Peso:', shipmentData.parcels[0].weight, shipmentData.parcels[0].massUnit);
    console.log('      - Dimensiones:', `${shipmentData.parcels[0].length}" x ${shipmentData.parcels[0].width}" x ${shipmentData.parcels[0].height}"`);
    console.log('      - Si el precio cambia en Shippo, estos valores pueden necesitar ajuste');
    
    console.log('📦 Creando shipment en Shippo...');
    const shipment = await shippoClient.shipments.create(shipmentData);
    const shipmentId = shipment.id || shipment.objectId || shipment.object_id;
    console.log('✅ Shipment creado:', shipmentId);
    
    if (!shipment.rates || shipment.rates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No hay tarifas disponibles para este envío'
      });
    }
    
    // CRÍTICO: Si tenemos el rateId del shipment original, usarlo directamente
    // No crear un nuevo shipment porque los rates pueden ser diferentes
    const userSelectedRate = shippingInfo.rate;
    const userSelectedAmount = shippingInfo.cost || shippingInfo.amount;
    const userRateId = shippingInfo.rateId || userSelectedRate?.id || userSelectedRate?.objectId || userSelectedRate?.object_id;
    
    console.log('🔍 [Rate Selection] Verificando si podemos usar rateId directamente...');
    console.log('   shippingInfo completo:', JSON.stringify(shippingInfo, null, 2));
    console.log('   userSelectedRate:', JSON.stringify(userSelectedRate, null, 2));
    console.log('   userRateId (ID del rate guardado):', userRateId);
    console.log('   userSelectedAmount (precio esperado):', userSelectedAmount);
    
    // Si tenemos el rateId, intentar usarlo directamente sin crear un nuevo shipment
    // Esto es más confiable porque el rateId es único y válido para crear transacciones
    if (userRateId) {
      console.log('✅ Tenemos rateId del shipment original, intentando usarlo directamente...');
      console.log('   RateId:', userRateId);
      console.log('   Precio esperado:', userSelectedAmount);
      console.log('   Carrier esperado:', userSelectedRate?.carrier || userSelectedRate?.provider);
      console.log('   Service esperado:', userSelectedRate?.service || userSelectedRate?.servicelevel?.name);
      
      // Verificar que tenemos el precio esperado para validar después
      const expectedAmount = userSelectedAmount ? parseFloat(userSelectedAmount) : null;
      
      // Intentar crear la transacción directamente con el rateId
      // Si falla, entonces crearemos un nuevo shipment y buscaremos el rate
      try {
        console.log('💰 Intentando crear transacción directamente con rateId:', userRateId);
        
        let transaction;
        let trackingNumber = null;
        let labelUrl = null;
        let trackingUrl = null;
        let transactionId = null;
        
        try {
          // Crear transacción directamente con el rateId original
          transaction = await shippoClient.transactions.create({
            rate: userRateId,
            async: false
          });
          
          transactionId = transaction.id || transaction.objectId || transaction.object_id;
          const transactionStatus = transaction.status || transaction.objectStatus || 'UNKNOWN';
          console.log('✅ Transacción creada directamente con rateId original:', transactionId);
          console.log('   Estado:', transactionStatus);
          
          // Verificar el estado de la transacción
          if (transactionStatus === 'ERROR' || transactionStatus === 'FAILED') {
            const errorMsg = transaction.messages?.[0]?.text || transaction.error || 'Error desconocido en la transacción';
            throw new Error(`Error en la transacción: ${errorMsg}`);
          }
          
          // Extraer información de la etiqueta
          trackingNumber = transaction.tracking_number || 
                           transaction.trackingNumber || 
                           transaction.tracking?.number ||
                           transaction.tracking_number_provider ||
                           null;
          labelUrl = transaction.label_url || 
                     transaction.labelUrl || 
                     transaction.label?.url ||
                     transaction.postage_label?.label_url ||
                     transaction.postage_label?.labelUrl ||
                     null;
          
          if (trackingNumber) {
            trackingUrl = `https://goshippo.com/tracking/${trackingNumber}`;
          }
          
          // Verificar que tenemos la información de la etiqueta
          if (transactionId && (!trackingNumber || !labelUrl)) {
            console.warn('⚠️ Transacción creada pero sin información de etiqueta');
            if (transactionStatus === 'ERROR' || transactionStatus === 'FAILED' || 
                (transactionStatus === 'SUCCESS' && !trackingNumber && !labelUrl)) {
              throw new Error('You are required to have a valid payment method on file to purchase labels.');
            }
            if (transactionStatus === 'QUEUED' || transactionStatus === 'PENDING' || transactionStatus === 'WAITING') {
              throw new Error('La transacción está en proceso. Por favor, intenta de nuevo en unos momentos.');
            }
          }
          
          // Si tenemos trackingNumber y labelUrl, éxito!
          if (trackingNumber && labelUrl) {
            console.log('✅ Etiqueta pagada exitosamente usando rateId original:');
            console.log('   Tracking Number:', trackingNumber);
            console.log('   Label URL:', labelUrl);
            console.log('   Transaction ID:', transactionId);
            
            // Preparar información del carrier y servicio desde el rate original
            const carrierName = userSelectedRate?.carrier || userSelectedRate?.provider || 'N/A';
            const serviceName = userSelectedRate?.service || userSelectedRate?.servicelevel?.name || 'Standard';
            const shippingCost = userSelectedAmount || '0.00';
            
            const carrierDisplayName = carrierName.toUpperCase() === 'UPS' ? 'UPS' :
                                      carrierName.toUpperCase() === 'USPS' ? 'USPS' :
                                      carrierName.toUpperCase() === 'FEDEX' ? 'FedEx' :
                                      carrierName.toUpperCase() === 'DHL' ? 'DHL' :
                                      carrierName;
            
            // Actualizar el pedido en Firestore
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, {
              shippoRateId: userRateId,
              shippoTransactionId: transactionId,
              trackingCode: trackingNumber,
              labelUrl: labelUrl,
              trackingUrl: trackingUrl,
              selectedCarrier: carrierDisplayName,
              selectedService: serviceName,
              shippingCost: shippingCost,
              status: 'shipped',
              updatedAt: new Date()
            });
            
            // Preparar datos del email
            const customerInfo = order.customerInfo || {};
            const emailData = {
              to_email: customerInfo.email,
              to_name: customerInfo.firstName || 'Cliente',
              to_name_full: `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim(),
              order_id: orderId,
              tracking_code: trackingNumber,
              tracking_url: trackingUrl,
              label_url: labelUrl,
              carrier_name: carrierDisplayName,
              service_name: serviceName,
              shipping_cost: `$${parseFloat(shippingCost).toFixed(2)}`,
              delivery_address: `${toAddress?.street1 || customerInfo.address?.street1 || ''}\n${toAddress?.city || customerInfo.address?.city || ''}, ${toAddress?.state || customerInfo.address?.state || ''} ${toAddress?.zip || customerInfo.address?.zip || ''}\n${toAddress?.country || customerInfo.address?.country || 'US'}`,
              delivery_street: toAddress?.street1 || customerInfo.address?.street1 || '',
              delivery_city: toAddress?.city || customerInfo.address?.city || '',
              delivery_state: toAddress?.state || customerInfo.address?.state || '',
              delivery_zip: toAddress?.zip || customerInfo.address?.zip || '',
              delivery_country: toAddress?.country || customerInfo.address?.country || 'US',
              products_list: (order.cartItems || []).map(item => {
                const itemName = item.name || 'Producto';
                const itemQuantity = item.quantity || 1;
                const itemPrice = parseFloat(item.price) || 0;
                return `${itemQuantity}x ${itemName} - $${itemPrice.toFixed(2)}`;
              }).join('\n'),
              products_count: (order.cartItems || []).length,
              order_total: `$${parseFloat(order.total || 0).toFixed(2)}`,
              subtotal: `$${parseFloat((order.total || 0) - parseFloat(shippingCost)).toFixed(2)}`
            };
            
            return res.json({
              success: true,
              data: {
                orderId: orderId,
                trackingCode: trackingNumber,
                labelUrl: labelUrl,
                trackingUrl: trackingUrl,
                transactionId: transactionId,
                shipmentId: null, // No creamos shipment nuevo
                carrier: carrierDisplayName,
                service: serviceName,
                shippingCost: shippingCost,
                emailData: emailData
              }
            });
          }
        } catch (transactionError) {
          console.error('❌ Error al crear transacción con rateId original:', transactionError);
          console.error('   Error message:', transactionError.message);
          
          // Verificar si es error de método de pago
          const paymentError = transactionError.message || 'Error al pagar la etiqueta';
          const isPaymentMethodError = paymentError.includes('payment method') || 
                                       paymentError.includes('billing') ||
                                       paymentError.includes('You are required to have a valid payment method');
          
          if (isPaymentMethodError) {
            console.error('⚠️ Error: No hay método de pago válido en Shippo');
            
            // Preparar información del carrier y servicio
            const carrierName = userSelectedRate?.carrier || userSelectedRate?.provider || 'N/A';
            const serviceName = userSelectedRate?.service || userSelectedRate?.servicelevel?.name || 'Standard';
            const shippingCost = userSelectedAmount || '0.00';
            const carrierDisplayName = carrierName.toUpperCase() === 'UPS' ? 'UPS' :
                                      carrierName.toUpperCase() === 'USPS' ? 'USPS' :
                                      carrierName.toUpperCase() === 'FEDEX' ? 'FedEx' :
                                      carrierName.toUpperCase() === 'DHL' ? 'DHL' :
                                      carrierName;
            
            // Guardar información en Firestore
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, {
              shippoRateId: userRateId,
              selectedCarrier: carrierDisplayName,
              selectedService: serviceName,
              shippingCost: shippingCost,
              status: 'pending',
              updatedAt: new Date()
            });
            
            return res.status(500).json({
              success: false,
              error: paymentError || 'Error al pagar la etiqueta',
              message: 'No se pudo procesar el pago porque no hay un método de pago válido en Shippo. Ve a Shippo para agregar un método de pago y pagar la etiqueta manualmente.',
              data: {
                orderId: orderId,
                shipmentId: null,
                rateId: userRateId,
                shippoUrl: `https://goshippo.com/rates/${userRateId}`,
                carrier: carrierDisplayName,
                service: serviceName,
                shippingCost: shippingCost,
                pendingPayment: true,
                instructions: 'Ve a Shippo para agregar un método de pago y pagar la etiqueta manualmente.'
              }
            });
          }
          
          // Si no es error de método de pago, continuar con la creación de nuevo shipment
          console.log('⚠️ No se pudo usar rateId directamente, continuando con creación de nuevo shipment...');
          throw transactionError; // Re-lanzar para que continúe con el flujo normal
        }
      } catch (error) {
        // Si falla, continuar con la creación de nuevo shipment
        console.log('⚠️ Error usando rateId directamente, continuando con búsqueda en nuevo shipment...');
        console.log('   Error:', error.message);
      }
    }
    
    // Si no tenemos rateId o falló, buscar en el nuevo shipment
    console.log('🔍 [Rate Selection] Buscando rate en el nuevo shipment...');
    console.log('   Rates disponibles en shipment:', shipment.rates.length);
    console.log('   Precios de rates disponibles:', shipment.rates.map(r => ({
      id: r.id || r.objectId || r.object_id,
      carrier: r.provider || r.carrier,
      service: r.servicelevel?.name || r.service,
      servicelevel_token: r.servicelevel?.token,
      amount: r.amount_local || r.amount
    })));
    
    let selectedRate = null;
    
    // Estrategia 1: Buscar por precio exacto + carrier + service (MÁS SEGURO)
    if (!selectedRate && userSelectedAmount && userSelectedRate) {
      const expectedAmount = parseFloat(userSelectedAmount);
      const userCarrier = (userSelectedRate.carrier || userSelectedRate.provider || '').toLowerCase();
      const userService = (userSelectedRate.service || userSelectedRate.servicelevel?.name || '').toLowerCase();
      
      console.log('🔍 Buscando rate por precio + carrier + service:', {
        amount: expectedAmount,
        carrier: userCarrier,
        service: userService
      });
      
      // Buscar precio exacto + carrier + service juntos
      selectedRate = shipment.rates.find(r => {
        const rateAmount = parseFloat(r.amount_local || r.amount || 0);
        const rateCarrier = (r.provider || r.carrier || '').toLowerCase();
        const rateService = (r.servicelevel?.name || r.service || '').toLowerCase();
        
        const priceMatch = Math.abs(rateAmount - expectedAmount) < 0.01;
        const carrierMatch = !userCarrier || rateCarrier === userCarrier;
        const serviceMatch = !userService || rateService === userService;
        
        const match = priceMatch && carrierMatch && serviceMatch;
        
        if (match) {
          console.log('   ✅ Match encontrado:', {
            amount: rateAmount,
            expected: expectedAmount,
            carrier: rateCarrier,
            expectedCarrier: userCarrier,
            service: rateService,
            expectedService: userService
          });
        }
        return match;
      });
      
      if (selectedRate) {
        console.log('✅ Rate encontrado por precio + carrier + service:', selectedRate.servicelevel?.name || selectedRate.service);
        console.log('   Precio esperado:', expectedAmount);
        console.log('   Precio encontrado:', selectedRate.amount_local || selectedRate.amount);
      } else {
        console.error('❌ NO se encontró rate con precio + carrier + service:', {
          amount: expectedAmount,
          carrier: userCarrier,
          service: userService
        });
        console.error('   Rates disponibles:', shipment.rates.map(r => ({
          amount: r.amount_local || r.amount,
          carrier: r.provider || r.carrier,
          service: r.servicelevel?.name || r.service
        })));
      }
    }
    
    // Estrategia 1b: Si no se encontró, buscar solo por precio exacto (fallback)
    if (!selectedRate && userSelectedAmount) {
      const expectedAmount = parseFloat(userSelectedAmount);
      console.log('🔍 Buscando rate SOLO por precio exacto (fallback):', expectedAmount);
      
      // Buscar precio exacto (dentro de $0.01)
      selectedRate = shipment.rates.find(r => {
        const rateAmount = parseFloat(r.amount_local || r.amount || 0);
        const diff = Math.abs(rateAmount - expectedAmount);
        const match = diff < 0.01;
        if (match) {
          console.log('   ⚠️ Match encontrado SOLO por precio (sin verificar carrier/service):', {
            amount: rateAmount,
            expected: expectedAmount,
            diff: diff,
            carrier: r.provider || r.carrier,
            service: r.servicelevel?.name || r.service
          });
        }
        return match;
      });
      
      if (selectedRate) {
        console.warn('⚠️ Rate encontrado SOLO por precio - se validará carrier/service después');
        console.warn('   Precio esperado:', expectedAmount);
        console.warn('   Precio encontrado:', selectedRate.amount_local || selectedRate.amount);
      }
    }
    
    // Estrategia 2: Si no se encontró por precio, buscar por carrier_token + servicelevel_token + precio
    if (!selectedRate && userSelectedRate) {
      const userCarrierToken = userSelectedRate.carrier_token || userSelectedRate.provider || userSelectedRate.carrier;
      const userServiceToken = userSelectedRate.servicelevel_token || userSelectedRate.servicelevel?.token;
      const expectedAmount = userSelectedAmount ? parseFloat(userSelectedAmount) : null;
      
      if (userCarrierToken && userServiceToken && expectedAmount) {
        selectedRate = shipment.rates.find(r => {
          const rateCarrier = (r.carrier_token || r.provider || r.carrier || '').toLowerCase();
          const rateService = (r.servicelevel?.token || r.servicelevel_token || '').toLowerCase();
          const rateAmount = parseFloat(r.amount_local || r.amount || 0);
          
          return rateCarrier === userCarrierToken.toLowerCase() && 
                 rateService === userServiceToken.toLowerCase() &&
                 Math.abs(rateAmount - expectedAmount) < 0.01;
        });
        
        if (selectedRate) {
          console.log('✅ Rate encontrado por carrier_token + servicelevel_token + precio:', selectedRate.servicelevel?.name || selectedRate.service);
        }
      }
    }
    
    // Estrategia 3: Buscar por precio exacto + carrier + service
    if (!selectedRate && userSelectedRate && userSelectedAmount) {
      const expectedAmount = parseFloat(userSelectedAmount);
      const userCarrier = (userSelectedRate.carrier || userSelectedRate.provider || '').toLowerCase();
      const userService = (userSelectedRate.service || userSelectedRate.servicelevel?.name || '').toLowerCase();
      
      selectedRate = shipment.rates.find(r => {
        const rateAmount = parseFloat(r.amount_local || r.amount || 0);
        const rateCarrier = (r.carrier || r.provider || '').toLowerCase();
        const rateService = (r.service || r.servicelevel?.name || '').toLowerCase();
        
        return Math.abs(rateAmount - expectedAmount) < 0.01 &&
               rateCarrier === userCarrier &&
               rateService === userService;
      });
      
      if (selectedRate) {
        console.log('✅ Rate encontrado por precio + carrier + service:', selectedRate.servicelevel?.name || selectedRate.service);
      }
    }
    
    // Si NO se encontró el rate del usuario, ERROR - no usar fallback
    if (!selectedRate) {
      console.error('❌ ERROR CRÍTICO: No se pudo encontrar el rate seleccionado por el usuario!');
      console.error('   Rate esperado:', {
        rateId: userRateId,
        carrier: userSelectedRate?.carrier || userSelectedRate?.provider,
        service: userSelectedRate?.service || userSelectedRate?.servicelevel?.name,
        amount: userSelectedAmount
      });
      console.error('   Rates disponibles en el shipment:', shipment.rates.map(r => ({
        id: r.id || r.objectId || r.object_id,
        carrier: r.provider || r.carrier,
        service: r.servicelevel?.name || r.service,
        amount: r.amount_local || r.amount
      })));
      
      return res.status(400).json({
        success: false,
        error: `No se pudo encontrar el servicio de envío seleccionado por el cliente. Precio esperado: $${userSelectedAmount ? parseFloat(userSelectedAmount).toFixed(2) : 'N/A'}, Carrier: ${userSelectedRate?.carrier || userSelectedRate?.provider || 'N/A'}, Service: ${userSelectedRate?.service || userSelectedRate?.servicelevel?.name || 'N/A'}.`,
        message: `El servicio de envío seleccionado por el cliente no está disponible. Esto puede pasar si los rates cambiaron o si el peso/dimensiones del paquete son diferentes. Por favor, usa el botón "Widget" para seleccionar manualmente un servicio de envío.`,
        data: {
          expectedAmount: userSelectedAmount,
          expectedCarrier: userSelectedRate?.carrier || userSelectedRate?.provider,
          expectedService: userSelectedRate?.service || userSelectedRate?.servicelevel?.name,
          availableRates: shipment.rates.map(r => ({
            carrier: r.provider || r.carrier,
            service: r.servicelevel?.name || r.service,
            amount: r.amount_local || r.amount
          }))
        }
      });
    }
    
    // CRÍTICO: Verificar que el rate seleccionado tiene el precio EXACTO
    // Si no coincide, NO usar ese rate - es un error grave
    // ESTA VALIDACIÓN ES OBLIGATORIA - NO SE PUEDE CREAR UNA TRANSACCIÓN CON UN PRECIO DIFERENTE
    const selectedAmount = parseFloat(selectedRate.amount_local || selectedRate.amount || 0);
    const expectedAmount = userSelectedAmount ? parseFloat(userSelectedAmount) : null;
    
    console.log('🔍 [Validación Precio] Verificando que el precio coincida exactamente...');
    console.log('   Precio esperado (cliente seleccionó):', expectedAmount);
    console.log('   Precio del rate encontrado:', selectedAmount);
    console.log('   Diferencia:', expectedAmount ? Math.abs(selectedAmount - expectedAmount) : 'N/A');
    console.log('   Tolerancia permitida: $0.01');
    
    if (expectedAmount && Math.abs(selectedAmount - expectedAmount) > 0.01) {
      console.error('❌ ERROR CRÍTICO: El rate seleccionado tiene un precio diferente al esperado!');
      console.error('   Precio esperado (seleccionado por cliente):', expectedAmount);
      console.error('   Precio del rate encontrado:', selectedAmount);
      console.error('   Diferencia:', Math.abs(selectedAmount - expectedAmount));
      console.error('   Carrier esperado:', userSelectedRate?.carrier || userSelectedRate?.provider);
      console.error('   Carrier encontrado:', selectedRate.provider || selectedRate.carrier);
      console.error('   Service esperado:', userSelectedRate?.service || userSelectedRate?.servicelevel?.name);
      console.error('   Service encontrado:', selectedRate.servicelevel?.name || selectedRate.service);
      console.error('   Rate ID encontrado:', selectedRate.id || selectedRate.objectId || selectedRate.object_id);
      console.error('   ⚠️ NO SE CREARÁ LA TRANSACCIÓN - El precio no coincide');
      
      // Mostrar todos los rates disponibles para debugging
      console.error('   Rates disponibles en el shipment:');
      shipment.rates.forEach((r, idx) => {
        const rAmount = parseFloat(r.amount_local || r.amount || 0);
        const rCarrier = r.provider || r.carrier;
        const rService = r.servicelevel?.name || r.service;
        const match = Math.abs(rAmount - expectedAmount) < 0.01 ? '✅ MATCH' : '';
        console.error(`     ${idx + 1}. ${rCarrier} - ${rService}: $${rAmount.toFixed(2)} ${match}`);
      });
      
      return res.status(400).json({
        success: false,
        error: `El precio del servicio de envío no coincide. El cliente seleccionó un servicio de $${expectedAmount.toFixed(2)}, pero el servicio disponible ahora es de $${selectedAmount.toFixed(2)}.`,
        message: `El precio del servicio de envío cambió. El cliente seleccionó un servicio de $${expectedAmount.toFixed(2)}, pero el servicio disponible ahora es de $${selectedAmount.toFixed(2)}. Por favor, usa el botón "Widget" para seleccionar manualmente un servicio de envío con el precio correcto.`,
        data: {
          expectedAmount: expectedAmount,
          foundAmount: selectedAmount,
          expectedCarrier: userSelectedRate?.carrier || userSelectedRate?.provider,
          foundCarrier: selectedRate.provider || selectedRate.carrier,
          expectedService: userSelectedRate?.service || userSelectedRate?.servicelevel?.name,
          foundService: selectedRate.servicelevel?.name || selectedRate.service,
          availableRates: shipment.rates.map(r => ({
            carrier: r.provider || r.carrier,
            service: r.servicelevel?.name || r.service,
            amount: parseFloat(r.amount_local || r.amount || 0)
          }))
        }
      });
    }
    
    console.log('✅ [Validación Precio] El precio coincide correctamente');
    
    // Verificar también que el carrier y service coincidan
    const userCarrier = (userSelectedRate?.carrier || userSelectedRate?.provider || '').toLowerCase();
    const userService = (userSelectedRate?.service || userSelectedRate?.servicelevel?.name || '').toLowerCase();
    const foundCarrier = (selectedRate.provider || selectedRate.carrier || '').toLowerCase();
    const foundService = (selectedRate.servicelevel?.name || selectedRate.service || '').toLowerCase();
    
    if (userCarrier && foundCarrier && userCarrier !== foundCarrier) {
      console.error('❌ ERROR: El carrier no coincide!');
      console.error('   Carrier esperado:', userCarrier);
      console.error('   Carrier encontrado:', foundCarrier);
      
      return res.status(400).json({
        success: false,
        error: `El carrier seleccionado no está disponible. Carrier esperado: ${userCarrier}, carrier disponible: ${foundCarrier}.`,
        message: `El carrier del servicio de envío no coincide. Por favor, contacta al administrador.`
      });
    }
    
    if (userService && foundService && userService !== foundService) {
      console.error('❌ ERROR: El servicio no coincide!');
      console.error('   Servicio esperado:', userService);
      console.error('   Servicio encontrado:', foundService);
      
      return res.status(400).json({
        success: false,
        error: `El servicio seleccionado no está disponible. Servicio esperado: ${userService}, servicio disponible: ${foundService}.`,
        message: `El servicio de envío no coincide. Por favor, contacta al administrador.`
      });
    }
    
    console.log('✅ Validación completa: Rate correcto');
    console.log('   Precio:', selectedAmount, '(esperado:', expectedAmount, ')');
    console.log('   Carrier:', foundCarrier, '(esperado:', userCarrier, ')');
    console.log('   Service:', foundService, '(esperado:', userService, ')');
    
    console.log('✅ Rate final seleccionado:');
    console.log('   Carrier:', selectedRate.provider || selectedRate.carrier);
    console.log('   Service:', selectedRate.servicelevel?.name || selectedRate.service);
    console.log('   Amount:', selectedRate.amount_local || selectedRate.amount);
    
    // Obtener ID del rate
    const rateId = selectedRate.id || selectedRate.objectId || selectedRate.object_id;
    
    // Intentar crear transacción automáticamente para pagar la etiqueta
    console.log('💰 Intentando crear transacción para pagar la etiqueta automáticamente...');
    console.log('   Shipment ID:', shipmentId);
    console.log('   Rate ID:', rateId);
    console.log('   Carrier:', selectedRate.provider || selectedRate.carrier);
    console.log('   Service:', selectedRate.servicelevel?.name || selectedRate.service);
    console.log('   Amount:', selectedRate.amount);
    
    let transaction;
    let trackingNumber = null;
    let labelUrl = null;
    let trackingUrl = null;
    let transactionId = null;
    let paymentError = null;
    
    try {
      // Crear transacción para pagar la etiqueta
      transaction = await shippoClient.transactions.create({
        rate: rateId,
        async: false // Síncrono para obtener resultado inmediato
      });
      
      transactionId = transaction.id || transaction.objectId || transaction.object_id;
      const transactionStatus = transaction.status || transaction.objectStatus || 'UNKNOWN';
      console.log('✅ Transacción creada exitosamente:', transactionId);
      console.log('   Estado:', transactionStatus);
      console.log('   Transaction completa:', JSON.stringify(transaction, null, 2));
      
      // Verificar el estado de la transacción
      if (transactionStatus === 'ERROR' || transactionStatus === 'FAILED') {
        const errorMsg = transaction.messages?.[0]?.text || transaction.error || 'Error desconocido en la transacción';
        throw new Error(`Error en la transacción: ${errorMsg}`);
      }
      
      // Extraer información de la etiqueta
      // Shippo puede usar diferentes campos según la versión de la API
      trackingNumber = transaction.tracking_number || 
                       transaction.trackingNumber || 
                       transaction.tracking?.number ||
                       transaction.tracking_number_provider ||
                       null;
      labelUrl = transaction.label_url || 
                 transaction.labelUrl || 
                 transaction.label?.url ||
                 transaction.postage_label?.label_url ||
                 transaction.postage_label?.labelUrl ||
                 null;
      
      // Si no hay información de la etiqueta, intentar obtener la transacción nuevamente
      if (!trackingNumber || !labelUrl) {
        console.log('⚠️ No se obtuvo información completa de la etiqueta, consultando transacción nuevamente...');
        
        // Esperar un poco y consultar la transacción
        await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos
        
        try {
          const retrievedTransaction = await shippoClient.transactions.retrieve(transactionId);
          console.log('📥 Transacción recuperada:', JSON.stringify(retrievedTransaction, null, 2));
          
          // Intentar extraer información nuevamente
          trackingNumber = trackingNumber || 
                           retrievedTransaction.tracking_number || 
                           retrievedTransaction.trackingNumber || 
                           retrievedTransaction.tracking?.number ||
                           retrievedTransaction.tracking_number_provider ||
                           null;
          labelUrl = labelUrl || 
                     retrievedTransaction.label_url || 
                     retrievedTransaction.labelUrl || 
                     retrievedTransaction.label?.url ||
                     retrievedTransaction.postage_label?.label_url ||
                     retrievedTransaction.postage_label?.labelUrl ||
                     null;
          
          console.log('📋 Información después de recuperar:');
          console.log('   Tracking Number:', trackingNumber);
          console.log('   Label URL:', labelUrl);
        } catch (retrieveError) {
          console.error('⚠️ Error al recuperar transacción:', retrieveError);
          // Continuar con la información que tenemos
        }
      }
      
      // Si no hay tracking number pero la transacción está en proceso, puede estar en estado QUEUED
      if (!trackingNumber && (transactionStatus === 'QUEUED' || transactionStatus === 'PENDING' || transactionStatus === 'WAITING')) {
        console.log('⚠️ Transacción en proceso, esperando información de la etiqueta...');
        throw new Error('La transacción está en proceso. Por favor, intenta de nuevo en unos momentos.');
      }
      
      if (trackingNumber) {
        trackingUrl = `https://goshippo.com/tracking/${trackingNumber}`;
      }
      
      console.log('✅ Etiqueta pagada exitosamente:');
      console.log('   Tracking Number:', trackingNumber);
      console.log('   Label URL:', labelUrl);
      console.log('   Transaction ID:', transactionId);
      console.log('   Transaction Status:', transactionStatus);
      
      // Verificar si la transacción se creó pero no tiene información de la etiqueta
      // Esto puede pasar cuando falta método de pago o la transacción está en proceso
      if (transactionId && (!trackingNumber || !labelUrl)) {
        console.warn('⚠️ Transacción creada pero sin información de etiqueta');
        console.warn('   Transaction ID:', transactionId);
        console.warn('   Transaction Status:', transactionStatus);
        console.warn('   Tracking Number:', trackingNumber);
        console.warn('   Label URL:', labelUrl);
        
        // Si el estado es ERROR o FAILED, es definitivamente un error de método de pago
        // Si el estado es SUCCESS pero no hay información, también puede ser error de método de pago
        if (transactionStatus === 'ERROR' || transactionStatus === 'FAILED' || 
            (transactionStatus === 'SUCCESS' && !trackingNumber && !labelUrl)) {
          throw new Error('You are required to have a valid payment method on file to purchase labels.');
        }
        
        // Si está en proceso (QUEUED, PENDING, WAITING), lanzar error específico
        if (transactionStatus === 'QUEUED' || transactionStatus === 'PENDING' || transactionStatus === 'WAITING') {
          throw new Error('La transacción está en proceso. Por favor, intenta de nuevo en unos momentos.');
        }
      }
      
    } catch (transactionError) {
      console.error('❌ Error al crear transacción (pagar etiqueta):', transactionError);
      console.error('   Error message:', transactionError.message);
      
      // Capturar el error específico
      paymentError = transactionError.message || 'Error al pagar la etiqueta';
      
      // Verificar si es el error de método de pago
      const isPaymentMethodError = paymentError.includes('payment method') || 
                                   paymentError.includes('billing') ||
                                   paymentError.includes('You are required to have a valid payment method');
      
      // Preparar información del carrier y servicio
      const carrierName = selectedRate.provider || selectedRate.carrier || 'N/A';
      const serviceName = selectedRate.servicelevel?.name || selectedRate.service || 'Standard';
      const shippingCost = selectedRate.amount_local || selectedRate.amount || '0.00';
      const carrierDisplayName = carrierName.toUpperCase() === 'UPS' ? 'UPS' :
                                  carrierName.toUpperCase() === 'USPS' ? 'USPS' :
                                  carrierName.toUpperCase() === 'FEDEX' ? 'FedEx' :
                                  carrierName.toUpperCase() === 'DHL' ? 'DHL' :
                                  carrierName;
      
      const shippoUrl = `https://goshippo.com/shipments/${shipmentId}`;
      
      // Si es error de método de pago, retornar información del shipment para pagar manualmente
      if (isPaymentMethodError) {
        console.error('⚠️ Error: No hay método de pago válido en Shippo');
        console.log('📋 Retornando información del shipment para pago manual');
        
        // Guardar información del shipment en Firestore
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
          shippoShipmentId: shipmentId,
          shippoRateId: rateId,
          shippoUrl: shippoUrl,
          selectedCarrier: carrierDisplayName,
          selectedService: serviceName,
          shippingCost: shippingCost,
          status: 'pending',
          updatedAt: new Date()
        });
        
        return res.status(500).json({
          success: false,
          error: paymentError || 'Error al pagar la etiqueta',
          message: 'No se pudo procesar el pago porque no hay un método de pago válido en Shippo. Ve a Shippo para agregar un método de pago y pagar la etiqueta manualmente.',
          data: {
            orderId: orderId,
            shipmentId: shipmentId,
            rateId: rateId,
            shippoUrl: shippoUrl,
            carrier: carrierDisplayName,
            service: serviceName,
            shippingCost: shippingCost,
            pendingPayment: true,
            instructions: 'Ve a Shippo para agregar un método de pago y pagar la etiqueta manualmente.'
          }
        });
      }
      
      // Si no es error de método de pago, retornar error genérico
      return res.status(500).json({
        success: false,
        error: paymentError || 'Error al pagar la etiqueta',
        message: 'Error al pagar la etiqueta: ' + paymentError
      });
    }
    
    // Preparar información del carrier y servicio
    const carrierName = selectedRate.provider || selectedRate.carrier || 'N/A';
    const serviceName = selectedRate.servicelevel?.name || selectedRate.service || 'Standard';
    const shippingCost = selectedRate.amount || '0.00';
    
    // Formatear nombre del carrier para mostrar
    const carrierDisplayName = carrierName.toUpperCase() === 'UPS' ? 'UPS' :
                                carrierName.toUpperCase() === 'USPS' ? 'USPS' :
                                carrierName.toUpperCase() === 'FEDEX' ? 'FedEx' :
                                carrierName.toUpperCase() === 'DHL' ? 'DHL' :
                                carrierName;
    
    // Si la transacción fue exitosa, actualizar con información completa
    if (transactionId && trackingNumber) {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        shippoShipmentId: shipmentId,
        shippoRateId: rateId,
        shippoTransactionId: transactionId,
        trackingCode: trackingNumber,
        labelUrl: labelUrl,
        trackingUrl: trackingUrl,
        selectedCarrier: carrierDisplayName,
        selectedService: serviceName,
        shippingCost: shippingCost,
        status: 'shipped',
        updatedAt: new Date()
      });
      
      // Preparar datos del email
      const customerInfo = order.customerInfo || {};
      const emailData = {
        to_email: customerInfo.email,
        to_name: customerInfo.firstName || 'Cliente',
        to_name_full: `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim(),
        order_id: orderId,
        tracking_code: trackingNumber,
        tracking_url: trackingUrl,
        label_url: labelUrl,
        carrier_name: carrierDisplayName,
        service_name: serviceName,
        shipping_cost: `$${parseFloat(shippingCost).toFixed(2)}`,
        delivery_address: `${toAddress?.street1 || customerInfo.address?.street1 || ''}\n${toAddress?.city || customerInfo.address?.city || ''}, ${toAddress?.state || customerInfo.address?.state || ''} ${toAddress?.zip || customerInfo.address?.zip || ''}\n${toAddress?.country || customerInfo.address?.country || 'US'}`,
        delivery_street: toAddress?.street1 || customerInfo.address?.street1 || '',
        delivery_city: toAddress?.city || customerInfo.address?.city || '',
        delivery_state: toAddress?.state || customerInfo.address?.state || '',
        delivery_zip: toAddress?.zip || customerInfo.address?.zip || '',
        delivery_country: toAddress?.country || customerInfo.address?.country || 'US',
        products_list: (order.cartItems || []).map(item => {
          const itemName = item.name || 'Producto';
          const itemQuantity = item.quantity || 1;
          const itemPrice = parseFloat(item.price) || 0;
          return `${itemQuantity}x ${itemName} - $${itemPrice.toFixed(2)}`;
        }).join('\n'),
        products_count: (order.cartItems || []).length,
        order_total: `$${parseFloat(order.total || 0).toFixed(2)}`,
        subtotal: `$${parseFloat((order.total || 0) - parseFloat(shippingCost)).toFixed(2)}`
      };
      
      return res.json({
        success: true,
        data: {
          orderId: orderId,
          trackingCode: trackingNumber,
          labelUrl: labelUrl,
          trackingUrl: trackingUrl,
          transactionId: transactionId,
          shipmentId: shipmentId,
          carrier: carrierDisplayName,
          service: serviceName,
          shippingCost: shippingCost,
          emailData: emailData
        }
      });
    }
    
    // Si llegamos aquí, la transacción se creó pero no hay trackingNumber ni labelUrl
    // Esto significa que probablemente falta método de pago o la transacción está en proceso
    console.error('❌ Error: La transacción se creó pero no se obtuvo información de la etiqueta');
    console.error('   Transaction ID:', transactionId);
    console.error('   Tracking Number:', trackingNumber);
    console.error('   Label URL:', labelUrl);
    
    // Preparar información del carrier y servicio (carrierName ya está declarado arriba en línea 2096)
    // Usar los valores ya declarados o recalcular si es necesario
    const finalCarrierName = selectedRate.provider || selectedRate.carrier || carrierName || 'N/A';
    const finalServiceName = selectedRate.servicelevel?.name || selectedRate.service || serviceName || 'Standard';
    const finalShippingCost = selectedRate.amount_local || selectedRate.amount || shippingCost || '0.00';
    const finalCarrierDisplayName = finalCarrierName.toUpperCase() === 'UPS' ? 'UPS' :
                                    finalCarrierName.toUpperCase() === 'USPS' ? 'USPS' :
                                    finalCarrierName.toUpperCase() === 'FEDEX' ? 'FedEx' :
                                    finalCarrierName.toUpperCase() === 'DHL' ? 'DHL' :
                                    finalCarrierName;
    const shippoUrl = `https://goshippo.com/shipments/${shipmentId}`;
    
    // Guardar información del shipment en Firestore
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      shippoShipmentId: shipmentId,
      shippoRateId: rateId,
      shippoUrl: shippoUrl,
      selectedCarrier: finalCarrierDisplayName,
      selectedService: finalServiceName,
      shippingCost: finalShippingCost,
      status: 'pending',
      updatedAt: new Date()
    });
    
    // Retornar error de método de pago (más probable cuando no hay información de la etiqueta)
    return res.status(500).json({
      success: false,
      error: 'Error: La transacción se creó pero no se obtuvo información de la etiqueta',
      message: 'No se pudo procesar el pago porque no hay un método de pago válido en Shippo. Ve a Shippo para agregar un método de pago y pagar la etiqueta manualmente.',
      data: {
        orderId: orderId,
        shipmentId: shipmentId,
        rateId: rateId,
        shippoUrl: shippoUrl,
        carrier: finalCarrierDisplayName,
        service: finalServiceName,
        shippingCost: finalShippingCost,
        pendingPayment: true,
        instructions: 'Ve a Shippo para agregar un método de pago y pagar la etiqueta manualmente.'
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

    const testTrackingCode = 'SHIPPO' + Date.now().toString().substring(4, 14);
    const testLabelUrl = 'https://goshippo.com/example-label.pdf';

    // Retornar los datos para que el frontend use EmailJS
    res.json({
      success: true,
      message: 'Datos listos para enviar con EmailJS',
      emailData: {
        to_email: email,
        to_name: testOrder.nombre,
        order_id: testOrder.id,
        tracking_code: testTrackingCode,
          tracking_url: `https://goshippo.com/tracking/${testTrackingCode}`,
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
// Función helper para calcular peso del paquete basado en galletas (100g = 0.22 lb por galleta)
function calculatePackageWeight(cartItems) {
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return '0.22'; // Peso mínimo de 1 galleta
  }
  
  // Calcular peso total: 100 gramos = 0.22 libras por galleta
  const totalWeight = cartItems.reduce((total, item) => {
    const quantity = item.quantity || 1;
    return total + (quantity * 0.22); // 0.22 lb por galleta
  }, 0);
  
  // Redondear a máximo 2 decimales y asegurar mínimo de 0.22 lb (1 galleta)
  const roundedWeight = Math.round(totalWeight * 100) / 100;
  const finalWeight = Math.max(0.22, roundedWeight);
  
  // Formatear para que no exceda 10 dígitos (requisito de Shippo)
  return finalWeight.toFixed(2);
}

// Función helper para obtener dimensiones estándar del paquete
function getStandardPackageDimensions(cartItems) {
  // Dimensiones base para una caja pequeña de galletas
  const baseDimensions = {
    length: '8',  // pulgadas
    width: '6',
    height: '4'
  };
  
  // Calcular cantidad total de galletas
  const totalCookies = cartItems ? cartItems.reduce((total, item) => total + (item.quantity || 1), 0) : 1;
  
  // Ajustar altura según cantidad: 6 galletas por nivel
  const heightMultiplier = Math.ceil(totalCookies / 6);
  const finalHeight = Math.max(4, baseDimensions.height * heightMultiplier);
  
  return {
    length: baseDimensions.length,
    width: baseDimensions.width,
    height: String(finalHeight),
    distanceUnit: 'in'
  };
}

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

    // Limpiar shippingInfo - guardar campos esenciales + rateId y rate completo
    // CRÍTICO: Guardar rateId y rate completo para poder identificar el rate exacto después
    let cleanedShippingInfo = null;
    if (shippingInfo && Object.keys(shippingInfo).length > 0) {
      cleanedShippingInfo = {
        carrier: shippingInfo.carrier || null,
        serviceLevel: shippingInfo.serviceLevel || null,
        cost: parseFloat(shippingInfo.cost) || 0,
        trackingNumber: shippingInfo.trackingNumber || null,
        // CRÍTICO: Guardar rateId y rate completo para identificación exacta
        rateId: shippingInfo.rateId || shippingInfo.rate?.id || shippingInfo.rate?.objectId || shippingInfo.rate?.object_id || null,
        rate: shippingInfo.rate || null, // Guardar el objeto rate completo
        amount: shippingInfo.amount || shippingInfo.cost || null
      };
      
      console.log('📦 [Backend] ShippingInfo guardado:', {
        carrier: cleanedShippingInfo.carrier,
        serviceLevel: cleanedShippingInfo.serviceLevel,
        cost: cleanedShippingInfo.cost,
        rateId: cleanedShippingInfo.rateId,
        hasRate: !!cleanedShippingInfo.rate
      });
    }

    // CRÍTICO: Usar packageInfo del request si existe (del checkout), 
    // de lo contrario calcular con los valores estándar
    // Esto asegura que se use el mismo peso/dimensiones que se usaron para calcular los rates
    let finalPackageInfo;
    if (req.body.packageInfo && req.body.packageInfo.weight && req.body.packageInfo.length) {
      // Usar el packageInfo exacto del checkout
      console.log('📦 [Backend] Usando packageInfo del checkout (exacto):', req.body.packageInfo);
      finalPackageInfo = {
        weight: String(req.body.packageInfo.weight || '0.22'),
        weightUnit: req.body.packageInfo.weightUnit || req.body.packageInfo.massUnit || 'lb',
        length: String(req.body.packageInfo.length || '8'),
        width: String(req.body.packageInfo.width || '6'),
        height: String(req.body.packageInfo.height || '4'),
        distanceUnit: req.body.packageInfo.distanceUnit || 'in'
      };
    } else {
      // Calcular con valores estándar (fallback)
      console.log('⚠️ [Backend] No hay packageInfo en request, calculando con valores estándar');
      const packageWeight = calculatePackageWeight(cleanedCartItems);
      const packageDimensions = getStandardPackageDimensions(cleanedCartItems);
      finalPackageInfo = {
        weight: packageWeight,
        weightUnit: 'lb',
        length: packageDimensions.length,
        width: packageDimensions.width,
        height: packageDimensions.height,
        distanceUnit: packageDimensions.distanceUnit
      };
    }
    
    console.log('📦 [Backend] PackageInfo final a guardar:', finalPackageInfo);
    
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
      // CRÍTICO: Guardar packageInfo exacto usado para calcular rates
      packageInfo: finalPackageInfo,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Solo agregar shippingInfo si existe
    if (cleanedShippingInfo) {
      orderData.shippingInfo = cleanedShippingInfo;
    }

    console.log('🔵 [Backend] Order data to save:', JSON.stringify(orderData, null, 2));
    console.log('🔵 [Backend] Payment Status:', orderData.paymentStatus);
    console.log('🔵 [Backend] Status:', orderData.status);
    console.log('🔵 [Backend] Total:', orderData.total);
    console.log('🔵 [Backend] Cart Items Count:', orderData.cartItems?.length);

    console.log('🔵 [Backend] Guardando en Firestore...');
    const docRef = await addDoc(collection(db, 'orders'), orderData);
    
    console.log('✅ [Backend] Order created with ID:', docRef.id);
    console.log('✅ [Backend] Verificando datos guardados...');
    
    // Verificar que se guardó correctamente
    const savedDoc = await getDoc(docRef);
    const savedData = savedDoc.data();
    console.log('✅ [Backend] Datos guardados en Firestore:');
    console.log('   - Payment Status:', savedData.paymentStatus);
    console.log('   - Status:', savedData.status);
    console.log('   - Total:', savedData.total);
    console.log('   - Customer Email:', savedData.customerInfo?.email);
    
    // Retornar respuesta exitosa con más información
    res.json({ 
      success: true,
      orderId: docRef.id, 
      order: {
        ...orderData,
        paymentStatus: savedData.paymentStatus,
        status: savedData.status
      },
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


// ==================== PAGES UPDATE (ADMIN UTILITY) ====================
// POST /api/pages/update { id, title, content, titleFont?, contentFont? }
app.post('/api/pages/update', async (req, res) => {
  try {
    const { id, title, content, titleFont, contentFont } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id is required' });

    const pageRef = doc(db, 'pages', id);
    const dataToUpdate = { updatedAt: new Date() };
    if (typeof title === 'string') dataToUpdate.title = title;
    if (typeof content === 'string') dataToUpdate.content = content;
    if (typeof titleFont === 'string') dataToUpdate.titleFont = titleFont;
    if (typeof contentFont === 'string') dataToUpdate.contentFont = contentFont;

    await updateDoc(pageRef, dataToUpdate);
    res.json({ success: true, id, updated: Object.keys(dataToUpdate) });
  } catch (error) {
    console.error('❌ Error updating page:', error);
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
