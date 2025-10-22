import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { CreditCard, Lock } from '@mui/icons-material';

// Configuración de Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_51234567890abcdef...');

// Componente del formulario de pago
const PaymentForm = ({ amount, onSuccess, onError, orderDetails }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Crear PaymentIntent en el backend
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Stripe usa centavos
          currency: 'usd',
          orderDetails: orderDetails
        }),
      });

      const { clientSecret } = await response.json();

      // Confirmar el pago
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: orderDetails.customerName,
              email: orderDetails.customerEmail,
            },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        onError && onError(stripeError);
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess && onSuccess(paymentIntent);
      }
    } catch (err) {
      setError('Error al procesar el pago. Por favor, inténtalo de nuevo.');
      onError && onError(err);
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <Card sx={{ maxWidth: 500, mx: 'auto', mt: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Lock sx={{ mr: 1, color: '#8B4513' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#8B4513' }}>
            Pago Seguro
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
          Tu información de pago está protegida con encriptación de nivel bancario.
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Información de la Tarjeta
            </Typography>
            <Box
              sx={{
                p: 2,
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#fafafa'
              }}
            >
              <CardElement options={cardElementOptions} />
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            disabled={!stripe || loading}
            fullWidth
            variant="contained"
            size="large"
            sx={{
              backgroundColor: '#8B4513',
              '&:hover': { backgroundColor: '#6B3410' },
              py: 1.5,
              borderRadius: '25px',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <>
                <CreditCard sx={{ mr: 1 }} />
                Pagar ${amount.toFixed(2)}
              </>
            )}
          </Button>
        </form>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="caption" sx={{ color: '#666', textAlign: 'center' }}>
            Procesado de forma segura por Stripe
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// Componente principal con Elements wrapper
const StripePaymentForm = ({ amount, onSuccess, onError, orderDetails }) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm
        amount={amount}
        onSuccess={onSuccess}
        onError={onError}
        orderDetails={orderDetails}
      />
    </Elements>
  );
};

export default StripePaymentForm;
