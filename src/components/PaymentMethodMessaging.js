import React from 'react';
import { Box, Typography } from '@mui/material';
import { Payment } from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentMethodMessagingElement } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_51234567890abcdef...');

const PaymentMethodMessaging = ({ amount, currency = 'USD', countryCode = 'US' }) => {
  // Convert amount to cents for Stripe
  const amountInCents = amount ? Math.round(amount * 100) : 0;
  
  // Only show if amount is within eligible range
  if (amountInCents < 100 || amountInCents > 400000) {
    return null;
  }
  
  return (
    <Box sx={{ 
      p: 2, 
      backgroundColor: '#f8f9fa', 
      borderRadius: 2,
      border: '1px solid #e9ecef',
      mb: 2
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Payment sx={{ color: '#00A8E8', fontSize: '1.2rem' }} />
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
          Opciones de pago flexibles disponibles
        </Typography>
      </Box>
      
      <Elements 
        stripe={stripePromise}
        options={{
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#8B4513',
              colorBackground: '#ffffff',
              colorText: '#30313d',
              fontFamily: 'Ideal Sans, system-ui, sans-serif',
              fontSizeBase: '14px',
              spacingUnit: '4px',
            }
          }
        }}
      >
        <PaymentMethodMessagingElement
          options={{
            amount: amountInCents,
            currency: currency,
            countryCode: countryCode,
            paymentMethodTypes: ['klarna', 'afterpay_clearpay', 'affirm'],
            paymentMethodOrder: ['afterpay_clearpay', 'klarna', 'affirm']
          }}
        />
      </Elements>
      
      <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 1 }}>
        Financiamiento disponible • Aprobación instantánea • Sin intereses
      </Typography>
    </Box>
  );
};

export default PaymentMethodMessaging;
