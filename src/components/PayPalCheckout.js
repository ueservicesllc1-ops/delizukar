import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { PAYPAL_CONFIG, PAYPAL_BUTTON_STYLES } from '../paypal/config';
import { toast } from 'react-hot-toast';
import paypalService from '../services/paypalService';

const PayPalCheckout = ({ 
  amount, 
  onSuccess, 
  onError, 
  onCancel,
  currency = "USD",
  description = "Payment for products"
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = (data, actions) => {
    setIsProcessing(true);
    
    return actions.order.capture().then(async (details) => {
      console.log('Payment completed:', details);
      
      try {
        // Verify payment with backend
        const verifiedPayment = await paypalService.verifyPayment(details.id);
        console.log('Payment verified:', verifiedPayment);
        
        // Call success callback with verified payment data
        if (onSuccess) {
          onSuccess({
            ...details,
            verified: verifiedPayment,
          });
        }
        
        toast.success('Payment completed and verified successfully!');
      } catch (error) {
        console.error('Payment verification error:', error);
        toast.error('Payment verification failed. Please contact support.');
        
        if (onError) {
          onError(error);
        }
      } finally {
        setIsProcessing(false);
      }
    }).catch((error) => {
      console.error('Payment error:', error);
      
      if (onError) {
        onError(error);
      }
      
      toast.error('Payment failed. Please try again.');
      setIsProcessing(false);
    });
  };

  const handleError = (error) => {
    console.error('PayPal error:', error);
    
    if (onError) {
      onError(error);
    }
    
    toast.error('Payment error occurred.');
    setIsProcessing(false);
  };

  const handleCancel = (data) => {
    console.log('Payment cancelled:', data);
    
    if (onCancel) {
      onCancel(data);
    }
    
    toast.error('Payment was cancelled.');
    setIsProcessing(false);
  };

  return (
    <PayPalScriptProvider 
      options={{
        clientId: PAYPAL_CONFIG.clientId,
        currency: currency,
        intent: PAYPAL_CONFIG.intent,
      }}
    >
      <div className="paypal-checkout">
        {isProcessing && (
          <div className="payment-processing">
            <div className="loading-spinner"></div>
            <p>Processing payment...</p>
          </div>
        )}
        
        <PayPalButtons
          style={PAYPAL_BUTTON_STYLES}
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
          onApprove={handleApprove}
          onError={handleError}
          onCancel={handleCancel}
        />
      </div>
    </PayPalScriptProvider>
  );
};

export default PayPalCheckout;
