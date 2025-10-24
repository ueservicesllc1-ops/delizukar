import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  Alert
} from '@mui/material';
import {
  CheckCircle,
  LocalShipping,
  Schedule,
  DeliveryDining,
  TrackChanges,
  CreditCard,
  Payment
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import StripeCheckout from './StripeCheckout';

const ShippingConfirmationPopup = ({ 
  open, 
  onClose, 
  shippingInfo, 
  onAccept, 
  cartItems = [], 
  total = 0, 
  customerInfo = {},
  onPaymentSuccess,
  onPaymentError
}) => {
  const { t } = useTranslation();
  const [showPayment, setShowPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  if (!shippingInfo) return null;

  // Función para calcular fecha de entrega estimada
  const calculateDeliveryDate = () => {
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
    const shippingDate = new Date(today.getTime() + (daysToMonday * 24 * 60 * 60 * 1000));
    
    // Días de tránsito del proveedor (usando el rango)
    let minTransitDays = 2;
    let maxTransitDays = 3;
    
    if (shippingInfo?.transitDays) {
      const transitRange = shippingInfo.transitDays.split('-');
      if (transitRange.length === 2) {
        minTransitDays = parseInt(transitRange[0]);
        maxTransitDays = parseInt(transitRange[1]);
      }
    }
    
    // Fechas estimadas de entrega (rango)
    const minDeliveryDate = new Date(shippingDate.getTime() + (minTransitDays * 24 * 60 * 60 * 1000));
    const maxDeliveryDate = new Date(shippingDate.getTime() + (maxTransitDays * 24 * 60 * 60 * 1000));
    
    return {
      shippingDate,
      minDeliveryDate,
      maxDeliveryDate,
      minTransitDays,
      maxTransitDays,
      transitDays: shippingInfo?.transitDays || '2-3'
    };
  };

  const deliveryInfo = calculateDeliveryDate();

  const handleAccept = () => {
    setShowPayment(true);
    onAccept && onAccept();
  };

  const handlePaymentSuccess = (paymentIntent) => {
    onPaymentSuccess && onPaymentSuccess(paymentIntent);
    onClose();
  };

  const handlePaymentError = (error) => {
    setPaymentError(error.message);
    onPaymentError && onPaymentError(error);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '15px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <CheckCircle sx={{ color: '#4CAF50', fontSize: '2rem', mr: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>
            {t('shippingConfirmation.title', 'Envío Configurado')}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        {!showPayment ? (
          <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              {/* Información de envío */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocalShipping sx={{ color: '#c8626d', mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                    {t('shippingConfirmation.shippingDetails', 'Detalles de Envío')}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Schedule sx={{ color: '#666', mr: 1, fontSize: '1rem' }} />
                  <Typography variant="body1" sx={{ color: '#666' }}>
                    {t('shippingConfirmation.shippedOn', 'Tu pedido será enviado el')} {deliveryInfo.shippingDate.toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <LocalShipping sx={{ color: '#666', mr: 1, fontSize: '1rem' }} />
                  <Typography variant="body1" sx={{ color: '#666' }}>
                    {t('shippingConfirmation.transitTime', 'Tiempo de tránsito estimado')}: {deliveryInfo.transitDays} {t('shippingConfirmation.days', 'días')}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <DeliveryDining sx={{ color: '#c8626d', mr: 1, fontSize: '1rem' }} />
                  <Typography variant="body1" sx={{ color: '#c8626d', fontWeight: 600 }}>
                    {t('shippingConfirmation.estimatedDelivery', 'Entrega estimada')}: {
                      deliveryInfo.minTransitDays === deliveryInfo.maxTransitDays 
                        ? deliveryInfo.minDeliveryDate.toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long' 
                          })
                        : `del ${deliveryInfo.minDeliveryDate.toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long' 
                          })} al ${deliveryInfo.maxDeliveryDate.toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long' 
                          })}`
                    }
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Información del transportista */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <TrackChanges sx={{ color: '#666', mr: 1, fontSize: '1rem' }} />
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {t('shippingConfirmation.tracking', 'Seguimiento')}: {shippingInfo.trackingNumber || 'PENDING'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <LocalShipping sx={{ color: '#666', mr: 1, fontSize: '1rem' }} />
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {t('shippingConfirmation.carrier', 'Transportista')}: {shippingInfo.carrier} - {shippingInfo.serviceLevel}
                  </Typography>
                </Box>

                {shippingInfo.eta && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Schedule sx={{ color: '#666', mr: 1, fontSize: '1rem' }} />
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      ETA: {new Date(shippingInfo.eta).toLocaleDateString('es-ES')}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <CreditCard sx={{ color: '#c8626d', mr: 1, fontSize: '1.2rem' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                  {t('shippingConfirmation.paymentInfo', 'Información de Pago')}
                </Typography>
              </Box>

              {paymentError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {paymentError}
                </Alert>
              )}

              <StripeCheckout 
                cartItems={cartItems}
                total={total + (shippingInfo ? parseFloat(shippingInfo.cost || 0) : 0)}
                customerInfo={customerInfo}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </CardContent>
          </Card>
        )}
      </DialogContent>

      {!showPayment && (
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={onClose}
            sx={{
              color: '#666',
              textTransform: 'none',
              fontWeight: 600,
              mr: 2
            }}
          >
            {t('shippingConfirmation.cancel', 'Cancelar')}
          </Button>
          <Button
            onClick={handleAccept}
            variant="contained"
            sx={{
              backgroundColor: '#c8626d',
              color: 'white',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: '#b5555a'
              }
            }}
          >
            {t('shippingConfirmation.accept', 'Estoy de Acuerdo')}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ShippingConfirmationPopup;
