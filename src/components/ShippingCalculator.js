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
import { useTranslation } from 'react-i18next';
import shippoService from '../services/shippoService';

const ShippingCalculator = ({ 
  open, 
  onClose, 
  orderData, 
  onShippingSelected 
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState([]);
  const [selectedRate, setSelectedRate] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && orderData) {
      calculateRates();
    }
  }, [open, orderData]);

  const calculateRates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Order data:', orderData);
      
      // Probar conexión primero
      const isConnected = await shippoService.testConnection();
      if (!isConnected) {
        console.log('Using mock rates due to connection issues');
        setRates(shippoService.getMockRates());
        return;
      }
      
      const rates = await shippoService.getShippingRates(
        orderData.address_from,
        orderData.address_to,
        orderData.parcels[0]
      );
      
      console.log('Rates received:', rates);
      setRates(rates);
    } catch (err) {
      console.error('Error calculating rates:', err);
      console.log('Falling back to mock rates');
      setRates(shippoService.getMockRates());
      setError('Usando tarifas de ejemplo (modo desarrollo)');
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
        carrier: selectedRate.provider,
        serviceLevel: selectedRate.servicelevel?.name
      });
      onClose();
    }
  };

  const formatPrice = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Función para calcular fecha de envío según la nueva lógica
  const calculateShippingDate = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
    
    // Calcular días hasta el próximo lunes
    let daysToMonday;
    if (currentDay === 0) { // Domingo
      daysToMonday = 8; // Siguiente lunes (no el inmediato)
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
    return new Date(today.getTime() + (daysToMonday * 24 * 60 * 60 * 1000));
  };

  const formatETA = (eta, rate) => {
    if (!eta) return 'N/A';
    
    // Calcular fecha de envío según la nueva lógica
    const shippingDate = calculateShippingDate();
    
    // Determinar rango de días de tránsito según el tipo de servicio
    let minDays = 2;
    let maxDays = 3;
    
    if (rate && rate.provider) {
      const provider = rate.provider.toLowerCase();
      const serviceLevel = rate.servicelevel?.name?.toLowerCase() || '';
      
      // Asignar rango de días de tránsito según el proveedor y servicio
      if (provider === 'usps') {
        if (serviceLevel.includes('ground') || serviceLevel.includes('standard')) {
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
      } else if (provider === 'fedex') {
        if (serviceLevel.includes('ground')) {
          minDays = 1; maxDays = 5; // 1-5 días
        } else if (serviceLevel.includes('standard')) {
          minDays = 1; maxDays = 3; // 1-3 días
        }
      }
    }
    
    // Calcular fechas de entrega: fecha de envío + rango de días
    const minDeliveryDate = new Date(shippingDate.getTime() + (minDays * 24 * 60 * 60 * 1000));
    const maxDeliveryDate = new Date(shippingDate.getTime() + (maxDays * 24 * 60 * 60 * 1000));
    
    // Formatear fechas
    const formatDate = (date) => {
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    };
    
    // Si es el mismo día, mostrar solo una fecha
    if (minDays === maxDays) {
      return formatDate(minDeliveryDate);
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

        {rates.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
              {t('shippingOptions.selectOption', 'Select a shipping option:')}
            </Typography>

            <Grid container spacing={2} justifyContent="center">
              {rates.map((rate, index) => (
                <Grid item xs={12} sm={6} md={6} lg={6} key={index}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedRate?.object_id === rate.object_id ? '2px solid #c8626d' : '1px solid #e0e0e0',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#c8626d',
                        boxShadow: '0 4px 12px rgba(139, 69, 19, 0.15)'
                      }
                    }}
                    onClick={() => handleSelectRate(rate)}
                  >
                    <CardContent sx={{ p: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Chip
                            label={getCarrierName(rate.provider)}
                            size="small"
                            sx={{
                              backgroundColor: getCarrierColor(rate.provider),
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              height: '20px'
                            }}
                          />
                        </Box>
                        
                        <Typography variant="h6" sx={{ color: '#c8626d', fontWeight: 700, fontSize: '1rem' }}>
                          {formatPrice(rate.amount)}
                        </Typography>
                      </Box>

                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.85rem' }}>
                        {rate.servicelevel?.name || 'Standard'}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {formatETA(rate.eta, rate)}
                        </Typography>
                        
                        {selectedRate?.object_id === rate.object_id && (
                          <CheckCircle color="success" sx={{ fontSize: '1.2rem' }} />
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
