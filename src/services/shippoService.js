// Configuración de Shippo
const SHIPPO_API_TOKEN = 'shippo_test_067939bd744254985bb01ba3567591c692cfc4e6';
const SHIPPO_API_BASE = 'https://api.goshippo.com';

class ShippoService {
  constructor() {
    this.apiToken = SHIPPO_API_TOKEN;
    this.baseURL = SHIPPO_API_BASE;
  }

  // Método helper para hacer requests a la API (ahora a través del backend)
  async makeRequest(endpoint, method = 'GET', data = null) {
    // Mapear endpoints de Shippo a endpoints del backend
    const backendEndpoint = this.mapToBackendEndpoint(endpoint);
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://delizukar-production.up.railway.app'
      : 'http://localhost:5000';
    const url = `${baseUrl}/api/shippo${backendEndpoint}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      console.log(`Making ${method} request to ${url}`);
      console.log('Request data:', data);
      
      const response = await fetch(url, options);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Response data:', result);
      return result;
    } catch (error) {
      console.error(`Error making request to ${endpoint}:`, error);
      throw error;
    }
  }

  // Mapear endpoints de Shippo a endpoints del backend
  mapToBackendEndpoint(shippoEndpoint) {
    if (shippoEndpoint === '/account/') {
      return '/account';
    } else if (shippoEndpoint === '/addresses/') {
      return '/create-address';
    } else if (shippoEndpoint === '/shipments/') {
      return '/rates';
    }
    return shippoEndpoint;
  }

  // Probar la conexión con Shippo
  async testConnection() {
    try {
      const account = await this.getAccountInfo();
      console.log('Shippo connection successful:', account);
      return true;
    } catch (error) {
      console.error('Shippo connection failed:', error);
      return false;
    }
  }

  // Generar JWT para Shipping Elements
  async generateJWT() {
    try {
      const response = await fetch('https://api.goshippo.com/embedded/authz/', {
        method: 'POST',
        headers: {
          'Authorization': `ShippoToken ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scope: 'embedded:carriers'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('JWT Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('JWT Response:', data);
      return data.jwt;
    } catch (error) {
      console.error('Error generating JWT:', error);
      throw error;
    }
  }

  // Crear dirección
  async createAddress(addressData) {
    try {
      const address = await this.makeRequest('/addresses/', 'POST', addressData);
      return address;
    } catch (error) {
      console.error('Error creating address:', error);
      throw error;
    }
  }

  // Obtener tarifas de envío
  async getShippingRates(fromAddress, toAddress, parcel) {
    try {
      console.log('Creating shipment with data:', {
        address_from: fromAddress,
        address_to: toAddress,
        parcels: [parcel]
      });

      const shipment = await this.makeRequest('/shipments/', 'POST', {
        address_from: fromAddress,
        address_to: toAddress,
        parcels: [parcel]
      });

      console.log('Shipment created:', shipment);
      return shipment.rates || [];
    } catch (error) {
      console.error('Error getting shipping rates:', error);
      
      // Si hay error, devolver tarifas de ejemplo para desarrollo
      if (error.message.includes('401') || error.message.includes('403')) {
        console.log('Using mock rates for development');
        return this.getMockRates();
      }
      
      throw error;
    }
  }

  // Tarifas de ejemplo para desarrollo
  getMockRates() {
    return [
      {
        object_id: 'rate_1',
        provider: 'usps',
        servicelevel: { name: 'USPS Ground' },
        amount: '12.50',
        currency: 'USD',
        eta: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        object_id: 'rate_2',
        provider: 'fedex',
        servicelevel: { name: 'FedEx Ground' },
        amount: '15.75',
        currency: 'USD',
        eta: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        object_id: 'rate_3',
        provider: 'ups',
        servicelevel: { name: 'UPS Ground' },
        amount: '14.25',
        currency: 'USD',
        eta: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  // Crear transacción (comprar etiqueta)
  async createTransaction(rateId) {
    try {
      const transaction = await this.makeRequest('/transactions/', 'POST', {
        rate: rateId,
        label_file_type: 'PDF',
        async: false
      });

      return transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  // Rastrear envío
  async trackShipment(trackingNumber, carrier) {
    try {
      const tracking = await this.makeRequest(`/tracks/${carrier}/${trackingNumber}/`);
      return tracking;
    } catch (error) {
      console.error('Error tracking shipment:', error);
      throw error;
    }
  }

  // Obtener información de la cuenta
  async getAccountInfo() {
    try {
      const account = await this.makeRequest('/account/');
      return account;
    } catch (error) {
      console.error('Error getting account info:', error);
      throw error;
    }
  }

  // Validar dirección
  async validateAddress(addressData) {
    try {
      const validatedAddress = await this.makeRequest('/addresses/', 'POST', {
        ...addressData,
        validate: true
      });
      return validatedAddress;
    } catch (error) {
      console.error('Error validating address:', error);
      throw error;
    }
  }

  // Corregir dirección usando la API de validación de Shippo
  async correctAddress(addressData) {
    try {
      // Crear dirección con validación
      const validatedAddress = await this.validateAddress(addressData);
      
      // Verificar si la dirección necesita corrección
      if (validatedAddress.validation_results && validatedAddress.validation_results.is_valid === false) {
        // La dirección tiene problemas, devolver sugerencias
        return {
          original: addressData,
          corrected: validatedAddress,
          needsCorrection: true,
          suggestions: validatedAddress.validation_results.messages || [],
          isResidential: validatedAddress.is_residential
        };
      } else {
        // La dirección es válida
        return {
          original: addressData,
          corrected: validatedAddress,
          needsCorrection: false,
          suggestions: [],
          isResidential: validatedAddress.is_residential
        };
      }
    } catch (error) {
      console.error('Error correcting address:', error);
      throw error;
    }
  }

  // Obtener sugerencias de direcciones
  async getAddressSuggestions(partialAddress) {
    try {
      // Usar la API de validación para obtener sugerencias
      const suggestions = await this.makeRequest('/addresses/', 'POST', {
        ...partialAddress,
        validate: true
      });
      
      return suggestions;
    } catch (error) {
      console.error('Error getting address suggestions:', error);
      throw error;
    }
  }

  // Crear parcel (paquete)
  createParcel(weight, length, width, height, weightUnit = 'lb', dimensionUnit = 'in') {
    return {
      weight: weight.toString(),
      length: length.toString(),
      width: width.toString(),
      height: height.toString(),
      weight_unit: weightUnit,
      dimension_unit: dimensionUnit
    };
  }

  // Crear dirección desde datos del formulario
  createAddressFromForm(formData) {
    return {
      name: formData.name,
      company: formData.company || '',
      street1: formData.street1,
      street2: formData.street2 || '',
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
      country: formData.country || 'US',
      phone: formData.phone || '',
      email: formData.email || '',
      is_residential: formData.is_residential !== false
    };
  }
}

export default new ShippoService();
