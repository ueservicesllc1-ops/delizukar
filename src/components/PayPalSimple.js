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
  onError
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

  const handleCapture = (data, actions) => {
    console.log('PayPal Simple - Capturing payment:', data);
    
    return actions.order.capture().then((details) => {
      console.log('PayPal Simple - Payment captured:', details);
      
      if (onSuccess) {
        onSuccess({
          ...details,
          paymentMethod: 'paypal',
        });
      }
      
      toast.success('Payment completed successfully!');
    });
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
  description = "Payment with PayPal"
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
        />
      </Box>
    </PayPalScriptProvider>
  );
};

export default PayPalSimple;

