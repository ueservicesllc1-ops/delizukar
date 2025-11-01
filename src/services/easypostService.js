// Configuración de EasyPost
const EASYPOST_API_BASE = 'https://api.easypost.com/v2';

class EasyPostService {
  constructor() {
    this.baseURL = EASYPOST_API_BASE;
  }

  // Método helper para hacer requests
  async makeRequest(endpoint, options = {}) {
    // En producción usa window.location.origin
    // En desarrollo usa string vacío para que el proxy de React (package.json) redirija a localhost:5001
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : ''; // Usa proxy de React en desarrollo (configurado en package.json)
    
    const url = `${baseUrl}${endpoint}`;
    
    console.log(`Making POST request to ${url}`);
    console.log('Request data:', options.body ? JSON.parse(options.body) : null);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error making request:', error);
      throw error;
    }
  }

  // Obtener tarifas de envío
  async getShippingRates(fromAddress, toAddress, parcel) {
    try {
      const shipmentData = {
        address_from: fromAddress,
        address_to: toAddress,
        parcels: Array.isArray(parcel) ? parcel : [parcel]
      };

      console.log('Creating shipment with data:', shipmentData);
      
      const response = await this.makeRequest('/api/easypost/rates', {
        body: JSON.stringify(shipmentData),
      });

      return response.rates || [];
    } catch (error) {
      console.error('Error getting shipping rates:', error);
      throw error;
    }
  }

  // Crear dirección
  async createAddress(addressData) {
    try {
      const response = await this.makeRequest('/api/easypost/create-address', {
        body: JSON.stringify(addressData),
      });

      return response;
    } catch (error) {
      console.error('Error creating address:', error);
      throw error;
    }
  }

  // Validar dirección
  async validateAddress(addressData) {
    try {
      const response = await this.makeRequest('/api/easypost/create-address', {
        body: JSON.stringify({
          ...addressData,
          validate: true,
        }),
      });

      return response;
    } catch (error) {
      console.error('Error validating address:', error);
      throw error;
    }
  }

  // Crear parcel
  async createParcel(dimensions) {
    return {
      length: dimensions.length || '10',
      width: dimensions.width || '10',
      height: dimensions.height || '10',
      weight: dimensions.weight || '1',
      weight_unit: 'lb',
      distance_unit: 'in',
    };
  }
}

export default new EasyPostService();
