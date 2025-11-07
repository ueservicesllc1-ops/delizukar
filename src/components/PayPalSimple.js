import React, { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material';
import { toast } from 'react-hot-toast';

// Internal component to handle PayPal state
const PayPalButtonContainer = ({ 
  amount, 
  currency, 
  description,
  onSuccess,
  onError,
  shippingAddress,
  shippingInfo
}) => {
  const [{ isResolved, isRejected, isPending }] = usePayPalScriptReducer();

  console.log('🔄 [PayPal] SDK State:', { isResolved, isRejected, isPending });

  if (isRejected) {
    console.error('❌ [PayPal] SDK Rejected - PayPal no está disponible');
    console.error('❌ [PayPal] Verifica:');
    console.error('   1. Client ID configurado correctamente');
    console.error('   2. Client ID corresponde al environment (sandbox/production)');
    console.error('   3. Conexión a internet activa');
    console.error('   4. No hay bloqueadores de anuncios o extensiones que interfieran');
    
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          PayPal is not available. Please check your internet connection and try again.
        </Alert>
        <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Posibles causas:</strong>
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 0 }}>
            <li>Client ID no válido o no coincide con el environment (sandbox/production)</li>
            <li>Problema de conexión a internet</li>
            <li>Bloqueador de anuncios o extensión del navegador</li>
            <li>Firewall o proxy bloqueando PayPal</li>
          </Typography>
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          sx={{ backgroundColor: '#c8626d', mr: 2 }}
        >
          Refresh Page
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => {
            console.log('🔍 [PayPal] Client ID:', process.env.REACT_APP_PAYPAL_CLIENT_ID);
            console.log('🔍 [PayPal] Environment:', process.env.REACT_APP_PAYPAL_ENVIRONMENT);
          }}
          sx={{ borderColor: '#c8626d', color: '#c8626d' }}
        >
          Debug Info
        </Button>
      </Box>
    );
  }

  if (!isResolved || isPending) {
    console.log('⏳ [PayPal] SDK Loading...', { isResolved, isPending });
    return (
      <Box display="flex" flexDirection="column" alignItems="center" py={4}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading PayPal...
        </Typography>
      </Box>
    );
  }

  console.log('✅ [PayPal] SDK Resolved - Botones listos para renderizar');

  console.log('🎯 [PayPal] PayPalButtonContainer renderizado, onSuccess:', typeof onSuccess);

  const handleCreateOrder = (data, actions) => {
    console.log('🔵 [PayPal] Creating order for amount:', amount);
    console.log('🔵 [PayPal] Currency:', currency);
    console.log('🔵 [PayPal] Description:', description);
    
    return actions.order.create({
      intent: 'CAPTURE', // Explicitly set intent
      purchase_units: [
        {
          amount: {
            value: parseFloat(amount).toFixed(2), // Ensure proper formatting
            currency_code: currency,
          },
          description: description,
        },
      ],
      application_context: {
        shipping_preference: 'NO_SHIPPING' // We handle shipping separately
      }
    }).then((orderId) => {
      console.log('✅ [PayPal] Order created successfully:', orderId);
      return orderId;
    }).catch((error) => {
      console.error('❌ [PayPal] Error creating order:', error);
      throw error;
    });
  };

  const handleApprove = async (data, actions) => {
    console.log('🔵🔵🔵 [PayPal] FUNCIÓN handleCapture LLAMADA');
    console.log('🔵 [PayPal] Iniciando captura de pago...');
    console.log('🔵 [PayPal] Data:', data);
    console.log('🔵 [PayPal] onSuccess existe?', typeof onSuccess);
    
    try {
      console.log('🔵 [PayPal] Llamando actions.order.capture()...');
      const details = await actions.order.capture();
      console.log('✅ [PayPal] Pago capturado exitosamente:', details);
      
      // Mostrar mensaje de éxito inmediatamente
      toast.success('Payment completed successfully!');
      
      // Llamar onSuccess directamente como funcionaba antes
      if (onSuccess) {
        console.log('🔵 [PayPal] Llamando onSuccess callback...');
        
        // Usar setTimeout para asegurar que el callback se ejecute después de que PayPal cierre
        setTimeout(() => {
          onSuccess({
            ...details,
            paymentMethod: 'paypal',
            amount: amount
          });
          console.log('✅ [PayPal] onSuccess ejecutado');
        }, 100);
      }
      
      console.log('✅ [PayPal] Todo completado exitosamente');
      
      // Retornar para que PayPal sepa que el pago fue procesado exitosamente
      return details;
    } catch (error) {
      console.error('❌ [PayPal] Error capturando pago:', error);
      console.error('❌ [PayPal] Stack:', error.stack);
      toast.error('Payment processing failed. Please try again.');
      if (onError) {
        onError(error);
      }
      throw error; // Re-throw para que PayPal maneje el error
    }
  };

  const handleError = (error) => {
    console.error('❌ [PayPal] Error:', error);
    console.error('❌ [PayPal] Error details:', JSON.stringify(error, null, 2));
    console.error('❌ [PayPal] Error message:', error?.message);
    console.error('❌ [PayPal] Error stack:', error?.stack);
    
    if (onError) {
      onError(error);
    }
    
    toast.error(`Payment failed: ${error?.message || 'Unknown error'}. Please try again.`);
  };

  const handleCancel = (data) => {
    console.log('PayPal Simple - Payment cancelled:', data);
    toast.error('Payment was cancelled.');
  };

  console.log('🎯🎯 [PayPal] Renderizando PayPalButtons, onSuccess es:', typeof onSuccess);
  console.log('🎯🎯 [PayPal] Amount:', amount);
  console.log('🎯🎯 [PayPal] Currency:', currency);

  return (
    <PayPalButtons
      style={{
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'pay',
        height: 45,
      }}
      createOrder={handleCreateOrder}
      onApprove={handleApprove}
      onError={handleError}
      onCancel={handleCancel}
      onClick={(data, actions) => {
        console.log('🖱️ [PayPal] Button clicked!', data, actions);
        // Permitir que continúe con el flujo normal
        return actions.resolve();
      }}
    />
  );
};

