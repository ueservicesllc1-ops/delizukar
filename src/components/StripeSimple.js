import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button, Card, CardContent, Typography, Box, Alert, CircularProgress } from '@mui/material';
import { CreditCard } from '@mui/icons-material';

const stripePromise = loadStripe('pk_test_51S37NHIfvAAsTaPnMUhWitBIraJUsz8fPmZkQeT8DyXxOILtroJbXDoJF96C36wSahGimqLb2zEFTdq9yggPf8Mq00wARuJH6Q');

const StripeSimple = ({ cartItems, total, customerInfo, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Crear sesión en backend
      const response = await fetch('http://localhost:5001/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems, total, customerInfo }),
      });

      const { sessionId } = await response.json();

      // 2. Redirigir a Stripe
      const stripe = await stripePromise;
      await stripe.redirectToCheckout({ sessionId });

    } catch (err) {
      setError(err.message);
      onError && onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
      <CardContent>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
          Resumen del Pedido
        </Typography>

        {cartItems.map((item, index) => (
          <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>{item.name} x{item.quantity}</Typography>
            <Typography>${(item.price * item.quantity).toFixed(2)}</Typography>
          </Box>
        ))}

        <Box sx={{ borderTop: '1px solid #eee', pt: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">Total:</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#8B4513' }}>
              ${total.toFixed(2)}
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Button
            onClick={handlePayment}
            disabled={loading}
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
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <>
                <CreditCard sx={{ mr: 1 }} />
                Pagar con Stripe
              </>
            )}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StripeSimple;
