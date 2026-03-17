import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import PayPalCheckout from './PayPalCheckout';
import PayPalCardPayment from './PayPalCardPayment';
import PayPalSimple from './PayPalSimple';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

const PAYPAL_TRANSLATIONS = {
  es: {
    'paypal.summary': 'Resumen de pago',
    'paypal.subtotal': 'Subtotal:',
    'paypal.shipping': 'Envío:',
    'paypal.free': 'Gratis',
    'paypal.total': 'Total:',
    'paypal.method': 'Método de Pago',
    'paypal.disclaimer': 'Pago seguro procesado por PayPal - Acepta las principales tarjetas de crédito/débito',
    'paypal.processing': 'Procesando tu pago...',
    'paypal.shippingAddress': 'Dirección de Envío',
    'paypal.emptyCart': 'Tu carrito está vacío',
    'paypal.success_message': '¡Pago completado con éxito!',
    'paypal.error_message': 'El pago falló. Por favor, inténtelo de nuevo.',
    'paypal.cancel_message': 'El pago fue cancelado.'
  },
  en: {
    'paypal.summary': 'Payment Summary',
    'paypal.subtotal': 'Subtotal:',
    'paypal.shipping': 'Shipping:',
    'paypal.free': 'Free',
    'paypal.total': 'Total:',
    'paypal.method': 'Payment Method',
    'paypal.disclaimer': 'Secure payment powered by PayPal - Accepts all major credit/debit cards',
    'paypal.processing': 'Processing your payment...',
    'paypal.shippingAddress': 'Shipping Address',
    'paypal.emptyCart': 'Your cart is empty',
    'paypal.success_message': 'Payment completed successfully!',
    'paypal.error_message': 'Payment failed. Please try again.',
    'paypal.cancel_message': 'Payment was cancelled.'
  }
};

const PayPalPaymentForm = ({ 
  cartItems = [], 
  onPaymentSuccess, 
  onPaymentError,
  shippingAddress = null,
  shippingInfo = null
}) => {
  const { language } = useLanguage();
  const t = (key) => {
    const dict = PAYPAL_TRANSLATIONS[language] || PAYPAL_TRANSLATIONS.es;
    return dict[key] || key;
  };

  const [orderData, setOrderData] = useState({
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');

  // Calculate order totals
  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Use real shipping cost if available, otherwise default to $10
      let shipping = 0;
      if (shippingInfo && shippingInfo.cost) {
        shipping = parseFloat(shippingInfo.cost);
      } else {
        shipping = 10; // Default shipping cost
      }
      
      const tax = 0; // No tax for cookies
      const total = subtotal + shipping + tax;

      setOrderData({
        subtotal: subtotal.toFixed(2),
        shipping: shipping.toFixed(2),
        total: total.toFixed(2),
      });
    }
  }, [cartItems, shippingInfo]);

  const handlePaymentSuccess = (details) => {
    console.log('Payment successful:', details);
    console.log('💰 Order data when payment succeeds:', orderData);
    setIsProcessing(true);
    
    // Here you would typically send the payment details to your backend
    // to verify the payment and update your database
    
    if (onPaymentSuccess) {
      const paymentDetails = {
        paymentId: details.id,
        status: details.status,
        amount: orderData.total,
        currency: 'USD',
        payer: details.payer,
        create_time: details.create_time,
        update_time: details.update_time,
      };
      console.log('💰 Sending payment details to parent:', paymentDetails);
      onPaymentSuccess(paymentDetails);
    }
    
    toast.success(t('paypal.success_message') || 'Payment completed successfully!');
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    
    if (onPaymentError) {
      onPaymentError(error);
    }
    
    toast.error(t('paypal.error_message') || 'Payment failed. Please try again.');
  };

  const handlePaymentCancel = (data) => {
    console.log('Payment cancelled:', data);
    toast.error(t('paypal.cancel_message') || 'Payment was cancelled.');
  };

  if (cartItems.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" color="text.secondary">
            {t('paypal.emptyCart')}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {t('paypal.summary')}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between">
                <Typography>{t('paypal.subtotal')}</Typography>
                <Typography>${orderData.subtotal}</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between">
                <Typography>{t('paypal.shipping')}</Typography>
                <Typography>
                  {orderData.shipping === '0.00' ? t('paypal.free') : `$${orderData.shipping}`}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Divider />
            </Grid>
            
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6" fontWeight="bold">
                  {t('paypal.total')}
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  ${orderData.total}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              {t('paypal.method')}
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              {t('paypal.disclaimer')}
            </Alert>
            
            {isProcessing ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  {t('paypal.processing')}
                </Typography>
              </Box>
            ) : (
              (() => {
                console.log('💰 Sending to PayPal:', {
                  amount: orderData.total,
                  subtotal: orderData.subtotal,
                  shipping: orderData.shipping,
                  fullOrderData: orderData
                });
                return (
                  <PayPalSimple
                    amount={orderData.total}
                    currency="USD"
                    description={`Payment for ${cartItems.length} item(s)`}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    shippingAddress={shippingAddress}
                    shippingInfo={shippingInfo}
                  />
                );
              })()
            )}
          </Box>
          
          {shippingAddress && (
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>
                {t('paypal.shippingAddress')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {shippingAddress.street}, {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PayPalPaymentForm;
