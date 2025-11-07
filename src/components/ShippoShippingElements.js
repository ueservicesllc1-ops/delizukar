import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { Close } from '@mui/icons-material';

/**
 * Componente para integrar Shippo Shipping Elements
 * 
 * Shippo Shipping Elements es un widget embebido que permite a los usuarios
 * crear etiquetas de envío directamente desde una interfaz pre-construida.
 * 
 * Documentación: https://docs.goshippo.com/docs/shippingelements/
 * 
 * @param {boolean} open - Controla si el diálogo está abierto
 * @param {function} onClose - Callback cuando se cierra el diálogo
 * @param {object} orderData - Datos del pedido (opcional) para pre-llenar el widget
 */
const ShippoShippingElements = ({ open, onClose, orderData = null }) => {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jwt, setJwt] = useState(null);

  // Cargar el script de Shippo Shipping Elements
  useEffect(() => {
    if (!open) return;

    const loadShippoScript = () => {
      // Verificar si el script ya está cargado
      if (window.shippo) {
        initializeWidget();
        return;
      }

      const script = document.createElement('script');
      // URL correcta según documentación: https://docs.goshippo.com/docs/shippingelements/install/
      script.src = 'https://js.goshippo.com/embeddable-client.js';
      script.async = true;
      script.onload = () => {
        console.log('✅ Shippo Shipping Elements script loaded');
        initializeWidget();
      };
      script.onerror = () => {
        console.error('❌ Error loading Shippo Shipping Elements script');
        setError('Error al cargar el widget de Shippo. Por favor, recarga la página.');
        setLoading(false);
      };
      document.body.appendChild(script);
    };

    const initializeWidget = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener JWT del servidor
        const baseURL = process.env.NODE_ENV === 'production' 
          ? window.location.origin 
          : '';
        
        const response = await fetch(`${baseURL}/api/shippo/elements/authz`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al generar token de autenticación');
        }

        const { jwt: token } = await response.json();
        setJwt(token);

        // Inicializar el widget de Shippo
        // Según la documentación: https://docs.goshippo.com/docs/shippingelements/install/
        if (window.shippo && containerRef.current) {
          // Paso 1: Inicializar con shippo.init()
          // Requiere: token, org (identificador de organización)
          window.shippo.init({
            token: token,
            org: 'delizukar', // Identificador de tu organización
            locale: 'es', // Español
            theme: {
              width: '100%'
            }
          });

          // Paso 2: Preparar datos del pedido en formato OrderDetails
          // Según: https://docs.goshippo.com/docs/shippingelements/install/
          const orderDetails = {};
          
          if (orderData) {
            // Mapear address_to
            if (orderData.address_to) {
              orderDetails.address_to = {
                name: orderData.address_to.name || '',
                street1: orderData.address_to.street1 || '',
                city: orderData.address_to.city || '',
                state: orderData.address_to.state || '',
                zip: orderData.address_to.zip || '',
                country: orderData.address_to.country || 'US',
                phone: orderData.address_to.phone || '',
                email: orderData.address_to.email || ''
              };
            }

            // Mapear address_from (opcional, si no se proporciona usa la cuenta por defecto)
            if (orderData.address_from) {
              orderDetails.address_from = {
                name: orderData.address_from.name || 'Delizukar',
                street1: orderData.address_from.street1 || '',
                city: orderData.address_from.city || '',
                state: orderData.address_from.state || '',
                zip: orderData.address_from.zip || '',
                country: orderData.address_from.country || 'US',
                phone: orderData.address_from.phone || '',
                email: orderData.address_from.email || ''
              };
            }

            // Convertir parcels a line_items con datos reales del pedido
            // Formato según documentación: https://docs.goshippo.com/docs/shippingelements/install/
            if (orderData.parcels && orderData.parcels.length > 0) {
              orderDetails.line_items = orderData.parcels.map((parcel, index) => {
                // Obtener información real del producto si está disponible
                const productName = parcel.name || orderData.cartItems?.[index]?.name || `Item ${index + 1}`;
                const productPrice = parcel.price || orderData.cartItems?.[index]?.price || '0';
                const productQuantity = parcel.quantity || orderData.cartItems?.[index]?.quantity || 1;
                const productWeight = parcel.weight || (parcel.weight && parseFloat(parcel.weight) > 0) ? parcel.weight : '1';
                
                return {
                  title: productName,
                  sku: parcel.sku || orderData.cartItems?.[index]?.id || `ITEM-${index + 1}`,
                  quantity: productQuantity,
                  currency: 'USD',
                  unit_amount: String(parseFloat(productPrice) || 0),
                  unit_weight: String(parseFloat(productWeight) || 1),
                  weight_unit: parcel.mass_unit || 'lb',
                  country_of_origin: orderData.address_from?.country || 'US'
                };
              });
            } else if (orderData.cartItems && orderData.cartItems.length > 0) {
              // Si no hay parcels pero hay cartItems, crear line_items desde cartItems
              orderDetails.line_items = orderData.cartItems.map((item, index) => ({
                title: item.name || `Item ${index + 1}`,
                sku: item.id || `ITEM-${index + 1}`,
                quantity: item.quantity || 1,
                currency: 'USD',
                unit_amount: String(parseFloat(item.price) || 0),
                unit_weight: '0.22', // Peso estimado por galleta (0.22 lb = 100g)
                weight_unit: 'lb',
                country_of_origin: orderData.address_from?.country || 'US'
              }));
            }

            // Agregar order_number si está disponible
            if (orderData.order_number) {
              orderDetails.order_number = orderData.order_number;
            }
          }

          // Paso 3: Escuchar eventos del widget
          // Según: https://docs.goshippo.com/docs/shippingelements/events/
          window.shippo.on('LabelPurchased', (params) => {
            console.log('✅ Label purchased:', params);
            console.log('📦 Label details:', {
              tracking_number: params.tracking_number,
              label_url: params.label_url,
              rate: params.rate
            });
            if (onClose) {
              onClose(params);
            }
          });

          // Escuchar cuando se muestran las opciones de envío
          window.shippo.on('RatesRetrieved', (params) => {
            console.log('📋 Shipping rates retrieved:', params);
            console.log('📦 Available shipping options:', params.rates?.length || 0);
          });

          // Escuchar cuando se selecciona una opción de envío
          window.shippo.on('RateSelected', (params) => {
            console.log('✅ Rate selected:', params);
          });

          window.shippo.on('Error', (error) => {
            console.error('❌ Widget error:', error);
            setError(error.message || 'Error en el widget de Shippo');
          });

          window.shippo.on('Close', () => {
            console.log('Widget closed');
            if (onClose) {
              onClose();
            }
          });

          // Paso 4: Renderizar el widget con labelPurchase()
          // El selector debe ser un ID o clase CSS válido para querySelector
          const containerId = 'shippo-widget-container';
          if (!containerRef.current.id) {
            containerRef.current.id = containerId;
          }

          // Llamar labelPurchase con el selector y los datos del pedido
          window.shippo.labelPurchase(`#${containerId}`, orderDetails);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing Shippo widget:', err);
        setError(err.message || 'Error al inicializar el widget de Shippo');
        setLoading(false);
      }
    };

    loadShippoScript();

    // Cleanup al cerrar
    return () => {
      if (window.shippo) {
        try {
          // Limpiar eventos
          window.shippo.off('LabelPurchased');
          window.shippo.off('RatesRetrieved');
          window.shippo.off('RateSelected');
          window.shippo.off('Error');
          window.shippo.off('Close');
        } catch (e) {
          console.warn('Error cleaning up widget:', e);
        }
      }
    };
  }, [open, orderData]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        zIndex: 17000, // Muy alto para estar por encima de todos los modales
        '& .MuiDialog-paper': {
          zIndex: 17000
        },
        '& .MuiBackdrop-root': {
          zIndex: 16999
        }
      }}
      BackdropProps={{
        sx: {
          zIndex: 16999
        }
      }}
      PaperProps={{
        sx: {
          borderRadius: '16px',
          minHeight: '600px',
          zIndex: 17000
        }
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: '#c8626d',
          color: 'white',
          borderRadius: '16px 16px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Crear Etiqueta de Envío
        </Typography>
        <Button
          onClick={onClose}
          sx={{ color: 'white', minWidth: 'auto', p: 1 }}
        >
          <Close />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 0, position: 'relative', minHeight: '600px' }}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              zIndex: 1000
            }}
          >
            <CircularProgress sx={{ color: '#c8626d', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Cargando widget de Shippo...
            </Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ p: 3 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              sx={{ backgroundColor: '#c8626d' }}
            >
              Recargar Página
            </Button>
          </Box>
        )}

        {/* Contenedor para el widget de Shippo */}
        <Box
          ref={containerRef}
          sx={{
            width: '100%',
            minHeight: '600px',
            '& iframe': {
              border: 'none',
              width: '100%',
              minHeight: '600px'
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ShippoShippingElements;

