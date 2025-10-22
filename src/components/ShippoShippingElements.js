import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Dialog, DialogContent, Typography, CircularProgress, Alert } from '@mui/material';
import { LocalShipping } from '@mui/icons-material';
import shippoService from '../services/shippoService';

const ShippoShippingElements = ({ 
  open, 
  onClose, 
  orderData, 
  onLabelPurchased,
  onOrderCreated,
  onError 
}) => {
  const [loading, setLoading] = useState(false);
  const [jwt, setJwt] = useState(null);
  const [error, setError] = useState(null);
  const shippoRef = useRef(null);
  const elementsRef = useRef(null);

  // Tema personalizado para Shippo Elements
  const customTheme = {
    elementId: 'shippo-elements',
    title: 'Envío de Pedido',
    style: 'modern',
    height: '600px',
    width: '100%',
    primaryColor: '#8B4513',
    container: {
      backgroundColor: '#ffffff'
    },
    header: {
      backgroundColor: '#8B4513',
      borderColor: '#8B4513',
      color: '#ffffff',
      hasBoxShadow: true,
      textAlign: 'center'
    },
    footer: {
      backgroundColor: '#f8f9fa',
      borderColor: '#dee2e6',
      hasBoxShadow: true
    },
    button: {
      primary: {
        backgroundColor: '#8B4513',
        activeBackgroundColor: '#A0522D',
        hoverColor: '#A0522D',
        color: '#ffffff',
        borderRadius: '8px',
        borderColor: '#8B4513',
        activeBorderColor: '#A0522D',
        textTransform: 'uppercase'
      },
      secondary: {
        backgroundColor: 'transparent',
        activeBackgroundColor: '#f8f9fa',
        color: '#8B4513',
        borderRadius: '8px',
        borderColor: '#8B4513',
        activeBorderColor: '#A0522D',
        textTransform: 'uppercase'
      }
    },
    cards: {
      subHeaderColor: '#6c757d',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      borderColor: '#dee2e6',
      borderStyle: 'solid',
      hoverBackgroundColor: '#f8f9fa',
      activeBackgroundColor: '#e9ecef'
    },
    inputs: {
      borderColor: '#ced4da',
      borderActive: '#8B4513',
      hoverColor: '#8B4513'
    },
    menu: {
      titleBackgroundColor: '#f8f9fa',
      hoverColor: '#8B4513',
      hoverBackgroundColor: '#f8f9fa'
    }
  };

  // Generar JWT cuando se abre el modal
  useEffect(() => {
    if (open && !jwt) {
      generateJWT();
    }
  }, [open, jwt]);

  // Inicializar Shippo Elements cuando se tiene JWT
  useEffect(() => {
    if (jwt && open && !shippoRef.current) {
      initializeShippoElements();
    }
  }, [jwt, open]);

  const generateJWT = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await shippoService.generateJWT();
      setJwt(token);
    } catch (err) {
      console.error('Error generating JWT:', err);
      setError('Error al generar token de autenticación');
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  const initializeShippoElements = () => {
    try {
      // Cargar el script de Shippo Elements si no está cargado
      if (!window.shippo) {
        const script = document.createElement('script');
        script.src = 'https://js.goshippo.com/v1/shippo-elements.js';
        script.onload = () => {
          setupShippoElements();
        };
        script.onerror = () => {
          setError('Error al cargar Shippo Elements');
        };
        document.head.appendChild(script);
      } else {
        setupShippoElements();
      }
    } catch (err) {
      console.error('Error initializing Shippo Elements:', err);
      setError('Error al inicializar Shippo Elements');
      if (onError) onError(err);
    }
  };

  const setupShippoElements = () => {
    try {
      // Configurar eventos de Shippo
      window.shippo.on('APP_READY', () => {
        console.log('Shippo Elements ready');
        setLoading(false);
      });

      window.shippo.on('ORDER_CREATED', (orderData) => {
        console.log('Order created:', orderData);
        if (onOrderCreated) {
          onOrderCreated(orderData);
        }
      });

      window.shippo.on('LABEL_PURCHASED_SUCCESS', (transactionData) => {
        console.log('Label purchased:', transactionData);
        if (onLabelPurchased) {
          onLabelPurchased(transactionData);
        }
        // Cerrar el modal después de comprar la etiqueta
        setTimeout(() => {
          onClose();
        }, 2000);
      });

      window.shippo.on('CLOSE_BUTTON_CLICKED', () => {
        console.log('Close button clicked');
        onClose();
      });

      window.shippo.on('ERROR', (errorData) => {
        console.error('Shippo Elements error:', errorData);
        setError(`Error: ${errorData.detail || 'Error desconocido'}`);
        if (onError) onError(errorData);
      });

      // Inicializar Shippo Elements
      window.shippo.init({
        jwt: jwt,
        theme: customTheme,
        elementId: 'shippo-elements'
      });

      // Crear orden si hay datos
      if (orderData) {
        createOrder();
      }

    } catch (err) {
      console.error('Error setting up Shippo Elements:', err);
      setError('Error al configurar Shippo Elements');
      if (onError) onError(err);
    }
  };

  const createOrder = () => {
    try {
      if (window.shippo && orderData) {
        window.shippo.labelPurchase({
          orderDetails: {
            object_id: orderData.object_id || null,
            address_from: orderData.address_from,
            address_to: orderData.address_to,
            parcels: orderData.parcels,
            shipment_date: orderData.shipment_date || new Date().toISOString().split('T')[0],
            metadata: orderData.metadata || `Order from Delizukar - ${new Date().toISOString()}`
          }
        });
      }
    } catch (err) {
      console.error('Error creating order:', err);
      setError('Error al crear la orden');
      if (onError) onError(err);
    }
  };

  const handleClose = () => {
    // Limpiar eventos de Shippo
    if (window.shippo) {
      window.shippo.off('APP_READY');
      window.shippo.off('ORDER_CREATED');
      window.shippo.off('LABEL_PURCHASED_SUCCESS');
      window.shippo.off('CLOSE_BUTTON_CLICKED');
      window.shippo.off('ERROR');
    }
    
    // Limpiar estado
    setJwt(null);
    setError(null);
    setLoading(false);
    shippoRef.current = null;
    
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          minHeight: '700px',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative' }}>
        {/* Header personalizado */}
        <Box
          sx={{
            backgroundColor: '#8B4513',
            color: 'white',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '16px 16px 0 0'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalShipping />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Envío de Pedido
            </Typography>
          </Box>
          <Button
            onClick={handleClose}
            sx={{
              color: 'white',
              minWidth: 'auto',
              p: 1
            }}
          >
            ✕
          </Button>
        </Box>

        {/* Contenido */}
        <Box sx={{ p: 2, minHeight: '600px' }}>
          {loading && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                gap: 2
              }}
            >
              <CircularProgress sx={{ color: '#8B4513' }} />
              <Typography variant="body1" color="text.secondary">
                Configurando envío...
              </Typography>
            </Box>
          )}

          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {/* Contenedor de Shippo Elements */}
          <Box
            id="shippo-elements"
            ref={elementsRef}
            sx={{
              minHeight: '500px',
              width: '100%',
              '& iframe': {
                border: 'none',
                borderRadius: '8px'
              }
            }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ShippoShippingElements;

