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
  const [{ isResolved, isRejected, isPending, options }] = usePayPalScriptReducer();

  console.log('🔄 [PayPal] SDK State:', { 
    isResolved, 
    isRejected, 
    isPending,
    clientId: options?.["client-id"] ? options["client-id"].substring(0, 20) + '...' : 'NOT SET'
  });

  // Detectar si estamos en localhost
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname.includes('localhost');
  
  // Log adicional cuando se rechaza
  if (isRejected) {
    const clientIdUsed = options?.["client-id"] ? options["client-id"].substring(0, 30) + '...' : 'NOT SET';
    const isProductionClientId = clientIdUsed && clientIdUsed.startsWith('B') && !clientIdUsed.startsWith('sb');
    
    console.error('❌ [PayPal] SDK Rejected - PayPal no está disponible');
    console.error('❌ [PayPal] Client ID usado:', clientIdUsed);
    console.error('❌ [PayPal] Environment variable:', process.env.REACT_APP_PAYPAL_ENVIRONMENT || 'NOT SET');
    console.error('❌ [PayPal] NODE_ENV:', process.env.NODE_ENV);
    console.error('❌ [PayPal] Is Localhost:', isLocalhost);
    
    if (isLocalhost && isProductionClientId) {
      console.error('❌ [PayPal] PROBLEMA DETECTADO: Client ID de PRODUCCIÓN en localhost');
      console.error('❌ [PayPal] PayPal PRODUCTION no funciona en localhost');
      console.error('❌ [PayPal] SOLUCIÓN: Agrega REACT_APP_PAYPAL_CLIENT_ID_SANDBOX en .env.local');
      console.error('❌ [PayPal] En producción (Railway), PayPal funcionará correctamente');
    } else {
      console.error('❌ [PayPal] Verifica:');
      console.error('   1. Client ID configurado correctamente en Railway ANTES del build');
      console.error('   2. Client ID corresponde al environment (sandbox/production)');
      console.error('   3. Las variables REACT_APP_* deben estar configuradas ANTES de hacer build en Railway');
      console.error('   4. Si cambiaste las variables, debes hacer un REDEPLOY completo en Railway');
      console.error('   5. Conexión a internet activa');
      console.error('   6. No hay bloqueadores de anuncios o extensiones que interfieran');
    }
    
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {isLocalhost && isProductionClientId 
            ? 'PayPal no está disponible en localhost con Client ID de PRODUCCIÓN'
            : 'PayPal is not available. Please check your internet connection and try again.'}
        </Alert>
        <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>
              {isLocalhost && isProductionClientId 
                ? 'Problema detectado:'
                : 'Posibles causas:'}
            </strong>
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 0 }}>
            {isLocalhost && isProductionClientId ? (
              <>
                <li>PayPal PRODUCTION no funciona en localhost</li>
                <li>Necesitas un Client ID de SANDBOX para desarrollo</li>
                <li>Agrega REACT_APP_PAYPAL_CLIENT_ID_SANDBOX en .env.local</li>
                <li>En producción (Railway), PayPal funcionará correctamente</li>
                <li>Mientras tanto, usa el botón "🧪 Simular Compra Exitosa" para probar</li>
              </>
            ) : (
              <>
                <li>Client ID no válido o no coincide con el environment (sandbox/production)</li>
                <li>Problema de conexión a internet</li>
                <li>Bloqueador de anuncios o extensión del navegador</li>
                <li>Firewall o proxy bloqueando PayPal</li>
              </>
            )}
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
            console.log('🔍 [PayPal] Client ID Sandbox:', process.env.REACT_APP_PAYPAL_CLIENT_ID_SANDBOX);
            console.log('🔍 [PayPal] Environment:', process.env.REACT_APP_PAYPAL_ENVIRONMENT);
            console.log('🔍 [PayPal] Is Localhost:', isLocalhost);
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
  // DEBUG: Log todas las variables de entorno al inicio
  console.log('🔍 [PayPal] DEBUG - Todas las variables process.env:', {
    'REACT_APP_PAYPAL_CLIENT_ID': process.env.REACT_APP_PAYPAL_CLIENT_ID || 'NOT SET',
    'REACT_APP_PAYPAL_CLIENT_ID_SANDBOX': process.env.REACT_APP_PAYPAL_CLIENT_ID_SANDBOX || 'NOT SET',
    'REACT_APP_PAYPAL_ENVIRONMENT': process.env.REACT_APP_PAYPAL_ENVIRONMENT || 'NOT SET',
    'REACT_APP_PAYPAL_CURRENCY': process.env.REACT_APP_PAYPAL_CURRENCY || 'NOT SET',
    'REACT_APP_PAYPAL_INTENT': process.env.REACT_APP_PAYPAL_INTENT || 'NOT SET',
    'NODE_ENV': process.env.NODE_ENV || 'NOT SET',
    'hostname': window.location.hostname,
    'all_REACT_APP_keys': Object.keys(process.env).filter(key => key.startsWith('REACT_APP_'))
  });
  
  // Detectar si estamos en localhost/desarrollo
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname.includes('localhost');
  
  // Obtener configuración desde variables de entorno
  // En localhost, intentar usar Client ID de sandbox si está disponible
  const clientId = isLocalhost 
    ? (process.env.REACT_APP_PAYPAL_CLIENT_ID_SANDBOX || process.env.REACT_APP_PAYPAL_CLIENT_ID)
    : process.env.REACT_APP_PAYPAL_CLIENT_ID;
  
  console.log('🔍 [PayPal] DEBUG - clientId obtenido:', clientId ? clientId.substring(0, 30) + '...' : 'NOT SET');

  // Verificar configuración
  if (!clientId || clientId === 'sb' || clientId === 'TU_PAYPAL_CLIENT_ID_LIVE') {
    console.error('❌ [PayPal] Client ID no configurado o inválido:', clientId);
    console.error('❌ [PayPal] REACT_APP_PAYPAL_CLIENT_ID:', process.env.REACT_APP_PAYPAL_CLIENT_ID);
    console.error('❌ [PayPal] REACT_APP_PAYPAL_CLIENT_ID_SANDBOX:', process.env.REACT_APP_PAYPAL_CLIENT_ID_SANDBOX);
    console.error('❌ [PayPal] Is Localhost:', isLocalhost);
    console.error('❌ [PayPal] Todas las variables REACT_APP_*:', {
      REACT_APP_PAYPAL_CLIENT_ID: process.env.REACT_APP_PAYPAL_CLIENT_ID ? 'SET' : 'NOT SET',
      REACT_APP_PAYPAL_CLIENT_ID_SANDBOX: process.env.REACT_APP_PAYPAL_CLIENT_ID_SANDBOX ? 'SET' : 'NOT SET',
      REACT_APP_PAYPAL_ENVIRONMENT: process.env.REACT_APP_PAYPAL_ENVIRONMENT || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV
    });
    
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          PayPal Client ID not configured
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {isLocalhost 
            ? 'Para desarrollo en localhost, configura REACT_APP_PAYPAL_CLIENT_ID_SANDBOX en .env.local'
            : 'Please configure REACT_APP_PAYPAL_CLIENT_ID in Railway environment variables'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          Current value: {clientId || 'NOT SET'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 1 }}>
          {isLocalhost 
            ? 'Nota: PayPal PRODUCTION no funciona en localhost. Usa un Client ID de SANDBOX para desarrollo.'
            : 'Note: In Railway, REACT_APP_* variables must be set before building the app'}
        </Typography>
      </Box>
    );
  }

  // Obtener el environment de las variables de entorno
  // IMPORTANTE: En localhost, forzar sandbox porque PayPal PRODUCTION no funciona en localhost
  let environment = process.env.REACT_APP_PAYPAL_ENVIRONMENT || 'sandbox';
  
  // Si estamos en localhost y el environment es production, usar sandbox
  if (isLocalhost && environment === 'production') {
    console.warn('⚠️ [PayPal] Detectado localhost con environment=production');
    console.warn('⚠️ [PayPal] PayPal PRODUCTION no funciona en localhost');
    console.warn('⚠️ [PayPal] Cambiando automáticamente a SANDBOX para desarrollo');
    console.warn('⚠️ [PayPal] En producción (Railway), se usará PRODUCTION automáticamente');
    environment = 'sandbox';
  }
  
  // Si estamos en producción (no localhost) y el environment es production, usar el Client ID de producción
  // Si estamos en localhost, necesitamos un Client ID de sandbox
  let effectiveClientId = clientId;
  
  // Si estamos en localhost y el Client ID es de producción (empieza con 'B'), 
  // intentar usar un Client ID de sandbox si está disponible
  if (isLocalhost && clientId && clientId.startsWith('B') && !clientId.startsWith('sb')) {
    console.warn('⚠️ [PayPal] Client ID de PRODUCCIÓN detectado en localhost');
    console.warn('⚠️ [PayPal] PayPal PRODUCTION no funciona en localhost');
    console.warn('⚠️ [PayPal] Para probar en localhost, necesitas un Client ID de SANDBOX');
    console.warn('⚠️ [PayPal] El Client ID de sandbox normalmente empieza con "sb" o "A"');
    console.warn('⚠️ [PayPal] En producción (Railway), este Client ID funcionará correctamente');
    
    // Intentar usar un Client ID de sandbox si está disponible en las variables de entorno
    const sandboxClientId = process.env.REACT_APP_PAYPAL_CLIENT_ID_SANDBOX;
    if (sandboxClientId && (sandboxClientId.startsWith('sb') || sandboxClientId.startsWith('A'))) {
      console.log('✅ [PayPal] Usando Client ID de SANDBOX para localhost:', sandboxClientId.substring(0, 20) + '...');
      effectiveClientId = sandboxClientId;
      environment = 'sandbox'; // Forzar sandbox en localhost
    } else {
      // Si no hay sandbox Client ID, mostrar mensaje pero permitir que intente usar el de producción
      // PayPal SDK rechazará la conexión, pero al menos el código estará listo para producción
      console.warn('⚠️ [PayPal] No hay Client ID de SANDBOX disponible');
      console.warn('⚠️ [PayPal] PayPal no funcionará en localhost con Client ID de PRODUCCIÓN');
      console.warn('⚠️ [PayPal] Solución temporal: Usa el botón de prueba "🧪 Simular Compra Exitosa" para probar el flujo');
      console.warn('⚠️ [PayPal] Solución permanente: Agrega REACT_APP_PAYPAL_CLIENT_ID_SANDBOX en .env.local para desarrollo');
      console.warn('⚠️ [PayPal] En producción (Railway), PayPal funcionará correctamente con el Client ID de PRODUCCIÓN');
      // No cambiar effectiveClientId, dejar que PayPal SDK rechace y muestre el error apropiado
    }
  }
  
  console.log('🔧 [PayPal] Configuration:', {
    clientId: effectiveClientId ? effectiveClientId.substring(0, 20) + '...' : 'NOT SET',
    originalClientId: clientId ? clientId.substring(0, 20) + '...' : 'NOT SET',
    environment: environment,
    isLocalhost: isLocalhost,
    currency: currency,
    isProduction: environment === 'production' && !isLocalhost,
    fullClientId: effectiveClientId,
    clientIdLength: effectiveClientId ? effectiveClientId.length : 0
  });
  
  // Verificar que el Client ID tenga el formato correcto
  if (effectiveClientId) {
    const startsWithA = effectiveClientId.startsWith('A');
    const startsWithB = effectiveClientId.startsWith('B');
    const startsWithSb = effectiveClientId.startsWith('sb');
    
    console.log('🔍 [PayPal] Client ID format check:', {
      startsWithA,
      startsWithB,
      startsWithSb,
      firstChars: effectiveClientId.substring(0, 5),
      environment: environment,
      isLocalhost: isLocalhost
    });
    
    // Advertencia si el formato no es el esperado
    if (!startsWithA && !startsWithSb && !startsWithB) {
      console.warn('⚠️ [PayPal] Client ID no tiene el formato esperado (debe empezar con "A", "B" o "sb")');
    }
  }

  // Configurar opciones del SDK de PayPal
  // NOTA: PayPal SDK detecta automáticamente el environment basándose en el Client ID
  // Si el Client ID es de sandbox, usa sandbox automáticamente, sin importar la variable
  const paypalOptions = {
    "client-id": effectiveClientId,
    currency: currency,
    intent: 'capture',
    components: 'buttons',
    "enable-funding": 'card,credit,paypal',
    vault: false,
    commit: true,
    "data-sdk-integration-source": "buttonfactory",
    "buyer-country": "US",
    "locale": "en_US",
    // Siempre habilitar debug para ver errores en producción también
    debug: true,
  };

  // En modo production, agregar configuración adicional si es necesario
  if (environment === 'production' && !isLocalhost) {
    console.log('✅ Configurando PayPal en modo PRODUCTION (LIVE) - Producción');
    // El SDK detecta automáticamente el environment basándose en el Client ID
    // Pero podemos asegurarnos de que no hay opciones de sandbox
  } else {
    console.log('🧪 Configurando PayPal en modo SANDBOX - Desarrollo');
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

