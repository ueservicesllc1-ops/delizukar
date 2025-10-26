import React, { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material';
import { PAYPAL_CONFIG } from '../paypal/config';
import { toast } from 'react-hot-toast';

// Componente interno para manejar el estado de PayPal
const PayPalButtonWrapper = ({ amount, currency, description, onApprove, onError, onCancel }) => {
  const [{ isPending, isResolved, isRejected, options }, dispatch] = usePayPalScriptReducer();

  // Debug: Mostrar información de configuración
  useEffect(() => {
    console.log('PayPal Configuration:', {
      clientId: options.clientId,
      currency: options.currency,
      intent: options.intent,
      environment: options.environment || 'sandbox'
    });
  }, [options]);

  if (isPending) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading PayPal...
        </Typography>
      </Box>
    );
  }

  if (isRejected) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          PayPal is not available. Please check your internet connection and try again.
        </Alert>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Configuration: {JSON.stringify({
            clientId: options.clientId,
            currency: options.currency,
            intent: options.intent
          }, null, 2)}
        </Typography>
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
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Initializing PayPal...
        </Typography>
      </Box>
    );
  }

  return (
    <PayPalButtons
      style={{
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'pay',
        height: 45,
      }}
      createOrder={(data, actions) => {
        console.log('Creating PayPal order for amount:', amount);
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
        });
      }}
      onApprove={onApprove}
      onError={onError}
      onCancel={onCancel}
    />
  );
};

const PayPalCheckout = ({ 
  amount, 
  onSuccess, 
  onError, 
  currency = "USD",
  description = "Payment with PayPal"
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = (data, actions) => {
    setIsProcessing(true);
    
    return actions.order.capture().then(async (details) => {
      console.log('PayPal payment completed:', details);
      
      try {
        // Call success callback with payment data
        if (onSuccess) {
          onSuccess({
            ...details,
            paymentMethod: 'paypal',
          });
        }
        
        toast.success('PayPal payment completed successfully!');
      } catch (error) {
        console.error('PayPal payment error:', error);
        toast.error('Payment processing failed. Please contact support.');
        
        if (onError) {
          onError(error);
        }
      } finally {
        setIsProcessing(false);
      }
    }).catch((error) => {
      console.error('PayPal payment error:', error);
      
      if (onError) {
        onError(error);
      }
      
      toast.error('PayPal payment failed. Please try again.');
      setIsProcessing(false);
    });
  };

  const handleError = (error) => {
    console.error('PayPal error:', error);
    
    if (onError) {
      onError(error);
    }
    
    toast.error('PayPal error occurred.');
    setIsProcessing(false);
  };

  const handleCancel = (data) => {
    console.log('PayPal payment cancelled:', data);
    toast.error('PayPal payment was cancelled.');
    setIsProcessing(false);
  };

  // Verificar que el Client ID esté configurado
  if (!PAYPAL_CONFIG.clientId || PAYPAL_CONFIG.clientId === 'sb') {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          PayPal Client ID not configured. Please check your environment variables.
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Current Client ID: {PAYPAL_CONFIG.clientId}
        </Typography>
      </Box>
    );
  }

  return (
    <PayPalScriptProvider 
      options={{
        clientId: PAYPAL_CONFIG.clientId,
        currency: currency,
        intent: PAYPAL_CONFIG.intent,
        components: 'buttons',
        enableFunding: 'card,credit',
        disableFunding: 'paypal',
        debug: process.env.NODE_ENV === 'development',
        vault: false,
      }}
    >
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Pay with PayPal
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Secure payment powered by PayPal
        </Typography>
        
        {isProcessing ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Processing your payment...
            </Typography>
          </Box>
        ) : (
          <PayPalButtonWrapper
            amount={amount}
            currency={currency}
            description={description}
            onApprove={handleApprove}
            onError={handleError}
            onCancel={handleCancel}
          />
        )}
      </Box>
    </PayPalScriptProvider>
  );
};

export default PayPalCheckout;