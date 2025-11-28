// Configuración de Shippo
// El servicio hace requests al backend que se comunica con la API de Shippo

class ShippoService {
  constructor() {
    // En producción usa window.location.origin
    // En desarrollo usa string vacío para que el proxy de React (package.json) redirija a localhost:5000
    // Si el proxy falla, puedes usar 'http://localhost:5000' directamente
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : ''; // Usa proxy de React en desarrollo (configurado en package.json para localhost:5000)
  }

  // Método helper para hacer requests
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`Making request to ${url}`);
    console.log('Request data:', options.body ? JSON.parse(options.body) : null);
    
    try {
      const response = await fetch(url, {
        method: options.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error making request:', error);
      throw error;
    }
  }

  // Crear dirección en Shippo
  async createAddress(addressData) {
    try {
      const response = await this.makeRequest('/api/shippo/create-address', {
        body: JSON.stringify(addressData),
      });

      return response;
    } catch (error) {
      console.error('Error creating address:', error);
      throw error;
    }
  }

  // Validar dirección (con correcciones automáticas) - Ahora usa USPS
  async validateAddress(addressData) {
    try {
      console.log('📦 [USPS] Validando dirección:', addressData);
      
      // Usar endpoint de USPS para validación
      const response = await this.makeRequest('/api/usps/validate-address', {
        body: JSON.stringify(addressData),
      });

      console.log('✅ [USPS] Respuesta de validación:', response);

      // Si hay correcciones, devolver la dirección corregida
      if (response.was_corrected && response.validated_address) {
        console.log('✅ Dirección corregida por USPS:', response.validated_address);
        return {
          ...response,
          corrected: true,
          original: response.original_address,
          corrected_address: response.validated_address
        };
      }

      return response;
    } catch (error) {
      console.error('❌ [USPS] Error validating address:', error);
      console.error('   Error details:', error.message);
      console.error('   Address data:', addressData);
      
      // Mejorar el mensaje de error
      const errorMessage = error.message || 'Error al validar la dirección';
      const improvedError = new Error(`Error al validar la dirección: ${errorMessage}. Verifica que todos los campos estén completos (calle, ciudad, estado, código postal).`);
      improvedError.originalError = error;
      throw improvedError;
    }
  }

  // Crear shipment y obtener rates
  async getShippingRates(fromAddress, toAddress, parcels) {
    try {
      // Validar que las direcciones estén presentes
      if (!fromAddress || !toAddress) {
        throw new Error('Las direcciones de origen y destino son requeridas');
      }
      
      // Validar que los parcels estén presentes
      if (!parcels || (Array.isArray(parcels) && parcels.length === 0)) {
        throw new Error('Los datos del paquete son requeridos');
      }
      
      // Asegurar que las direcciones tengan el formato correcto
      const formattedFromAddress = {
        name: fromAddress.name || 'Delizukar',
        street1: fromAddress.street1 || fromAddress.street || fromAddress.line1 || '',
        street2: fromAddress.street2 || fromAddress.line2 || '',
        city: fromAddress.city || '',
        state: fromAddress.state || '',
        zip: fromAddress.zip || fromAddress.zipCode || fromAddress.postal_code || '',
        country: fromAddress.country || 'US',
        phone: fromAddress.phone || '',
        email: fromAddress.email || 'support@delizukar.com',
        is_residential: fromAddress.is_residential !== undefined ? fromAddress.is_residential : false
      };
      
      const formattedToAddress = {
        name: toAddress.name || '',
        street1: toAddress.street1 || toAddress.street || toAddress.line1 || '',
        street2: toAddress.street2 || toAddress.line2 || '',
        city: toAddress.city || '',
        state: toAddress.state || '',
        zip: toAddress.zip || toAddress.zipCode || toAddress.postal_code || '',
        country: toAddress.country || 'US',
        phone: toAddress.phone || '',
        email: toAddress.email || '',
        is_residential: toAddress.is_residential !== undefined ? toAddress.is_residential : true
      };
      
      // Formatear parcels - Shippo v2 API espera camelCase
      // CRÍTICO: Usar los valores reales del parcel, no valores por defecto
      // Si un valor es 0 o undefined, solo entonces usar el valor por defecto
      const formatParcel = (parcel) => {
        const length = parcel.length !== undefined && parcel.length !== null && parcel.length !== '' 
          ? String(parcel.length) : '5';
        const width = parcel.width !== undefined && parcel.width !== null && parcel.width !== '' 
          ? String(parcel.width) : '5';
        const height = parcel.height !== undefined && parcel.height !== null && parcel.height !== '' 
          ? String(parcel.height) : '5';
        const weight = parcel.weight !== undefined && parcel.weight !== null && parcel.weight !== '' 
          ? String(parcel.weight) : '1';
        
        return {
          length: length,
          width: width,
          height: height,
          distanceUnit: parcel.distanceUnit || parcel.distance_unit || 'in',  // camelCase
          weight: weight,
          massUnit: parcel.massUnit || parcel.mass_unit || 'lb'  // camelCase
        };
      };
      
      const formattedParcels = Array.isArray(parcels) 
        ? parcels.map(formatParcel)
        : [formatParcel(parcels)];
      
      console.log('📦 [ShippoService] Parcels formateados para Shippo:');
      formattedParcels.forEach((p, idx) => {
        console.log(`   Parcel ${idx + 1}:`, JSON.stringify(p, null, 2));
      });
      
      const shipmentData = {
        address_from: formattedFromAddress,
        address_to: formattedToAddress,
        parcels: formattedParcels,
        async: false // Síncrono para obtener rates inmediatamente
      };

      console.log('📦 [ShippoService] Enviando datos a Shippo para calcular rates:');
      console.log('   📤 Address From (Origen - Tienda):', {
        ciudad: formattedFromAddress.city,
        estado: formattedFromAddress.state,
        zip: formattedFromAddress.zip,
        calle: formattedFromAddress.street1
      });
      console.log('   📥 Address To (Destino - Cliente):', {
        ciudad: formattedToAddress.city,
        estado: formattedToAddress.state,
        zip: formattedToAddress.zip,
        calle: formattedToAddress.street1,
        nombre: formattedToAddress.name
      });
      console.log('   📦 Parcels:', JSON.stringify(formattedParcels, null, 2));
      console.log('   ✅ Los rates se calculan dinámicamente basándose en estas direcciones específicas');
      console.log('   ✅ Si cambias la dirección de destino, los rates cambiarán automáticamente');
      console.log('   ✅ Los rates NO están fijos - son calculados en tiempo real por Shippo según la distancia y ubicación');
      
      const response = await this.makeRequest('/api/shippo/shipments', {
        method: 'POST',
        body: JSON.stringify(shipmentData),
      });

      // Shippo devuelve rates en el objeto shipment
      return response.rates || [];
    } catch (error) {
      console.error('Error getting shipping rates:', error);
      throw error;
    }
  }

  // Crear transaction (comprar etiqueta)
  async createTransaction(rateId) {
    try {
      const response = await this.makeRequest('/api/shippo/transactions', {
        body: JSON.stringify({ rate: rateId }),
      });

      return response;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  // Crear parcel desde dimensiones
  createParcel(dimensions) {
    return {
      length: dimensions.length || '5',
      width: dimensions.width || '5',
      height: dimensions.height || '5',
      distance_unit: dimensions.distance_unit || 'in',
      weight: dimensions.weight || '1',
      mass_unit: dimensions.mass_unit || 'lb'
    };
  }

  // Crear shipment con una sola llamada (si ya conoces el carrier y service)
  async createLabelDirect(shipmentData, carrierAccount, servicelevelToken) {
    try {
      const response = await this.makeRequest('/api/shippo/transactions/instant', {
        body: JSON.stringify({
          shipment: shipmentData,
          carrier_account: carrierAccount,
          servicelevel_token: servicelevelToken
        }),
      });

      return response;
    } catch (error) {
      console.error('Error creating label directly:', error);
      throw error;
    }
  }
}

export default new ShippoService();

