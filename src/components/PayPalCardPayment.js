import React, { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  CreditCard,
  Security,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { PAYPAL_CONFIG } from '../paypal/config';
import paypalService from '../services/paypalService';
import { toast } from 'react-hot-toast';

// Componente interno para manejar el estado de PayPal
const PayPalButtonComponent = ({ amount, currency, description, onApprove, onError, onCancel }) => {
  const [{ isPending, isResolved, isRejected }] = usePayPalScriptReducer();

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
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          PayPal is not available. Please check your internet connection and try again.
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

const PayPalCardPayment = ({ 
  amount, 
  onSuccess, 
  onError, 
  currency = "USD",
  description = "Payment with credit/debit card"
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');

  const handleApprove = (data, actions) => {
    setIsProcessing(true);
    
    return actions.order.capture().then(async (details) => {
      console.log('Card payment completed:', details);
      
      try {
        // Verify payment with backend
        const verifiedPayment = await paypalService.verifyPayment(details.id);
        console.log('Card payment verified:', verifiedPayment);
        
        // Call success callback with verified payment data
        if (onSuccess) {
          onSuccess({
            ...details,
            verified: verifiedPayment,
            paymentMethod: 'card',
          });
        }
        
        toast.success('Card payment completed successfully!');
      } catch (error) {
        console.error('Card payment verification error:', error);
        toast.error('Payment verification failed. Please contact support.');
        
        if (onError) {
          onError(error);
        }
      } finally {
        setIsProcessing(false);
      }
    }).catch((error) => {
      console.error('Card payment error:', error);
      
      if (onError) {
        onError(error);
      }
      
      toast.error('Card payment failed. Please try again.');
      setIsProcessing(false);
    });
  };

  const handleError = (error) => {
    console.error('PayPal card payment error:', error);
    
    if (onError) {
      onError(error);
    }
    
    toast.error('Card payment error occurred.');
    setIsProcessing(false);
  };

  const handleCancel = (data) => {
    console.log('Card payment cancelled:', data);
    toast.error('Card payment was cancelled.');
    setIsProcessing(false);
  };

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
        "data-sdk-integration-source": "integrationbuilder_ac",
        "data-namespace": undefined,
        "data-client-token": undefined,
      }}
    >
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Pay with Credit/Debit Card
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Secure payment powered by PayPal
        </Typography>
        
        <PayPalButtonComponent
          amount={amount}
          currency={currency}
          description={description}
          onApprove={handleApprove}
          onError={handleError}
          onCancel={handleCancel}
        />
      </Box>
    </PayPalScriptProvider>
  );
};

export default PayPalCardPayment;
