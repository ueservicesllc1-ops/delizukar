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
import shippoService from '../services/shippoService';

const ShippingCalculator = ({ 
  open, 
  onClose, 
  orderData, 
  onShippingSelected 
}) => {
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

  const formatETA = (eta) => {
    if (!eta) return 'N/A';
    const date = new Date(eta);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCarrierColor = (carrier) => {
    const colors = {
      'fedex': '#4D148C',
      'ups': '#7B68EE',
      'usps': '#004B87',
      'dhl': '#D40511'
    };
    return colors[carrier] || '#8B4513';
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
        backgroundColor: '#8B4513', 
        color: 'white',
        borderRadius: '16px 16px 0 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalShipping />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Opciones de Envío
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
            <CircularProgress sx={{ color: '#8B4513', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Calculando opciones de envío...
            </Typography>
          </Box>
        )}

        {rates.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Selecciona una opción de envío:
            </Typography>

            <Grid container spacing={2}>
              {rates.map((rate, index) => (
                <Grid item xs={12} key={index}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedRate?.object_id === rate.object_id ? '2px solid #8B4513' : '1px solid #e0e0e0',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#8B4513',
                        boxShadow: '0 4px 12px rgba(139, 69, 19, 0.15)'
                      }
                    }}
                    onClick={() => handleSelectRate(rate)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={getCarrierName(rate.provider)}
                            size="small"
                            sx={{
                              backgroundColor: getCarrierColor(rate.provider),
                              color: 'white',
                              fontWeight: 600
                            }}
                          />
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {rate.servicelevel?.name || 'Standard'}
                          </Typography>
                        </Box>
                        
                        <Typography variant="h6" sx={{ color: '#8B4513', fontWeight: 700 }}>
                          {formatPrice(rate.amount)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Entrega: {formatETA(rate.eta)}
                        </Typography>
                        
                        {selectedRate?.object_id === rate.object_id && (
                          <CheckCircle color="success" />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={onClose}
                sx={{
                  borderColor: '#8B4513',
                  color: '#8B4513',
                  '&:hover': {
                    borderColor: '#A0522D',
                    backgroundColor: '#8B451310'
                  }
                }}
              >
                Cancelar
              </Button>
              
              <Button
                variant="contained"
                onClick={handleConfirmShipping}
                disabled={!selectedRate}
                sx={{
                  backgroundColor: selectedRate ? '#8B4513' : '#ccc',
                  '&:hover': {
                    backgroundColor: selectedRate ? '#A0522D' : '#ccc'
                  }
                }}
              >
                Confirmar Envío
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShippingCalculator;
