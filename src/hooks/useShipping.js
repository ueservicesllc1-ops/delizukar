import { useState, useCallback } from 'react';
import shippoService from '../services/shippoService';

export const useShipping = () => {
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedRate, setSelectedRate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calcular tarifas de envío
  const calculateShippingRates = useCallback(async (fromAddress, toAddress, parcel) => {
    try {
      setLoading(true);
      setError(null);
      
      const rates = await shippoService.getShippingRates(fromAddress, toAddress, parcel);
      setShippingRates(rates);
      
      return rates;
    } catch (err) {
      console.error('Error calculating shipping rates:', err);
      setError('Error al calcular las tarifas de envío');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear dirección de envío
  const createShippingAddress = useCallback(async (addressData) => {
    try {
      setLoading(true);
      setError(null);
      
      const address = await shippoService.createAddress(addressData);
      return address;
    } catch (err) {
      console.error('Error creating shipping address:', err);
      setError('Error al crear la dirección de envío');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Validar dirección
  const validateAddress = useCallback(async (addressData) => {
    try {
      setLoading(true);
      setError(null);
      
      const validatedAddress = await shippoService.validateAddress(addressData);
      return validatedAddress;
    } catch (err) {
      console.error('Error validating address:', err);
      setError('Error al validar la dirección');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear parcel desde datos del carrito
  const createParcelFromCart = useCallback((cartItems) => {
    // Calcular peso total (asumiendo 0.2 lb por galleta)
    const totalWeight = cartItems.reduce((total, item) => {
      return total + (item.quantity * 0.2);
    }, 0);

    // Dimensiones estándar para una caja de galletas
    const baseDimensions = {
      length: 8, // pulgadas
      width: 6,
      height: 4
    };

    // Ajustar dimensiones según cantidad de productos
    const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    const heightMultiplier = Math.ceil(itemCount / 6); // 6 galletas por nivel

    return shippoService.createParcel(
      totalWeight,
      baseDimensions.length,
      baseDimensions.width,
      baseDimensions.height * heightMultiplier
    );
  }, []);

  // Crear datos de orden para Shippo Elements
  const createOrderData = useCallback((cartItems, fromAddress, toAddress) => {
    const parcel = createParcelFromCart(cartItems);
    
    return {
      address_from: fromAddress,
      address_to: toAddress,
      parcels: [parcel],
      shipment_date: new Date().toISOString().split('T')[0],
      metadata: `Delizukar Order - ${new Date().toISOString()}`
    };
  }, [createParcelFromCart]);

  // Manejar compra de etiqueta exitosa
  const handleLabelPurchased = useCallback((transactionData) => {
    console.log('Label purchased successfully:', transactionData);
    
    // Aquí puedes guardar la información en tu base de datos
    const labelInfo = {
      trackingNumber: transactionData.tracking_number,
      labelUrl: transactionData.label_url,
      packingSlipUrl: transactionData.packing_slip_url,
      eta: transactionData.eta,
      cost: transactionData.rate?.amount,
      carrier: transactionData.rate?.provider,
      serviceLevel: transactionData.rate?.servicelevel?.name
    };

    // Guardar en localStorage o enviar al servidor
    localStorage.setItem('lastShippingLabel', JSON.stringify(labelInfo));
    
    return labelInfo;
  }, []);

  // Manejar creación de orden
  const handleOrderCreated = useCallback((orderData) => {
    console.log('Order created:', orderData);
    
    // Guardar el order_id para futuras referencias
    localStorage.setItem('shippoOrderId', orderData.order_id);
    
    return orderData;
  }, []);

  // Limpiar estado
  const clearShippingData = useCallback(() => {
    setShippingRates([]);
    setSelectedRate(null);
    setError(null);
  }, []);

  return {
    shippingRates,
    selectedRate,
    loading,
    error,
    calculateShippingRates,
    createShippingAddress,
    validateAddress,
    createParcelFromCart,
    createOrderData,
    handleLabelPurchased,
    handleOrderCreated,
    clearShippingData,
    setSelectedRate
  };
};



