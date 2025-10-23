import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button, Card, CardContent, Typography, Box, Alert, CircularProgress } from '@mui/material';
import { CreditCard, ShoppingCart } from '@mui/icons-material';

// Inicializar Stripe con tu clave pública
const stripePromise = loadStripe('pk_test_51S37NHIfvAAsTaPnMUhWitBIraJUsz8fPmZkQeT8DyXxOILtroJbXDoJF96C36wSahGimqLb2zEFTdq9yggPf8Mq00wARuJH6Q');

const SimpleStripeCheckout = ({ cartItems, total, customerInfo, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('💳 Iniciando pago...');
      console.log('🛒 Productos:', cartItems);
      console.log('💰 Total:', total);
      console.log('👤 Cliente:', customerInfo.email);

      // 1. Crear sesión de pago en el backend
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems, total, customerInfo }),
      });

      const { sessionId, url } = await response.json();

      if (!sessionId) {
        throw new Error('No se pudo crear la sesión de pago');
      }

      console.log('✅ Sesión creada:', sessionId);

      // 2. Redirigir a Stripe Checkout
      const stripe = await stripePromise;
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: sessionId,
      });

      if (stripeError) {
        throw stripeError;
      }

    } catch (err) {
      console.error('❌ Error en el pago:', err);
      setError(err.message);
      onError && onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <ShoppingCart sx={{ mr: 1, color: '#c8626d' }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#c8626d' }}>
            Resumen del Pedido
          </Typography>
        </Box>

        {/* Lista de productos */}
        {cartItems.map((item, index) => (
          <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>{item.name} x{item.quantity}</Typography>
            <Typography sx={{ fontWeight: 600 }}>
              ${(item.price * item.quantity).toFixed(2)}
            </Typography>
          </Box>
        ))}

        <Box sx={{ borderTop: '1px solid #eee', pt: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Total:
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#c8626d' }}>
              ${total.toFixed(2)}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            onClick={handlePayment}
            disabled={loading || cartItems.length === 0}
            fullWidth
            variant="contained"
            size="large"
            sx={{
              backgroundColor: '#c8626d',
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
                Pagar con Stripe
              </>
            )}
          </Button>

          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 2, color: '#666' }}>
            Pago seguro procesado por Stripe
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SimpleStripeCheckout;
