import React, { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material';
import { toast } from 'react-hot-toast';

// Internal component to handle PayPal state
const PayPalButtonContainer = ({ 
  amount, 
  currency, 
  description,
  onSuccess,
  onError,
  shippingAddress,
  shippingInfo
}) => {
  const [{ isResolved, isRejected }] = usePayPalScriptReducer();

  if (isRejected) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          PayPal is not available. Please check your internet connection and try again.
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          sx={{ backgroundColor: '#c8626d' }}
        >
          Refresh Page
        </Button>
      </Box>
    );
  }

  if (!isResolved) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" py={4}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading PayPal...
        </Typography>
      </Box>
    );
  }

  console.log('🎯 [PayPal] PayPalButtonContainer renderizado, onSuccess:', typeof onSuccess);

  const handleCreateOrder = (data, actions) => {
    console.log('🔵 [PayPal] Creating order for amount:', amount);
    console.log('🔵 [PayPal] Currency:', currency);
    console.log('🔵 [PayPal] Description:', description);
    
    return actions.order.create({
      intent: 'CAPTURE', // Explicitly set intent
      purchase_units: [
        {
          amount: {
            value: parseFloat(amount).toFixed(2), // Ensure proper formatting
            currency_code: currency,
          },
          description: description,
        },
      ],
      application_context: {
        shipping_preference: 'NO_SHIPPING' // We handle shipping separately
      }
    }).then((orderId) => {
      console.log('✅ [PayPal] Order created successfully:', orderId);
      return orderId;
    }).catch((error) => {
      console.error('❌ [PayPal] Error creating order:', error);
      throw error;
    });
  };

  const handleApprove = async (data, actions) => {
    console.log('🔵🔵🔵 [PayPal] FUNCIÓN handleCapture LLAMADA');
    console.log('🔵 [PayPal] Iniciando captura de pago...');
    console.log('🔵 [PayPal] Data:', data);
    console.log('🔵 [PayPal] onSuccess existe?', typeof onSuccess);
    
    try {
      console.log('🔵 [PayPal] Llamando actions.order.capture()...');
      const details = await actions.order.capture();
      console.log('✅ [PayPal] Pago capturado exitosamente:', details);
      
      // Mostrar mensaje de éxito inmediatamente
      toast.success('Payment completed successfully!');
      
      // Llamar onSuccess directamente como funcionaba antes
      if (onSuccess) {
        console.log('🔵 [PayPal] Llamando onSuccess callback...');
        
        // Usar setTimeout para asegurar que el callback se ejecute después de que PayPal cierre
        setTimeout(() => {
          onSuccess({
            ...details,
            paymentMethod: 'paypal',
            amount: amount
          });
          console.log('✅ [PayPal] onSuccess ejecutado');
        }, 100);
      }
      
      console.log('✅ [PayPal] Todo completado exitosamente');
      
      // Retornar para que PayPal sepa que el pago fue procesado exitosamente
      return details;
    } catch (error) {
      console.error('❌ [PayPal] Error capturando pago:', error);
      console.error('❌ [PayPal] Stack:', error.stack);
      toast.error('Payment processing failed. Please try again.');
      if (onError) {
        onError(error);
      }
      throw error; // Re-throw para que PayPal maneje el error
    }
  };

  const handleError = (error) => {
    console.error('PayPal Simple - Error:', error);
    
    if (onError) {
      onError(error);
    }
    
    toast.error('Payment failed. Please try again.');
  };

  const handleCancel = (data) => {
    console.log('PayPal Simple - Payment cancelled:', data);
    toast.error('Payment was cancelled.');
  };

  console.log('🎯🎯 [PayPal] Renderizando PayPalButtons, onSuccess es:', typeof onSuccess);

  return (
    <PayPalButtons
      style={{
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'pay',
        height: 45,
      }}
      createOrder={handleCreateOrder}
      onApprove={handleApprove}
      onError={handleError}
      onCancel={handleCancel}
    />
  );
};

const PayPalSimple = ({ 
  amount, 
  onSuccess, 
  onError, 
  currency = "USD",
  description = "Payment with PayPal",
  shippingAddress = null,
  shippingInfo = null
}) => {
  // Obtener configuración desde variables de entorno
  const clientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;

  // Verificar configuración
  if (!clientId || clientId === 'sb') {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          PayPal Client ID not configured
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Please configure REACT_APP_PAYPAL_CLIENT_ID in your .env.local file
        </Typography>
      </Box>
    );
  }

  // Obtener el environment de las variables de entorno
  const environment = process.env.REACT_APP_PAYPAL_ENVIRONMENT || 'sandbox';
  
  console.log('🔧 PayPal Configuration:', {
    clientId: clientId.substring(0, 20) + '...',
    environment: environment,
    currency: currency
  });

  return (
    <PayPalScriptProvider 
      options={{
        "client-id": clientId,
        currency: currency,
        intent: 'capture',
        components: 'buttons',
        "enable-funding": 'card,credit,paypal',
        "disable-funding": '',
        vault: false,
        commit: true, // Forzar que el botón diga "Pay Now" y cierre después del pago
        "data-sdk-integration-source": "integrationbuilder_sc",
      }}
    >
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Pay with PayPal
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Secure payment powered by PayPal
        </Typography>
        
        <PayPalButtonContainer
          amount={amount}
          currency={currency}
          description={description}
          onSuccess={onSuccess}
          onError={onError}
          shippingAddress={shippingAddress}
          shippingInfo={shippingInfo}
        />
      </Box>
    </PayPalScriptProvider>
  );
};

export default PayPalSimple;

