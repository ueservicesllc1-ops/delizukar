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
  Chip
} from '@mui/material';
import { CreditCard, Apple, Google, AccountBalance, Payment, Security } from '@mui/icons-material';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise, STRIPE_ELEMENTS_CONFIG } from '../stripe/config';

const CheckoutForm = ({ cartItems, total, customerInfo, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMounted, setIsMounted] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (paymentSuccess) {
      console.log('🎉 Payment success state changed to true');
    }
  }, [paymentSuccess]);

  const handlePayment = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('🔍 handlePayment called');

    if (!isMounted) {
      console.log('❌ Component not mounted, returning');
      return;
    }

    if (!stripe || !elements) {
      console.log('❌ Stripe not available');
      setError('Stripe no está disponible. Por favor, recarga la página.');
      return;
    }

    console.log('✅ Starting payment process');
    setLoading(true);
    setError(null);
    setPaymentSuccess(false); // Reset success state

    try {
      // Enhanced error handling based on Stripe documentation
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: 'if_required'
      });

      if (!isMounted) return;

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
        console.log('✅ Payment succeeded:', paymentIntent);
        console.log('🔍 Setting paymentSuccess to true');
        setPaymentSuccess(true);
        
        // Guardar el payment intent ID para la página de éxito
        localStorage.setItem('lastPaymentIntentId', paymentIntent.id);
        console.log('💾 Payment Intent ID saved:', paymentIntent.id);
        
        // Guardar la orden en Firestore
        try {
          const orderData = {
            sessionId: paymentIntent.id, // Usar paymentIntent.id como sessionId
            paymentIntentId: paymentIntent.id,
            customerInfo: customerInfo,
            cartItems: cartItems,
            total: total,
            paymentStatus: 'paid',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          const baseUrl = process.env.NODE_ENV === 'production' 
            ? window.location.origin 
            : 'http://localhost:5000';
          const response = await fetch(`${baseUrl}/api/create-order`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('✅ Order saved to Firestore:', result.orderId);
            localStorage.setItem('lastOrderId', result.orderId);
          } else {
            console.error('❌ Error saving order to Firestore');
          }
        } catch (error) {
          console.error('❌ Error saving order:', error);
        }
        
        console.log('🔍 Payment success state set, showing success message');
        // Mostrar mensaje de éxito por 3 segundos antes de redirigir
        setTimeout(() => {
          console.log('🔍 Timeout completed, calling onSuccess');
          // Pasar el payment intent ID al callback
          onSuccess && onSuccess(paymentIntent);
        }, 3000);
      } else {
        console.log('🔍 Payment result:', { stripeError, paymentIntent });
      }
    } catch (err) {
      console.error('❌ Payment error:', err);
      if (isMounted) {
        setError('Error inesperado al procesar el pago');
        onError && onError(err);
      }
    } finally {
      console.log('🔍 Payment process finished');
      if (isMounted) {
        setLoading(false);
      }
    }
  };


  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CreditCard sx={{ mr: 1, color: '#c8626d' }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#c8626d' }}>
            Información de Pago
          </Typography>
        </Box>


        {/* Total */}
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

        {paymentSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ mr: 1 }}>✅</Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  ¡Pago Exitoso!
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Tu pago ha sido procesado correctamente. Redirigiendo...
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Preparando tu pedido...
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Alert>
        )}


        {/* Payment Form */}
        {!paymentSuccess && (
          <form>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Información de la Tarjeta
              </Typography>
              <PaymentElement 
                options={{
                  layout: 'tabs',
                  fields: {
                    billingDetails: 'auto'
                  },
                  paymentMethodOrder: ['card'],
                  wallets: {
                    applePay: 'auto',
                    googlePay: 'auto'
                  }
                }}
              />
            </Box>
            
            <Button
              type="button"
              onClick={handlePayment}
              disabled={!stripe || loading}
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
                  Pagar ${total.toFixed(2)}
                </>
              )}
            </Button>
          </form>
        )}

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

const StripeCheckout = ({ cartItems, total, customerInfo, onSuccess, onError }) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Enhanced request with better error handling
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? window.location.origin 
          : 'http://localhost:5000';
        const response = await fetch(`${baseUrl}/api/create-payment-intent`, {
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
        console.log('✅ ClientSecret received:', clientSecret ? 'Present' : 'Missing');
        if (isMounted) {
          setClientSecret(clientSecret);
        }
      } catch (err) {
        console.error('Error creating payment intent:', err);
        if (isMounted) {
          setError(`Error al configurar el pago: ${err.message}`);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (total > 0 && isMounted) {
      createPaymentIntent();
    }
  }, [total, cartItems, customerInfo, isMounted]);

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
        colorPrimary: '#c8626d',
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
          border: '2px solid #c8626d',
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
              sx={{ backgroundColor: '#c8626d', '&:hover': { backgroundColor: '#6B3410' } }}
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
    console.log('❌ No clientSecret available');
    return (
      <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
        <CardContent>
          <Alert severity="warning">
            No se pudo configurar el pago. Por favor, verifica tu conexión.
          </Alert>
          <Typography variant="body2" sx={{ mt: 2, color: '#666' }}>
            Debug: clientSecret = {clientSecret ? 'Present' : 'Missing'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  console.log('🔍 Rendering Elements with clientSecret:', clientSecret ? 'Present' : 'Missing');
  console.log('🔍 Stripe options:', options);
  
  // Verificar que clientSecret esté presente
  if (!clientSecret) {
    return (
      <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Configurando el pago...</Typography>
            <Typography variant="body2" sx={{ mt: 2, color: '#666' }}>
              Debug: clientSecret = Missing
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Elements 
      stripe={stripePromise} 
      options={options}
      key={`stripe-${clientSecret}-${Date.now()}`}
    >
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
