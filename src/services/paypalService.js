// PayPal Service for backend operations
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = "AVB4RgfQ-5QsURuFvjuEozb155zmRaOnMq7K-8gZOQWSMRS2ChXP8YSo_RlLJ8HG9cCJvd7rglAnwS1m";
const PAYPAL_CLIENT_SECRET = "EGjLCduhMazEK4gPHZohA_nsMa3KpiCSHeZ8Kv-70yX2flsN4vMKkaROLinIWFtXieEg3xHIPvwNV4U_";

class PayPalService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Get access token for PayPal API calls
  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const credentials = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
      
      const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting PayPal access token:', error);
      throw error;
    }
  }

  // Verify payment with PayPal
  async verifyPayment(paymentId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(`${PAYPAL_BASE_URL}/v2/payments/captures/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to verify payment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying PayPal payment:', error);
      throw error;
    }
  }

  // Get order details
  async getOrderDetails(orderId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get order details: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting order details:', error);
      throw error;
    }
  }

  // Add tracking information to an order (Orders API v2)
  async addTrackingToOrder(orderId, trackingData) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/track`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          capture_id: trackingData.captureId,
          tracking_number: trackingData.trackingNumber,
          tracking_number_type: trackingData.trackingType || 'EXTERNAL',
          status: trackingData.status || 'SHIPPED',
          carrier: trackingData.carrier || 'OTHER',
          ...(trackingData.carrierNameOther && { carrier_name_other: trackingData.carrierNameOther }),
          ...(trackingData.trackingUrl && { tracking_url: trackingData.trackingUrl }),
          ...(trackingData.notifyBuyer && { notify_buyer: trackingData.notifyBuyer }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to add tracking: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding tracking to order:', error);
      throw error;
    }
  }

  // Update tracking information
  async updateTracking(orderId, trackingId, trackingData) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/trackers/${trackingId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tracking_number: trackingData.trackingNumber,
          status: trackingData.status,
          carrier: trackingData.carrier,
          ...(trackingData.carrierNameOther && { carrier_name_other: trackingData.carrierNameOther }),
          ...(trackingData.trackingUrl && { tracking_url: trackingData.trackingUrl }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update tracking: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating tracking:', error);
      throw error;
    }
  }

  // Get tracking information for an order
  async getTrackingInfo(orderId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get tracking info: ${response.statusText}`);
      }

      const orderData = await response.json();
      
      // Extract tracking information from the order
      const trackingInfo = [];
      if (orderData.purchase_units) {
        orderData.purchase_units.forEach(unit => {
          if (unit.shipping && unit.shipping.trackers) {
            trackingInfo.push(...unit.shipping.trackers);
          }
        });
      }

      return trackingInfo;
    } catch (error) {
      console.error('Error getting tracking info:', error);
      throw error;
    }
  }

  // Create refund for a payment
  async createRefund(captureId, refundData) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(`${PAYPAL_BASE_URL}/v2/payments/captures/${captureId}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: {
            value: refundData.amount,
            currency_code: refundData.currency || 'USD',
          },
          note_to_payer: refundData.note || 'Refund processed',
          ...(refundData.invoiceId && { invoice_id: refundData.invoiceId }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create refund: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating refund:', error);
      throw error;
    }
  }

  // Get payment details
  async getPaymentDetails(paymentId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(`${PAYPAL_BASE_URL}/v2/payments/captures/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get payment details: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting payment details:', error);
      throw error;
    }
  }
}

export default new PayPalService();
