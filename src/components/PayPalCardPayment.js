import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
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
        components: 'buttons,marks,messages',
        enableFunding: 'card,credit,paylater',
        disableFunding: 'paypal',
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'pay',
          height: 45,
        },
      }}
    >
      <Box>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={3}>
              <CreditCard sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h5">
                Pay with Credit/Debit Card
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Secure Payment:</strong> Your card information is processed securely by PayPal. 
                We accept Visa, Mastercard, American Express, and Discover cards.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box textAlign="center" mb={2}>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    ${amount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {description}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Choose Payment Method
                  </Typography>
                </Divider>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <MenuItem value="card">
                      <Box display="flex" alignItems="center">
                        <CreditCard sx={{ mr: 1 }} />
                        Credit/Debit Card
                      </Box>
                    </MenuItem>
                    <MenuItem value="paypal">
                      <Box display="flex" alignItems="center">
                        <Security sx={{ mr: 1 }} />
                        PayPal Account
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {isProcessing && (
                <Grid item xs={12}>
                  <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Processing your card payment...
                    </Typography>
                  </Box>
                </Grid>
              )}

              {!isProcessing && (
                <Grid item xs={12}>
                  <Box sx={{ 
                    border: '2px dashed #e0e0e0', 
                    borderRadius: 2, 
                    p: 3, 
                    textAlign: 'center',
                    backgroundColor: '#fafafa'
                  }}>
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
                          payment_source: {
                            card: {
                              attributes: {
                                vault: {
                                  store_in_vault: 'ON_SUCCESS',
                                  usage_pattern: 'IMMEDIATE',
                                  usage_type: 'MERCHANT',
                                },
                              },
                            },
                          },
                        });
                      }}
                      onApprove={handleApprove}
                      onError={handleError}
                      onCancel={handleCancel}
                    />
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <Box display="flex" alignItems="center" justifyContent="center" mt={2}>
                  <Security sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Secured by PayPal • SSL Encrypted
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </PayPalScriptProvider>
  );
};

export default PayPalCardPayment;