const PayPalSimple = ({ 
  amount, 
  onSuccess, 
  onError, 
  currency = "USD",
  description = "Payment with PayPal",
  shippingAddress = null,
  shippingInfo = null
}) => {
  // Obtener configuración desde variables de entorno
  const clientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;

  // Verificar configuración
  if (!clientId || clientId === 'sb') {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          PayPal Client ID not configured
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Please configure REACT_APP_PAYPAL_CLIENT_ID in your .env.local file
        </Typography>
      </Box>
    );
  }

  // Obtener el environment de las variables de entorno
  const environment = process.env.REACT_APP_PAYPAL_ENVIRONMENT || 'sandbox';
  
  console.log('🔧 PayPal Configuration:', {
    clientId: clientId ? clientId.substring(0, 20) + '...' : 'NOT SET',
    environment: environment,
    currency: currency,
    isProduction: environment === 'production',
    fullClientId: clientId
  });

  // Configurar opciones del SDK de PayPal
  const paypalOptions = {
    "client-id": clientId,
    currency: currency,
    intent: 'capture',
    components: 'buttons',
    "enable-funding": 'card,credit,paypal',
    vault: false,
    commit: true,
    "data-sdk-integration-source": "buttonfactory",
    "buyer-country": "US",
    "locale": "en_US",
    // Agregar debug en desarrollo para ver errores
    debug: process.env.NODE_ENV === 'development',
  };

  // En modo production, agregar configuración adicional si es necesario
  if (environment === 'production') {
    console.log('✅ Configurando PayPal en modo PRODUCTION (LIVE)');
    // El SDK detecta automáticamente el environment basándose en el Client ID
    // Pero podemos asegurarnos de que no hay opciones de sandbox
  } else {
    console.log('🧪 Configurando PayPal en modo SANDBOX');
  }

  console.log('📦 PayPal Options:', {
    ...paypalOptions,
    "client-id": clientId ? clientId.substring(0, 20) + '...' : 'NOT SET'
  });

  return (
    <PayPalScriptProvider 
      options={paypalOptions}
    >
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Pay with PayPal
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Secure payment powered by PayPal - Accepts all major credit/debit cards
        </Typography>
        
        <PayPalButtonContainer
          amount={amount}
          currency={currency}
          description={description}
          onSuccess={onSuccess}
          onError={onError}
          shippingAddress={shippingAddress}
          shippingInfo={shippingInfo}
        />
      </Box>
    </PayPalScriptProvider>
  );
};

export default PayPalSimple;

