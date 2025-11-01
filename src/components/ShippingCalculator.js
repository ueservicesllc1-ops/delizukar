import React, { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Divider,
  Grid
} from '@mui/material';
import { LocalShipping, CheckCircle, Close } from '@mui/icons-material';
 
// Eliminado shippoService - ahora usamos EasyPost
import easypostService from '../services/easypostService';

const ShippingCalculator = ({ 
  open, 
  onClose, 
  orderData, 
  onShippingSelected 
}) => {
  const t = (k, fallback) => (typeof fallback === 'string' ? fallback : (typeof k === 'string' ? k : ''));
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState([]);
  const [selectedRate, setSelectedRate] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('ShippingCalculator useEffect triggered:', { open, orderData });
    if (open && orderData) {
      console.log('Opening shipping calculator with order data:', orderData);
      calculateRates();
    }
  }, [open, orderData]);

  const calculateRates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting calculateRates with order data:', orderData);
      
      // Verificar que orderData tenga la estructura correcta
      if (!orderData || !orderData.address_from || !orderData.address_to || !orderData.parcels) {
        console.error('Invalid order data structure:', orderData);
        throw new Error('Invalid order data structure');
      }
      
      console.log('Order data structure is valid');
      
      // Obtener tarifas de EasyPost
      console.log('Getting rates from EasyPost...');
      const rates = await easypostService.getShippingRates(
        orderData.address_from,
        orderData.address_to,
        orderData.parcels[0]
      );
      
      console.log('Rates received from EasyPost:', rates);
      
      // Filtrar solo USPS, UPS, FedEx y DHL
      const filteredRates = rates.filter(rate => {
        const carrier = rate.carrier?.toLowerCase();
        return carrier === 'usps' || 
               carrier === 'ups' || 
               carrier === 'upsdap' || 
               carrier === 'fedex' || 
               carrier === 'fedexdefault' ||
               carrier === 'dhl' ||
               carrier === 'dhlexpress';
      });
      
      console.log('Filtered rates (USPS, UPS, FedEx, DHL only):', filteredRates);
      setRates(filteredRates);
    } catch (err) {
      console.error('Error calculating rates:', err);
      setError('No se pudieron obtener las tarifas de envío. Por favor, verifica la configuración de EasyPost.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRate = (rate) => {
    setSelectedRate(rate);
  };

  const handleConfirmShipping = () => {
    if (selectedRate) {
      onShippingSelected({
        rate: selectedRate,
        trackingNumber: 'PENDING', // Se generará al comprar la etiqueta
        labelUrl: null,
        packingSlipUrl: null,
        eta: selectedRate.eta,
        cost: selectedRate.amount,
                  carrier: selectedRate.carrier || selectedRate.provider,
        serviceLevel: selectedRate.service || selectedRate.servicelevel?.name
      });
      onClose();
    }
  };

  const formatPrice = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Función para calcular fecha de envío según la lógica de la empresa
  // Recogen pedidos de lunes a jueves y envían el siguiente lunes
  const calculateShippingDate = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
    
    console.log('📆 Hoy es:', today.toLocaleDateString('es-ES'), 'Día de la semana:', currentDay);
    
    // Calcular días hasta el próximo lunes
    // Según la lógica: pedidos de lunes a jueves se envían el siguiente lunes
    // Pedidos de viernes a domingo se envían el lunes de la semana siguiente
    let daysToMonday;
    if (currentDay === 0) { // Domingo
      daysToMonday = 8; // Lunes de la semana siguiente (no el inmediato)
    } else if (currentDay === 1) { // Lunes
      daysToMonday = 7; // Siguiente lunes
    } else if (currentDay === 2) { // Martes
      daysToMonday = 6; // Siguiente lunes
    } else if (currentDay === 3) { // Miércoles
      daysToMonday = 5; // Siguiente lunes
    } else if (currentDay === 4) { // Jueves
      daysToMonday = 4; // Siguiente lunes
    } else if (currentDay === 5) { // Viernes
      daysToMonday = 10; // Lunes de la semana siguiente (no el inmediato)
    } else if (currentDay === 6) { // Sábado
      daysToMonday = 9; // Lunes de la semana siguiente (no el inmediato)
    }
    
    // Fecha de envío (próximo lunes)
    const shippingDate = new Date(today.getTime() + (daysToMonday * 24 * 60 * 60 * 1000));
    
    console.log('📦 Días hasta el lunes:', daysToMonday);
    console.log('📬 Fecha de envío:', shippingDate.toLocaleDateString('es-ES'));
    
    return shippingDate;
  };

  const formatETA = (eta, rate) => {
    // Calcular fecha de envío según la nueva lógica
    const shippingDate = calculateShippingDate();
    
    console.log('📅 Fecha de envío calculada:', shippingDate.toLocaleDateString('es-ES'));
    
    // Determinar rango de días de tránsito según el tipo de servicio
    let minDays = 2;
    let maxDays = 3;
    
    const carrier = (rate.carrier || rate.provider || '').toLowerCase();
    const serviceLevel = (rate.service || rate.servicelevel?.name || '').toLowerCase();
    
    console.log('🚚 Carrier:', carrier, 'Service:', serviceLevel);
    
    if (rate && carrier) {
      const provider = carrier;
      
      // Asignar rango de días de tránsito según el proveedor y servicio
      if (provider === 'usps') {
        if (serviceLevel.includes('ground') || serviceLevel.includes('advantage')) {
          minDays = 2; maxDays = 3; // 2-3 días
        } else if (serviceLevel.includes('priority')) {
          minDays = 1; maxDays = 2; // 1-2 días
        } else if (serviceLevel.includes('express')) {
          minDays = 1; maxDays = 1; // 1 día
        }
      } else if (provider === 'ups') {
        if (serviceLevel.includes('ground')) {
          minDays = 1; maxDays = 5; // 1-5 días
        } else if (serviceLevel.includes('standard')) {
          minDays = 1; maxDays = 3; // 1-3 días
        }
      } else if (provider === 'fedex' || provider === 'fedexdefault') {
        if (serviceLevel.includes('smart') || serviceLevel.includes('post')) {
          minDays = 2; maxDays = 3; // 2-3 días
        } else if (serviceLevel.includes('ground')) {
          minDays = 1; maxDays = 5; // 1-5 días
        } else if (serviceLevel.includes('standard')) {
          minDays = 1; maxDays = 3; // 1-3 días
        }
      } else if (provider === 'easypost') {
        // EasyPost no especifica el carrier directamente, usar valores por defecto
        minDays = 2; maxDays = 3;
      }
    }
    
    console.log('📦 Días de tránsito:', minDays, '-', maxDays);
    
    // Calcular fechas de entrega: fecha de envío + rango de días
    const minDeliveryDate = new Date(shippingDate.getTime() + (minDays * 24 * 60 * 60 * 1000));
    const maxDeliveryDate = new Date(shippingDate.getTime() + (maxDays * 24 * 60 * 60 * 1000));
    
    console.log('📬 Fechas de entrega:', minDeliveryDate.toLocaleDateString('es-ES'), '-', maxDeliveryDate.toLocaleDateString('es-ES'));
    
    // Formatear fechas
    const formatDate = (date) => {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long'
      });
    };
    
    // Si es el mismo día, mostrar solo una fecha
    if (minDays === maxDays) {
      return `${formatDate(minDeliveryDate)}`;
    }
    
    // Mostrar rango de fechas
    return `del ${formatDate(minDeliveryDate)} al ${formatDate(maxDeliveryDate)}`;
  };

  const getCarrierColor = (carrier) => {
    const colors = {
      'fedex': '#4D148C',
      'ups': '#7B68EE',
      'usps': '#004B87',
      'dhl': '#D40511'
    };
    return colors[carrier] || '#c8626d';
  };

  const getCarrierName = (carrier) => {
    const names = {
      'fedex': 'FedEx',
      'ups': 'UPS',
      'usps': 'USPS',
      'dhl': 'DHL'
    };
    return names[carrier] || carrier.toUpperCase();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '16px' }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: '#c8626d', 
        color: 'white',
        borderRadius: '16px 16px 0 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalShipping />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('shippingOptions.title', 'Shipping Options')}
          </Typography>
        </Box>
        <Button
          onClick={onClose}
          sx={{ color: 'white', minWidth: 'auto', p: 1 }}
        >
          <Close />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={calculateRates}>
                Reintentar
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#c8626d', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              {t('shippingOptions.calculating', 'Calculando opciones de envío...')}
            </Typography>
          </Box>
        )}

        {!loading && rates.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
              No shipping options available
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Please check your address or try again later.
            </Typography>
            <Button 
              variant="contained" 
              onClick={calculateRates}
              sx={{ backgroundColor: '#c8626d' }}
            >
              Try Again
            </Button>
          </Box>
        )}

        {rates.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
              {t('shippingOptions.selectOption', 'Select a shipping option:')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, textAlign: 'center', color: 'text.secondary' }}>
              Found {rates.length} shipping options
            </Typography>

            <Grid container spacing={{ xs: 1, sm: 2 }} justifyContent="center">
              {rates.map((rate, index) => (
                <Grid 
                  item 
                  xs={12}        // 1 por línea en móvil
                  sm={6}         // 2 por línea en tablet
                  md={6}         // 2 por línea en laptop
                  lg={4}         // 3 por línea en desktop grande
                  xl={3}         // 4 por línea en pantallas extra grandes
                  key={index}
                >
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedRate?.object_id === rate.object_id ? '2px solid #c8626d' : '1px solid #e0e0e0',
                      transition: 'all 0.3s ease',
                      height: '100%', // Altura uniforme
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        borderColor: '#c8626d',
                        boxShadow: '0 4px 12px rgba(139, 69, 19, 0.15)',
                        transform: 'translateY(-2px)' // Efecto sutil
                      }
                    }}
                    onClick={() => handleSelectRate(rate)}
                  >
                    <CardContent 
                      sx={{ 
                        p: { xs: 1, sm: 1.5, md: 2 }, // Padding responsivo
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      {/* Header con chip y precio */}
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start', 
                        mb: { xs: 0.5, sm: 1 } 
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Chip
                            label={getCarrierName(rate.carrier || rate.provider)}
                            size="small"
                            sx={{
                              backgroundColor: getCarrierColor(rate.carrier || rate.provider),
                              color: 'white',
                              fontWeight: 600,
                              fontSize: { xs: '0.65rem', sm: '0.7rem' },
                              height: { xs: '18px', sm: '20px' }
                            }}
                          />
                        </Box>
                        
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: '#c8626d', 
                            fontWeight: 700, 
                            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' }
                          }}
                        >
                          {formatPrice(rate.amount)}
                        </Typography>
                      </Box>

                      {/* Nombre del servicio */}
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: 600, 
                          mb: { xs: 0.5, sm: 1 }, 
                          fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
                          lineHeight: 1.2
                        }}
                      >
                        {rate.service || rate.servicelevel?.name || 'Standard'}
                      </Typography>

                      {/* Información de entrega */}
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mt: 'auto' // Empuja hacia abajo
                      }}>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                            lineHeight: 1.3
                          }}
                        >
                          {formatETA(rate.eta, rate)}
                        </Typography>
                        
                        {selectedRate?.object_id === rate.object_id && (
                          <CheckCircle 
                            color="success" 
                            sx={{ 
                              fontSize: { xs: '1rem', sm: '1.2rem' }
                            }} 
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={onClose}
                sx={{
                  borderColor: '#c8626d',
                  color: '#c8626d',
                  '&:hover': {
                    borderColor: '#b5555a',
                    backgroundColor: '#c8626d10'
                  }
                }}
              >
                {t('shippingOptions.cancel', 'Cancel')}
              </Button>
              
              <Button
                variant="contained"
                onClick={handleConfirmShipping}
                disabled={!selectedRate}
                sx={{
                  backgroundColor: selectedRate ? '#c8626d' : '#ccc',
                  '&:hover': {
                    backgroundColor: selectedRate ? '#b5555a' : '#ccc'
                  }
                }}
              >
                {t('shippingOptions.confirm', 'Confirm Shipping')}
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShippingCalculator;
