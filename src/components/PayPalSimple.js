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

  const handleApprove = (data, actions) => {
    console.log('PayPal Simple - Creating order for amount:', amount);
    
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            value: amount.toString(),
            currency_code: currency,
          },
          description: description,
        },
      ],
    }).then((orderId) => {
      console.log('PayPal Simple - Order created:', orderId);
      return orderId;
    });
  };

  const handleCapture = async (data, actions) => {
    console.log('🔵🔵🔵 [PayPal] FUNCIÓN handleCapture LLAMADA');
    console.log('🔵 [PayPal] Iniciando captura de pago...');
    console.log('🔵 [PayPal] Data:', data);
    console.log('🔵 [PayPal] onSuccess existe?', typeof onSuccess);
    
    try {
      console.log('🔵 [PayPal] Llamando actions.order.capture()...');
      const details = await actions.order.capture();
      console.log('✅ [PayPal] Pago capturado exitosamente:', details);
      
      // Llamar onSuccess directamente como funcionaba antes
      if (onSuccess) {
        console.log('🔵 [PayPal] Llamando onSuccess callback...');
        onSuccess({
          ...details,
          paymentMethod: 'paypal',
          amount: amount
        });
        console.log('✅ [PayPal] onSuccess ejecutado');
      }
      
      toast.success('Payment completed successfully!');
      console.log('✅ [PayPal] Todo completado exitosamente');
    } catch (error) {
      console.error('❌ [PayPal] Error capturando pago:', error);
      console.error('❌ [PayPal] Stack:', error.stack);
      if (onError) {
        onError(error);
      }
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
      createOrder={handleApprove}
      onApprove={handleCapture}
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

  return (
    <PayPalScriptProvider 
      options={{
        "client-id": clientId,
        currency: currency,
        intent: 'capture',
        components: 'buttons',
        "enable-funding": 'card,credit,paypal',
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

