import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress
} from '@mui/material';
import { CheckCircle, ShoppingBag, Home } from '@mui/icons-material';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState(null);
  const [shippingInfo, setShippingInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        console.log('🔍 Checking for payment intent ID...');
        
        // Obtener el payment ID de la URL o localStorage (tanto Stripe como PayPal)
        const urlParams = new URLSearchParams(window.location.search);
        const paymentIntentId = urlParams.get('payment_intent') || 
                                urlParams.get('payment_id') ||
                                localStorage.getItem('lastPaymentIntentId') ||
                                localStorage.getItem('lastPaymentId');
        
        console.log('🔍 Payment Intent ID found:', paymentIntentId);
        
        if (paymentIntentId) {
          console.log('🔍 Fetching payment data from backend...');
          
          // Cargar información de envío del localStorage
          let parsedShippingInfo = null;
          const savedShippingInfo = localStorage.getItem('lastShippingInfo');
          if (savedShippingInfo) {
            try {
              parsedShippingInfo = JSON.parse(savedShippingInfo);
              setShippingInfo(parsedShippingInfo);
              console.log('📦 Shipping info loaded from localStorage:', parsedShippingInfo);
            } catch (error) {
              console.error('❌ Error parsing shipping info:', error);
            }
          }
          
          // Cargar monto del pago desde localStorage
          const savedPaymentAmount = localStorage.getItem('lastPaymentAmount');
          console.log('💰 Saved payment amount:', savedPaymentAmount);
          
          // Cargar orderId para obtener datos de la orden desde Firestore
          const savedOrderId = localStorage.getItem('lastOrderId');
          console.log('📋 Saved order ID:', savedOrderId);
          
          // Consultar datos reales desde el backend
          // En desarrollo usa proxy (string vacío), en producción usa window.location.origin
          const baseUrl = process.env.NODE_ENV === 'production' 
            ? window.location.origin 
            : '';
          
          // Intentar obtener datos de la orden desde Firestore si tenemos orderId
          let orderData = null;
          if (savedOrderId) {
            try {
              const orderResponse = await fetch(`${baseUrl}/api/order/${savedOrderId}`);
              if (orderResponse.ok) {
                const orderResult = await orderResponse.json();
                orderData = orderResult.order;
                console.log('✅ Order data loaded from Firestore:', orderData);
                
                // Si no tenemos shippingInfo del localStorage, intentar obtenerlo de la orden
                if (!parsedShippingInfo && orderData?.shippingInfo) {
                  parsedShippingInfo = orderData.shippingInfo;
                  setShippingInfo(parsedShippingInfo);
                  console.log('📦 Shipping info loaded from order:', parsedShippingInfo);
                }
              }
            } catch (error) {
              console.warn('⚠️ Could not load order data:', error);
            }
          }
          
          const response = await fetch(`${baseUrl}/api/payment-intent/${paymentIntentId}`);
          console.log('🔍 Backend response status:', response.status);
          
          if (response.ok) {
            const paymentData = await response.json();
            console.log('✅ Payment data received:', paymentData);
            
            // Usar el monto guardado si está disponible, sino usar el del backend
            let finalAmount = savedPaymentAmount ? parseFloat(savedPaymentAmount) : (paymentData.amount / 100);
            
            // Si tenemos datos de la orden, usar el total de la orden (más confiable)
            if (orderData?.total) {
              finalAmount = parseFloat(orderData.total);
              console.log('💰 Using total from order data:', finalAmount);
            }
            
            // Obtener el costo de envío real desde shippingInfo o orderData
            let shippingCost = 0;
            
            // Prioridad 1: shippingInfo del localStorage (el que se seleccionó)
            if (parsedShippingInfo?.cost) {
              shippingCost = parseFloat(parsedShippingInfo.cost);
              console.log('📦 Shipping cost from localStorage shippingInfo:', shippingCost);
            }
            // Prioridad 2: shippingInfo de la orden guardada
            else if (orderData?.shippingInfo?.cost) {
              shippingCost = parseFloat(orderData.shippingInfo.cost);
              console.log('📦 Shipping cost from order shippingInfo:', shippingCost);
            }
            // Prioridad 3: calcular desde orderData.total y subtotal
            else if (orderData?.total && orderData?.cartItems) {
              const itemsSubtotal = orderData.cartItems.reduce((sum, item) => {
                return sum + (parseFloat(item.price) * parseInt(item.quantity));
              }, 0);
              shippingCost = parseFloat(orderData.total) - itemsSubtotal;
              console.log('📦 Shipping cost calculated from order total:', shippingCost);
            }
            
            // Calcular subtotal correctamente
            const subtotal = finalAmount - shippingCost;
            
            console.log('💰 Payment calculation:', {
              savedPaymentAmount,
              paymentDataAmount: paymentData.amount,
              orderTotal: orderData?.total,
              finalAmount,
              shippingCost,
              subtotal,
              shippingInfoSource: parsedShippingInfo?.cost ? 'localStorage' : orderData?.shippingInfo?.cost ? 'order' : 'calculated'
            });
            
            setOrderDetails({
              sessionId: paymentData.id,
              amount: finalAmount, // Usar el monto correcto
              currency: paymentData.currency || 'USD',
              customerEmail: paymentData.receipt_email || paymentData.customer_email,
              paymentStatus: paymentData.status,
              shipping: shippingCost, // Usar el costo de envío real
              subtotal: subtotal
            });
          } else {
            const errorData = await response.json();
            console.error('❌ Backend error:', errorData);
            throw new Error(`Error del servidor: ${errorData.error || 'Error desconocido'}`);
          }
        } else {
          console.log('❌ No payment intent ID found');
          throw new Error('No se encontró ID de pago. Por favor, completa el proceso de pago nuevamente.');
        }
      } catch (error) {
        console.error('❌ Error obteniendo datos del pago:', error);
        setError(error.message || 'No se pudieron cargar los detalles del pago');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, []);




  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <CircularProgress size={60} sx={{ color: '#c8626d' }} />
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
            backgroundColor: '#c8626d',
            '&:hover': { backgroundColor: '#6B3410' }
          }}
        >
          Volver al Inicio
        </Button>
      </Container>
    );
  }

  if (!orderDetails) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          No se pudieron cargar los detalles del pago. Por favor, contacta con soporte.
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          sx={{
            backgroundColor: '#c8626d',
            '&:hover': { backgroundColor: '#6B3410' }
          }}
        >
          Volver al Inicio
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Container maxWidth="xs" sx={{ py: 2, flex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
        <Card sx={{ textAlign: 'center', p: 2, maxWidth: '400px', mx: 'auto' }}>
          <CardContent>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle 
                sx={{ 
                  fontSize: 50, 
                  color: '#4CAF50', 
                  mb: 1 
                }} 
              />
            </motion.div>

            <Typography variant="h5" sx={{ 
              fontWeight: 700, 
              color: '#c8626d', 
              mb: 1 
            }}>
              Payment Successful!
            </Typography>

            <Typography variant="body2" sx={{ 
              color: '#666', 
              mb: 2,
              lineHeight: 1.4,
              fontSize: '0.9rem'
            }}>
              Thank you for your purchase! Your payment has been processed successfully.
            </Typography>

            <Box sx={{ 
              backgroundColor: '#e8f5e8', 
              p: 1.5, 
              borderRadius: 1, 
              mb: 2,
              border: '1px solid #4CAF50'
            }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#2E7D32', mb: 0.5, fontSize: '0.9rem' }}>
                📧 Confirmation email sent
              </Typography>
            </Box>

            {orderDetails && (
              <Box sx={{ 
                backgroundColor: '#f8f9fa', 
                p: 1.5, 
                borderRadius: 1, 
                mb: 2 
              }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.9rem', color: '#c8626d' }}>
                  📋 Payment Summary
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#666' }}>
                    Subtotal:
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#666' }}>
                    ${(orderDetails.subtotal || (orderDetails.amount - (orderDetails.shipping || 0))).toFixed(2)} {orderDetails.currency?.toUpperCase()}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#666' }}>
                    Envío:
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#666' }}>
                    ${(orderDetails.shipping || 0).toFixed(2)} {orderDetails.currency?.toUpperCase()}
                  </Typography>
                </Box>
                
                <Box sx={{ borderTop: '1px solid #ddd', pt: 0.5, mt: 0.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      Total Paid:
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#c8626d', fontSize: '1rem' }}>
                      ${orderDetails.amount.toFixed(2)} {orderDetails.currency?.toUpperCase()}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Shipping Information */}
            {shippingInfo && (
              <Box sx={{ 
                backgroundColor: '#e8f5e8', 
                p: 2, 
                borderRadius: 1, 
                mb: 2,
                border: '1px solid #4caf50'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2e7d32', mb: 1.5, fontSize: '1rem' }}>
                  ✓ Shipping Configured
                </Typography>
                
                {shippingInfo.shippingDate && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#388e3c', fontSize: '0.9rem' }}>
                      📦 Su pedido se enviará el {shippingInfo.shippingDate.toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Typography>
                  </Box>
                )}
                
                {shippingInfo.transitDays && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#2e7d32', fontSize: '0.85rem' }}>
                      🚚 Tránsito estimado: {
                        shippingInfo.minTransitDays !== undefined && shippingInfo.maxTransitDays !== undefined
                          ? (shippingInfo.minTransitDays === shippingInfo.maxTransitDays
                              ? shippingInfo.minTransitDays
                              : `${shippingInfo.minTransitDays} - ${shippingInfo.maxTransitDays}`)
                          : (() => {
                              const transitValue = `${shippingInfo.transitDays}`.trim();
                              if (transitValue.includes('-')) {
                                const parts = transitValue.split('-').map((p) => p.trim());
                                return `${parts[0]} - ${parts[1]}`;
                              }
                              if (!Number.isNaN(parseInt(transitValue, 10)) && transitValue.length === 2) {
                                return `${transitValue[0]} - ${transitValue[1]}`;
                              }
                              return transitValue;
                            })()
                      } días
                    </Typography>
                  </Box>
                )}
                
                {shippingInfo.deliveryDate && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#2e7d32', fontSize: '0.85rem' }}>
                      📅 Entrega estimada: {shippingInfo.deliveryDate.toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                    Tracking: {shippingInfo.trackingNumber || 'PENDING'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                    Carrier: {shippingInfo.carrier} - {shippingInfo.serviceLevel}
                  </Typography>
                </Box>
                
                {shippingInfo.eta && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ color: '#666', fontSize: '0.75rem', fontStyle: 'italic' }}>
                      ETA: {shippingInfo.eta}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}


            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<ShoppingBag />}
                onClick={() => navigate('/productos')}
                size="small"
                sx={{
                  backgroundColor: '#c8626d',
                  '&:hover': { backgroundColor: '#6B3410' },
                  px: 2,
                  py: 0.5,
                  borderRadius: '15px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  minWidth: '120px'
                }}
              >
                Continue Shopping
              </Button>

              <Button
                variant="outlined"
                startIcon={<Home />}
                onClick={() => navigate('/')}
                size="small"
                sx={{
                  borderColor: '#c8626d',
                  color: '#c8626d',
                  px: 2,
                  py: 0.5,
                  borderRadius: '15px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  minWidth: '120px',
                  '&:hover': {
                    backgroundColor: '#c8626d',
                    color: 'white',
                    borderColor: '#c8626d'
                  }
                }}
              >
                Go to Home
              </Button>
            </Box>
          </CardContent>
        </Card>
        </motion.div>
      </Container>
    </Box>
  );
};

export default CheckoutSuccess;

