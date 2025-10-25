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
import { toast } from 'react-hot-toast';

const PayPalPaymentForm = ({ 
  cartItems = [], 
  onPaymentSuccess, 
  onPaymentError,
  shippingAddress = null 
}) => {
  const [orderData, setOrderData] = useState({
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('paypal');

  // Calculate order totals
  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shipping = subtotal > 50 ? 0 : 10; // Free shipping over $50
      const tax = subtotal * 0.08; // 8% tax
      const total = subtotal + shipping + tax;

      setOrderData({
        subtotal: subtotal.toFixed(2),
        shipping: shipping.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
      });
    }
  }, [cartItems]);

  const handlePaymentSuccess = (details) => {
    console.log('Payment successful:', details);
    setIsProcessing(true);
    
    // Here you would typically send the payment details to your backend
    // to verify the payment and update your database
    
    if (onPaymentSuccess) {
      onPaymentSuccess({
        paymentId: details.id,
        status: details.status,
        amount: orderData.total,
        currency: 'USD',
        payer: details.payer,
        create_time: details.create_time,
        update_time: details.update_time,
      });
    }
    
    toast.success('Payment completed successfully!');
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    
    if (onPaymentError) {
      onPaymentError(error);
    }
    
    toast.error('Payment failed. Please try again.');
  };

  const handlePaymentCancel = (data) => {
    console.log('Payment cancelled:', data);
    toast.error('Payment was cancelled.');
  };

  if (cartItems.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" color="text.secondary">
            Your cart is empty
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
            Payment Summary
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between">
                <Typography>Subtotal:</Typography>
                <Typography>${orderData.subtotal}</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between">
                <Typography>Shipping:</Typography>
                <Typography>
                  {orderData.shipping === '0.00' ? 'Free' : `$${orderData.shipping}`}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between">
                <Typography>Tax:</Typography>
                <Typography>${orderData.tax}</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Divider />
            </Grid>
            
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6" fontWeight="bold">
                  Total:
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  ${orderData.total}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Payment Method
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              Secure payment powered by PayPal
            </Alert>
            
            {isProcessing ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Processing your payment...
                </Typography>
              </Box>
            ) : (
              <PayPalCheckout
                amount={orderData.total}
                currency="USD"
                description={`Payment for ${cartItems.length} item(s)`}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onCancel={handlePaymentCancel}
              />
            )}
          </Box>
          
          {shippingAddress && (
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>
                Shipping Address
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
