import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Chip,
  Snackbar
} from '@mui/material';
import { CreditCard, Lock, Apple, Google, AccountBalance, Payment, Security, CheckCircle } from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const CheckoutForm = ({ cartItems, total, customerInfo, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe no está disponible. Por favor, recarga la página.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Enhanced error handling based on Stripe documentation
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: 'if_required'
      });

      if (stripeError) {
        // Enhanced error handling with specific error types
        let errorMessage = 'Error al procesar el pago';
        
        switch (stripeError.type) {
          case 'card_error':
            errorMessage = `Error de tarjeta: ${stripeError.message}`;
            break;
          case 'validation_error':
            errorMessage = `Error de validación: ${stripeError.message}`;
            break;
          case 'api_error':
            errorMessage = 'Error del servidor. Por favor, inténtalo de nuevo.';
            break;
          case 'authentication_error':
            errorMessage = 'Error de autenticación. Por favor, recarga la página.';
            break;
          case 'rate_limit_error':
            errorMessage = 'Demasiadas solicitudes. Por favor, espera un momento.';
            break;
          default:
            errorMessage = stripeError.message || 'Error desconocido';
        }
        
        setError(errorMessage);
        onError && onError(stripeError);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess && onSuccess(paymentIntent);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Error inesperado al procesar el pago');
      onError && onError(err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CreditCard sx={{ mr: 1, color: '#8B4513' }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#8B4513' }}>
            Información de Pago
          </Typography>
        </Box>


        {/* Total */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Total:
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#8B4513' }}>
            ${total.toFixed(2)}
          </Typography>
        </Box>


        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Payment Form */}
        <form onSubmit={handlePayment}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Información de la Tarjeta
            </Typography>
            <PaymentElement 
              options={{
                layout: 'tabs',
                fields: {
                  billingDetails: 'auto'
                }
              }}
            />
          </Box>
          
          <Button
            type="submit"
            disabled={!stripe || loading}
            fullWidth
            variant="contained"
            size="large"
            sx={{
              backgroundColor: '#8B4513',
              '&:hover': { backgroundColor: '#6B3410' },
              py: 2,
              borderRadius: '25px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1.1rem'
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <>
                <CreditCard sx={{ mr: 1 }} />
                Pagar ${total.toFixed(2)}
              </>
            )}
          </Button>
        </form>

        <Divider sx={{ my: 2 }} />

        {/* Security Information */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <Security sx={{ mr: 1, color: '#4CAF50', fontSize: '1rem' }} />
          <Typography variant="caption" sx={{ color: '#666' }}>
            Pago seguro procesado por Stripe • SSL encriptado
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip icon={<CreditCard />} label="Tarjetas" size="small" />
          <Chip icon={<Apple />} label="Apple Pay" size="small" />
          <Chip icon={<Google />} label="Google Pay" size="small" />
          <Chip icon={<AccountBalance />} label="Bancos" size="small" />
          <Chip icon={<Payment />} label="Afterpay" size="small" sx={{ backgroundColor: '#00A8E8', color: 'white' }} />
          <Chip icon={<Payment />} label="Klarna" size="small" sx={{ backgroundColor: '#FFB3C7', color: 'white' }} />
          <Chip icon={<Payment />} label="Affirm" size="small" sx={{ backgroundColor: '#00C4B8', color: 'white' }} />
        </Box>
      </CardContent>
    </Card>
  );
};

// Enhanced Stripe initialization with better error handling
const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_51234567890abcdef...',
  {
    apiVersion: '2023-10-16', // Stable API version
    locale: 'es' // Spanish locale
  }
);

const StripeCheckout = ({ cartItems, total, customerInfo, onSuccess, onError }) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Enhanced request with better error handling
        const response = await fetch('http://localhost:5000/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest' // CSRF protection
          },
          body: JSON.stringify({
            cartItems,
            total,
            customerInfo,
            captureMethod: 'automatic',
            metadata: {
              source: 'web_checkout',
              version: '2.0'
            }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError(`Error al configurar el pago: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (total > 0) {
      createPaymentIntent();
    }
  }, [total, cartItems, customerInfo]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setLoading(true);
    // Retry logic will be handled by useEffect
  };

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#8B4513',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'Ideal Sans, system-ui, sans-serif',
        spacingUnit: '2px',
        borderRadius: '4px',
      },
      rules: {
        '.Input': {
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          padding: '12px',
        },
        '.Input:focus': {
          border: '2px solid #8B4513',
          boxShadow: '0 0 0 3px rgba(139, 69, 19, 0.1)',
        }
      }
    },
    loader: 'auto',
    locale: 'es'
  };

  if (loading) {
    return (
      <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Configurando el pago...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              onClick={handleRetry}
              disabled={retryCount >= 3}
              sx={{ backgroundColor: '#8B4513', '&:hover': { backgroundColor: '#6B3410' } }}
            >
              Reintentar
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => window.location.reload()}
            >
              Recargar Página
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
        <CardContent>
          <Alert severity="warning">
            No se pudo configurar el pago. Por favor, verifica tu conexión.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm 
        cartItems={cartItems}
        total={total}
        customerInfo={customerInfo}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
};

export default StripeCheckout;
