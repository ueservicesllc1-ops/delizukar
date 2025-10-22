import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  Chip
} from '@mui/material';
import { CheckCircle, ShoppingBag, Home, Receipt, Download, Email } from '@mui/icons-material';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState(null);
  const [receiptInfo, setReceiptInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar el estado del pago
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      // Aquí puedes verificar el estado del pago con tu backend
      verifyPayment(sessionId);
    } else {
      setError('No se encontró información de la sesión de pago');
      setLoading(false);
    }
  }, [searchParams]);

  const verifyPayment = async (sessionId) => {
    try {
      // Verificar el pago con tu backend
      const response = await fetch(`http://localhost:5000/api/checkout-session/${sessionId}`);
      const data = await response.json();
      
      if (data.session) {
        setOrderDetails({
          sessionId: data.session.id,
          amount: data.session.amount_total / 100,
          currency: data.session.currency,
          customerEmail: data.session.customer_email,
          paymentStatus: data.session.payment_status
        });
        
        // Obtener información del recibo si está disponible
        if (data.session.payment_intent) {
          await fetchReceiptInfo(data.session.payment_intent);
        }
      } else {
        setError('Error al verificar el pago');
      }
    } catch (err) {
      console.error('Error verifying payment:', err);
      setError('Error al verificar el pago');
    } finally {
      setLoading(false);
    }
  };

  const fetchReceiptInfo = async (paymentIntentId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/receipt/${paymentIntentId}`);
      const data = await response.json();
      
      if (data.receiptUrl) {
        setReceiptInfo(data);
      }
    } catch (err) {
      console.error('Error fetching receipt:', err);
    }
  };

  const handleDownloadReceipt = () => {
    if (receiptInfo?.receiptUrl) {
      window.open(receiptInfo.receiptUrl, '_blank');
    }
  };

  const handleSendReceipt = async () => {
    if (orderDetails?.sessionId) {
      try {
        const response = await fetch('http://localhost:5000/api/send-receipt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: receiptInfo?.paymentIntent?.id,
            email: orderDetails.customerEmail
          }),
        });
        
        const data = await response.json();
        if (data.success) {
          alert('Recibo enviado por email exitosamente');
        }
      } catch (err) {
        console.error('Error sending receipt:', err);
        alert('Error al enviar el recibo');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <CircularProgress size={60} sx={{ color: '#8B4513' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          sx={{
            backgroundColor: '#8B4513',
            '&:hover': { backgroundColor: '#6B3410' }
          }}
        >
          Volver al Inicio
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card sx={{ textAlign: 'center', p: 4 }}>
          <CardContent>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle 
                sx={{ 
                  fontSize: 80, 
                  color: '#4CAF50', 
                  mb: 2 
                }} 
              />
            </motion.div>

            <Typography variant="h3" sx={{ 
              fontWeight: 700, 
              color: '#8B4513', 
              mb: 2 
            }}>
              ¡Pago Exitoso!
            </Typography>

            <Typography variant="h6" sx={{ 
              color: '#666', 
              mb: 4,
              lineHeight: 1.6
            }}>
              Gracias por tu compra. Tu pedido ha sido procesado correctamente 
              y recibirás un email de confirmación pronto.
            </Typography>

            {orderDetails && (
              <Box sx={{ 
                backgroundColor: '#f8f9fa', 
                p: 3, 
                borderRadius: 2, 
                mb: 4 
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Detalles del Pedido
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>ID de Sesión:</strong> {orderDetails.sessionId}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Total:</strong> ${orderDetails.amount} {orderDetails.currency?.toUpperCase()}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Email:</strong> {orderDetails.customerEmail}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Estado:</strong> 
                  <Chip 
                    label={orderDetails.paymentStatus} 
                    color="success" 
                    size="small" 
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography variant="body1">
                  <strong>Fecha:</strong> {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            )}

            {/* Receipt Section */}
            {receiptInfo && (
              <Box sx={{ 
                backgroundColor: '#e8f5e8', 
                p: 3, 
                borderRadius: 2, 
                mb: 4,
                border: '1px solid #4CAF50'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Receipt sx={{ color: '#4CAF50', mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2E7D32' }}>
                    Recibo Disponible
                  </Typography>
                </Box>
                
                <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                  Tu recibo ha sido generado automáticamente. Puedes descargarlo o enviarlo por email.
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={handleDownloadReceipt}
                    sx={{
                      backgroundColor: '#4CAF50',
                      '&:hover': { backgroundColor: '#388E3C' },
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Descargar Recibo
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<Email />}
                    onClick={handleSendReceipt}
                    sx={{
                      borderColor: '#4CAF50',
                      color: '#4CAF50',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        borderColor: '#4CAF50'
                      }
                    }}
                  >
                    Enviar por Email
                  </Button>
                </Box>

                {receiptInfo.charge?.receiptNumber && (
                  <Typography variant="caption" sx={{ 
                    display: 'block', 
                    mt: 2, 
                    color: '#666',
                    fontStyle: 'italic'
                  }}>
                    Número de recibo: {receiptInfo.charge.receiptNumber}
                  </Typography>
                )}
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<ShoppingBag />}
                onClick={() => navigate('/productos')}
                sx={{
                  backgroundColor: '#8B4513',
                  '&:hover': { backgroundColor: '#6B3410' },
                  px: 4,
                  py: 1.5,
                  borderRadius: '25px',
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Seguir Comprando
              </Button>

              <Button
                variant="outlined"
                startIcon={<Home />}
                onClick={() => navigate('/')}
                sx={{
                  borderColor: '#8B4513',
                  color: '#8B4513',
                  px: 4,
                  py: 1.5,
                  borderRadius: '25px',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: '#8B4513',
                    color: 'white',
                    borderColor: '#8B4513'
                  }
                }}
              >
                Ir al Inicio
              </Button>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
};

export default CheckoutSuccess;
