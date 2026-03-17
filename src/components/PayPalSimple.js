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
import { useLanguage } from '../context/LanguageContext';

const PAYPAL_SIMPLE_TRANSLATIONS = {
  es: {
    'paypal.notAvailable': 'PayPal no está disponible. Por favor verifica tu conexión a internet e intenta de nuevo.',
    'paypal.possibleCauses': 'Posibles causas:',
    'paypal.cause1': 'Client ID no válido o no está activo en PayPal',
    'paypal.cause2': 'Problema de conexión a internet',
    'paypal.cause3': 'Bloqueador de anuncios o extensión del navegador',
    'paypal.cause4': 'Firewall o proxy bloqueando PayPal',
    'paypal.cause5': 'Variables REACT_APP_* no configuradas antes del build',
    'paypal.refresh': 'Actualizar Página',
    'paypal.debugInfo': 'Información de Debug',
    'paypal.loading': 'Cargando PayPal...',
    'paypal.success': '¡Pago completado con éxito!',
    'paypal.failed': 'El procesamiento del pago falló. Por favor, inténtalo de nuevo.',
    'paypal.cancelled': 'El pago fue cancelado.',
    'paypal.noConfig': 'PayPal Client ID no configurado',
    'paypal.configHint': 'Por favor configura REACT_APP_PAYPAL_CLIENT_ID en las variables de entorno de Railway',
    'paypal.currentValue': 'Valor actual:',
    'paypal.configNote': 'Nota: Las variables REACT_APP_* deben estar configuradas ANTES de hacer build en Railway',
    'paypal.payWith': 'Pagar con PayPal',
    'paypal.disclaimer': 'Pago seguro procesado por PayPal - Acepta las principales tarjetas de crédito/débito'
  },
  en: {
    'paypal.notAvailable': 'PayPal is not available. Please check your internet connection and try again.',
    'paypal.possibleCauses': 'Possible causes:',
    'paypal.cause1': 'Invalid or inactive PayPal Client ID',
    'paypal.cause2': 'Internet connection problem',
    'paypal.cause3': 'Ad blocker or browser extension interference',
    'paypal.cause4': 'Firewall or proxy blocking PayPal',
    'paypal.cause5': 'REACT_APP_* variables not configured before build',
    'paypal.refresh': 'Refresh Page',
    'paypal.debugInfo': 'Debug Info',
    'paypal.loading': 'Loading PayPal...',
    'paypal.success': 'Payment completed successfully!',
    'paypal.failed': 'Payment processing failed. Please try again.',
    'paypal.cancelled': 'Payment was cancelled.',
    'paypal.noConfig': 'PayPal Client ID not configured',
    'paypal.configHint': 'Please configure REACT_APP_PAYPAL_CLIENT_ID in Railway environment variables',
    'paypal.currentValue': 'Current value:',
    'paypal.configNote': 'Note: REACT_APP_* variables must be configured BEFORE building on Railway',
    'paypal.payWith': 'Pay with PayPal',
    'paypal.disclaimer': 'Secure payment powered by PayPal - Accepts all major credit/debit cards'
  }
};

// Internal component to handle PayPal state
const PayPalButtonContainer = ({ 
  amount, 
  currency, 
  description,
  onSuccess,
  onError,
  shippingAddress,
  shippingInfo,
  t
}) => {
  const [{ isResolved, isRejected, isPending, options, error }] = usePayPalScriptReducer();

  console.log('🔄 [PayPal] SDK State:', { 
    isResolved, 
    isRejected, 
    isPending,
    clientId: options?.["client-id"] ? options["client-id"].substring(0, 20) + '...' : 'NOT SET',
    error: error ? JSON.stringify(error, null, 2) : 'NO ERROR',
    errorMessage: error?.message || 'NO ERROR MESSAGE',
    errorDetails: error
  });
  
  // Si hay un error, log detallado
  if (error) {
    console.error('❌ [PayPal] SDK Error Details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      fullError: error
    });
  }

  // Log adicional cuando se rechaza
  if (isRejected) {
    const clientIdUsed = options?.["client-id"] ? options["client-id"].substring(0, 30) + '...' : 'NOT SET';
    
    console.error('❌ [PayPal] SDK Rejected - PayPal no está disponible');
    console.error('❌ [PayPal] Client ID usado:', clientIdUsed);
    console.error('❌ [PayPal] Environment: PRODUCTION (LIVE)');
    console.error('❌ [PayPal] NODE_ENV:', process.env.NODE_ENV);
    console.error('❌ [PayPal] Verifica:');
    console.error('   1. Client ID configurado correctamente en Railway ANTES del build');
    console.error('   2. Client ID es válido y está activo en PayPal');
    console.error('   3. Las variables REACT_APP_* deben estar configuradas ANTES de hacer build en Railway');
    console.error('   4. Si cambiaste las variables, debes hacer un REDEPLOY completo en Railway');
    console.error('   5. Conexión a internet activa');
    console.error('   6. No hay bloqueadores de anuncios o extensiones que interfieran');
    
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('paypal.notAvailable')}
        </Alert>
        <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>{t('paypal.possibleCauses')}</strong>
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 0 }}>
            <li>{t('paypal.cause1')}</li>
            <li>{t('paypal.cause2')}</li>
            <li>{t('paypal.cause3')}</li>
            <li>{t('paypal.cause4')}</li>
            <li>{t('paypal.cause5')}</li>
          </Typography>
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          sx={{ backgroundColor: '#c8626d', mr: 2 }}
        >
          {t('paypal.refresh')}
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => {
            console.log('🔍 [PayPal] Client ID:', process.env.REACT_APP_PAYPAL_CLIENT_ID);
            console.log('🔍 [PayPal] Environment: PRODUCTION');
            console.log('🔍 [PayPal] NODE_ENV:', process.env.NODE_ENV);
          }}
          sx={{ borderColor: '#c8626d', color: '#c8626d' }}
        >
          {t('paypal.debugInfo')}
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
          {t('paypal.loading')}
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
      toast.success(t('paypal.success'));
      
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
      toast.error(t('paypal.failed'));
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
    
    toast.error(`${t('paypal.failed')}: ${error?.message || 'Unknown error'}`);
  };

  const handleCancel = (data) => {
    console.log('PayPal Simple - Payment cancelled:', data);
    toast.error(t('paypal.cancelled'));
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
  const { language } = useLanguage();
  const t = (key) => {
    const dict = PAYPAL_SIMPLE_TRANSLATIONS[language] || PAYPAL_SIMPLE_TRANSLATIONS.es;
    return dict[key] || key;
  };
  // DEBUG: Log todas las variables de entorno al inicio
  console.log('🔍 [PayPal] DEBUG - Variables de entorno:', {
    'REACT_APP_PAYPAL_CLIENT_ID': process.env.REACT_APP_PAYPAL_CLIENT_ID ? 'SET' : 'NOT SET',
    'REACT_APP_PAYPAL_ENVIRONMENT': process.env.REACT_APP_PAYPAL_ENVIRONMENT || 'NOT SET',
    'NODE_ENV': process.env.NODE_ENV || 'NOT SET'
  });
  
  // Solo usar modo PRODUCCIÓN - obtener Client ID de producción
  const clientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;
  
  console.log('🔍 [PayPal] Client ID obtenido:', clientId ? clientId.substring(0, 30) + '...' : 'NOT SET');

  // Verificar configuración - solo modo PRODUCCIÓN
  if (!clientId || clientId === 'sb' || clientId === 'TU_PAYPAL_CLIENT_ID_LIVE') {
    console.error('❌ [PayPal] Client ID de PRODUCCIÓN no configurado o inválido:', clientId);
    console.error('❌ [PayPal] REACT_APP_PAYPAL_CLIENT_ID:', process.env.REACT_APP_PAYPAL_CLIENT_ID ? 'SET' : 'NOT SET');
    
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('paypal.noConfig')}
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {t('paypal.configHint')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          {t('paypal.currentValue')} {clientId || 'NOT SET'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 1 }}>
          {t('paypal.configNote')}
        </Typography>
      </Box>
    );
  }

  // Solo modo PRODUCCIÓN - no hay detección automática
  const environment = 'production';
  const effectiveClientId = clientId;
  
  console.log('🔧 [PayPal] Configuration:', {
    clientId: effectiveClientId ? effectiveClientId.substring(0, 20) + '...' : 'NOT SET',
    environment: environment,
    currency: currency,
    isProduction: true,
    fullClientId: effectiveClientId,
    clientIdLength: effectiveClientId ? effectiveClientId.length : 0
  });
  
  // Verificar que el Client ID tenga el formato correcto
  if (effectiveClientId) {
    const startsWithA = effectiveClientId.startsWith('A');
    const startsWithB = effectiveClientId.startsWith('B');
    
    console.log('🔍 [PayPal] Client ID format check:', {
      startsWithA,
      startsWithB,
      firstChars: effectiveClientId.substring(0, 5),
      environment: environment
    });
    
    // Advertencia si el formato no es el esperado
    if (!startsWithA && !startsWithB) {
      console.warn('⚠️ [PayPal] Client ID no tiene el formato esperado (debe empezar con "A" o "B")');
    }
  }

  // Configurar opciones del SDK de PayPal
  // PayPal SDK detecta automáticamente el environment basándose en el Client ID
  // IMPORTANTE: Usar solo opciones válidas del SDK oficial
  const paypalOptions = {
    "client-id": effectiveClientId,
    currency: currency,
    intent: 'capture',
    components: 'buttons',
    "enable-funding": 'card,credit,paypal',
    // Opciones estándar del SDK - no agregar opciones personalizadas que puedan causar errores
    vault: false,
    commit: true,
    // Solo habilitar debug en desarrollo para evitar problemas en producción
    debug: process.env.NODE_ENV === 'development',
  };

  // Solo modo PRODUCCIÓN
  console.log('✅ Configurando PayPal en modo PRODUCTION (LIVE)');

  console.log('📦 PayPal Options:', {
    ...paypalOptions,
    "client-id": clientId ? clientId.substring(0, 20) + '...' : 'NOT SET'
  });

  // Agregar callback de error para capturar errores de carga del script
  const handleScriptError = (err) => {
    console.error('❌ [PayPal] PayPalScriptProvider Error:', err);
    console.error('❌ [PayPal] Error details:', JSON.stringify(err, null, 2));
    console.error('❌ [PayPal] Error message:', err?.message);
    console.error('❌ [PayPal] Error name:', err?.name);
    console.error('❌ [PayPal] Client ID usado:', effectiveClientId ? effectiveClientId.substring(0, 30) + '...' : 'NOT SET');
    console.error('❌ [PayPal] Environment variable:', process.env.REACT_APP_PAYPAL_ENVIRONMENT || 'NOT SET');
    console.error('❌ [PayPal] NODE_ENV:', process.env.NODE_ENV);
    console.error('❌ [PayPal] Is Localhost:', window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    // Verificar si hay problemas de red
    if (err?.message?.includes('network') || err?.message?.includes('fetch')) {
      console.error('❌ [PayPal] Problema de red detectado - verifica conexión a internet');
    }
    
    // Verificar si el Client ID es válido
    if (err?.message?.includes('client') || err?.message?.includes('invalid')) {
      console.error('❌ [PayPal] Problema con Client ID - verifica que sea válido y esté activo en PayPal');
    }
  };

  // Verificar que el script de PayPal se pueda cargar
  useEffect(() => {
    // Verificar si hay problemas de CSP o bloqueadores
    const checkPayPalScript = async () => {
      try {
        const response = await fetch('https://www.paypal.com/sdk/js', { method: 'HEAD' });
        if (!response.ok) {
          console.warn('⚠️ [PayPal] No se puede acceder al script de PayPal - posible problema de red o CSP');
        }
      } catch (error) {
        console.warn('⚠️ [PayPal] Error al verificar acceso al script de PayPal:', error);
      }
    };
    
    checkPayPalScript();
  }, []);

  return (
    <PayPalScriptProvider 
      options={paypalOptions}
      onError={handleScriptError}
      deferLoading={false}
    >
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('paypal.payWith')}
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          {t('paypal.disclaimer')}
        </Typography>
        
        <PayPalButtonContainer
          amount={amount}
          currency={currency}
          description={description}
          onSuccess={onSuccess}
          onError={onError}
          shippingAddress={shippingAddress}
          shippingInfo={shippingInfo}
          t={t}
        />
      </Box>
    </PayPalScriptProvider>
  );
};

export default PayPalSimple;

