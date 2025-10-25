import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Container, Typography, Grid, Card, CardContent, TextField, Button, Divider, Alert } from '@mui/material';
import { CreditCard, LocalShipping, Security, ArrowBack } from '@mui/icons-material';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import ShippingCalculator from '../components/ShippingCalculator';
import AddressCorrection from '../components/AddressCorrection';
import PayPalPaymentForm from '../components/PayPalPaymentForm';
import ShippingConfirmationPopup from '../components/ShippingConfirmationPopup';
import { useShipping } from '../hooks/useShipping';
import { useTranslation } from 'react-i18next';

const Checkout = () => {
  const { t } = useTranslation();
  const { getCartTotal, getCartItemsCount, clearCart, cart } = useStore();
  const navigate = useNavigate();
  const { createOrderData } = useShipping();
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zipCode: '',
    phone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: ''
  });

  // Estados para Shipping
  const [shippingOpen, setShippingOpen] = useState(false);
  const [shippingInfo, setShippingInfo] = useState(null);
  const [shippingError, setShippingError] = useState(null);
  
  // Estados para corrección de direcciones
  const [addressCorrectionOpen, setAddressCorrectionOpen] = useState(false);
  const [correctedAddress, setCorrectedAddress] = useState(null);
  
  // Estados para PayPal
  const [paymentError, setPaymentError] = useState(null);
  
  // Estados para popup de confirmación de envío
  const [shippingConfirmationOpen, setShippingConfirmationOpen] = useState(false);

  const cartTotal = getCartTotal();
  const cartItemsCount = getCartItemsCount();

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
    
    // Días de tránsito del proveedor (usando el rango medio)
    let transitDays = 3; // Default
    if (shippingInfo?.transitDays) {
      const transitRange = shippingInfo.transitDays.split('-');
      if (transitRange.length === 2) {
        transitDays = Math.ceil((parseInt(transitRange[0]) + parseInt(transitRange[1])) / 2);
      }
    }
    
    // Fecha estimada de entrega
    const deliveryDate = new Date(shippingDate.getTime() + (transitDays * 24 * 60 * 60 * 1000));
    
    return {
      shippingDate,
      deliveryDate,
      transitDays: shippingInfo?.transitDays || '2-3',
      daysToMonday
    };
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Calcular envío automáticamente cuando se complete la dirección
    if (e.target.name === 'zipCode' && e.target.value.length >= 5) {
      setTimeout(() => {
        if (formData.firstName && formData.lastName && formData.address && formData.city && e.target.value) {
          handleOpenShipping();
        }
      }, 1000); // Esperar 1 segundo después de escribir el código postal
    }
  };

  // Crear datos de envío para Shippo
  const createShippingData = () => {
    const fromAddress = {
      name: 'Delizukar',
      company: 'Delizukar Bakery',
      street1: '123 Baker Street',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'US',
      phone: '+1 555 123 4567',
      email: 'orders@delizukar.com',
      is_residential: false
    };

    const toAddress = {
      name: `${formData.firstName} ${formData.lastName}`,
      street1: formData.address,
      city: formData.city,
      state: 'NY', // Asumiendo que es Nueva York
      zip: formData.zipCode,
      country: 'US',
      phone: formData.phone,
      email: formData.email,
      is_residential: true
    };

    return createOrderData(cart, fromAddress, toAddress);
  };

  // Abrir calculador de envíos automáticamente
  const handleOpenShipping = () => {
    setShippingError(null);
    
    // Crear dirección para validar (sin validar campos primero)
    const addressToValidate = {
      name: `${formData.firstName || ''} ${formData.lastName || ''}`,
      street1: formData.address || '',
      city: formData.city || '',
      state: 'NY', // Asumiendo que es Nueva York
      zip: formData.zipCode || '',
      country: 'US',
      phone: formData.phone || '',
      email: formData.email || '',
      is_residential: true
    };
    
    // Abrir corrección de dirección automáticamente
    setCorrectedAddress(addressToValidate);
    setAddressCorrectionOpen(true);
  };

  // Manejar selección de envío
  const handleShippingSelected = (shippingData) => {
    setShippingInfo(shippingData);
    console.log('Shipping selected:', shippingData);
    // Mostrar popup de confirmación
    setShippingConfirmationOpen(true);
  };

  // Manejar errores de envío
  // const handleShippingError = (error) => {
  //   console.error('Shipping error:', error);
  //   setShippingError(`Error de envío: ${error.detail || 'Error desconocido'}`);
  // };

  // Manejar dirección corregida
  const handleAddressCorrected = (correctedAddressData) => {
    console.log('Address corrected:', correctedAddressData);
    
    // Actualizar los datos del formulario con la dirección corregida
    if (correctedAddressData) {
      const nameParts = correctedAddressData.name.split(' ');
      setFormData(prev => ({
        ...prev,
        firstName: nameParts[0] || prev.firstName,
        lastName: nameParts.slice(1).join(' ') || prev.lastName,
        address: correctedAddressData.street1 || prev.address,
        city: correctedAddressData.city || prev.city,
        zipCode: correctedAddressData.zip || prev.zipCode,
        phone: correctedAddressData.phone || prev.phone,
        email: correctedAddressData.email || prev.email
      }));
    }
    
    // Cerrar corrección y abrir calculador de envíos
    setAddressCorrectionOpen(false);
    setShippingOpen(true);
  };

  // Manejar aceptación del envío
  const handleShippingAccept = () => {
    setShippingConfirmationOpen(false);
    console.log('Shipping accepted by user');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!shippingInfo) {
      setShippingError('Please complete the shipping process before proceeding with payment');
      return;
    }
    
    // Aquí iría la lógica de procesamiento del pago
    console.log('Processing payment with shipping info:', shippingInfo);
    clearCart();
    navigate('/mi-cuenta');
  };

  return (
    <Box sx={{ py: 2, pt: 0, backgroundColor: '#fafafa', minHeight: '100vh' }} className="form-mobile">
      <Container maxWidth="lg" className="container-mobile" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/carrito')}
              className="button-mobile"
              sx={{
                color: '#c8626d',
                mr: 2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              {t('checkout.backToCart', 'Back to Cart')}
            </Button>
          </Box>

          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: '#c8626d',
              mb: 1,
              fontSize: { xs: '1.5rem', md: '2rem' },
              fontFamily: 'Playfair Display, serif'
            }}
          >
            {t('checkout.title', 'Complete Purchase')}
          </Typography>
          
          <Typography
            variant="body1"
            sx={{
              color: '#666',
              mb: 2,
              fontSize: '0.9rem'
            }}
          >
            {t('checkout.subtitle', 'Complete your information to process the order')}
          </Typography>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Información de contacto - Izquierda */}
            <Grid size={12} sx={{ width: { xs: '100%', sm: '100%', md: '700px' }, flex: { xs: '1 1 auto', sm: '1 1 auto', md: '0 0 700px' } }}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Información de contacto */}
                <Card sx={{ mb: 2, borderRadius: '15px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: '#333',
                        mb: 2,
                        fontSize: '1.1rem'
                      }}
                    >
                      {t('checkout.contactInfo', 'Contact Information')}
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label={t('checkout.firstName', 'First Name')}
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          size="small"
                          className="form-input-mobile form-field-mobile"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px'
                            }
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label={t('checkout.lastName', 'Last Name')}
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px'
                            }
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label={t('checkout.email', 'Email')}
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px'
                            }
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label={t('checkout.phone', 'Phone')}
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px'
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Dirección de envío */}
                <Card sx={{ mb: 2, borderRadius: '15px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <LocalShipping sx={{ color: '#c8626d', mr: 1, fontSize: '1.2rem' }} />
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: '#333',
                          fontSize: '1.1rem'
                        }}
                      >
                        {t('checkout.shippingAddress', 'Shipping Address')}
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid size={12}>
                        <TextField
                          fullWidth
                          label={t('checkout.address', 'Address')}
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px'
                            }
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label={t('checkout.city', 'City')}
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px'
                            }
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label={t('checkout.zipCode', 'ZIP Code')}
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          required
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px'
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Información de pago y resumen - Derecha */}
            <Grid size={12} sx={{ width: { xs: '100%', sm: '100%', md: '400px' }, flex: { xs: '1 1 auto', sm: '1 1 auto', md: '0 0 400px' } }}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {/* Resumen del pedido */}
                <Card
                  sx={{
                    borderRadius: '15px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    mb: 2
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: '#333',
                        mb: 2,
                        fontSize: '1.1rem'
                      }}
                    >
                      {t('checkout.orderSummary', 'Order Summary')}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                          {t('checkout.subtotal', 'Subtotal')} ({cartItemsCount} {cartItemsCount === 1 ? t('checkout.item', 'item') : t('checkout.items', 'items')})
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          ${cartTotal.toFixed(2)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                          {t('checkout.shipping', 'Shipping')}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: shippingInfo ? '#C8626D' : '#666', fontSize: '0.9rem' }}>
                          {shippingInfo ? `$${parseFloat(shippingInfo.cost || 0).toFixed(2)}` : t('checkout.toBeDetermined', 'To be determined')}
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#333', fontSize: '1.1rem' }}>
                          {t('checkout.total', 'Total')}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#c8626d', fontSize: '1.1rem' }}>
                          ${(cartTotal + (shippingInfo ? parseFloat(shippingInfo.cost || 0) : 0)).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Información de envío */}
                    {shippingInfo && (
                      <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <Typography variant="body1" sx={{ mb: 0.5, color: '#c8626d', fontWeight: 600, fontSize: '0.9rem' }}>
                          ✓ Envío Configurado
                        </Typography>
                        
                        {/* Información de fecha de entrega */}
                        {(() => {
                          const deliveryInfo = calculateDeliveryDate();
                          
                          // Validar que las fechas sean válidas
                          if (isNaN(deliveryInfo.shippingDate.getTime()) || isNaN(deliveryInfo.deliveryDate.getTime())) {
                            return (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem' }}>
                                  📦 Calculating delivery date...
                                </Typography>
                              </Box>
                            );
                          }
                          
                          return (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem', mb: 0.5 }}>
                                📦 Your order will be shipped on {deliveryInfo.shippingDate.toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  day: 'numeric', 
                                  month: 'long' 
                                })}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem', mb: 0.5 }}>
                                🚚 Estimated transit: {deliveryInfo.transitDays} days
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#c8626d', fontWeight: 600, fontSize: '0.85rem' }}>
                                📅 Estimated delivery: {deliveryInfo.deliveryDate.toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  day: 'numeric', 
                                  month: 'long' 
                                })}
                              </Typography>
                            </Box>
                          );
                        })()}
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                          Tracking: {shippingInfo.trackingNumber}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                          Carrier: {shippingInfo.carrier} - {shippingInfo.serviceLevel}
                        </Typography>
                        {shippingInfo.eta && (
                          <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                            ETA: {shippingInfo.eta}
                          </Typography>
                        )}
                      </Box>
                    )}

                    {/* El envío se calcula automáticamente al completar la dirección */}

                    {/* Error de envío */}
                    {shippingError && (
                      <Alert severity="error" sx={{ mb: 1.5, fontSize: '0.8rem' }}>
                        {shippingError}
                      </Alert>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <Security sx={{ color: '#C8626D', mr: 1, fontSize: '1rem' }} />
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                        Secure payment with SSL encryption
                      </Typography>
                    </Box>


                  </CardContent>
                </Card>

                {/* Información de pago */}
                <Card sx={{ mb: 2, borderRadius: '15px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CreditCard sx={{ color: '#c8626d', mr: 1, fontSize: '1.2rem' }} />
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: '#333',
                          fontSize: '1.1rem'
                        }}
                      >
                        {t('checkout.paymentInfo', 'Payment Information')}
                      </Typography>
                    </Box>
                    
                    {/* Método de pago con PayPal - Solo mostrar si hay datos completos */}
                    {formData.email && formData.firstName && formData.lastName && formData.address && formData.city && formData.zipCode ? (
                      <PayPalPaymentForm 
                        key={`paypal-${formData.email}-${cartTotal}`}
                        cartItems={cart}
                        onPaymentSuccess={(paymentDetails) => {
                          console.log('✅ PayPal payment successful, clearing cart and navigating');
                          clearCart();
                          
                          // Guardar información de envío en localStorage
                          if (shippingInfo) {
                            localStorage.setItem('lastShippingInfo', JSON.stringify(shippingInfo));
                            console.log('📦 Shipping info saved:', shippingInfo);
                          }
                          
                          // Pasar el payment ID en la URL
                          navigate(`/checkout/success?payment_id=${paymentDetails.paymentId}`);
                        }}
                        onPaymentError={(error) => {
                          console.log('❌ PayPal payment error:', error);
                          setPaymentError(error.message || 'Payment failed');
                        }}
                        shippingAddress={{
                          street: formData.address,
                          city: formData.city,
                          state: 'NY',
                          zipCode: formData.zipCode,
                          country: 'US'
                        }}
                      />
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="body1" sx={{ color: '#666', mb: 2 }}>
                          Complete contact information to continue with payment
                        </Typography>
                        <Box sx={{ textAlign: 'left', maxWidth: '300px', mx: 'auto' }}>
                          <Typography variant="body2" sx={{ color: '#999', fontSize: '0.9rem', mb: 1 }}>
                            Required fields:
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: formData.email ? '#C8626D' : '#EB8B8B' }} />
                              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: formData.email ? '#C8626D' : '#666' }}>
                                Email {formData.email ? '✓' : ''}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: formData.firstName ? '#C8626D' : '#EB8B8B' }} />
                              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: formData.firstName ? '#C8626D' : '#666' }}>
                                First Name {formData.firstName ? '✓' : ''}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: formData.lastName ? '#C8626D' : '#EB8B8B' }} />
                              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: formData.lastName ? '#C8626D' : '#666' }}>
                                Last Name {formData.lastName ? '✓' : ''}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: formData.address ? '#C8626D' : '#EB8B8B' }} />
                              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: formData.address ? '#C8626D' : '#666' }}>
                                Address {formData.address ? '✓' : ''}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: formData.city ? '#C8626D' : '#EB8B8B' }} />
                              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: formData.city ? '#C8626D' : '#666' }}>
                                City {formData.city ? '✓' : ''}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: formData.zipCode ? '#C8626D' : '#EB8B8B' }} />
                              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: formData.zipCode ? '#C8626D' : '#666' }}>
                                ZIP Code {formData.zipCode ? '✓' : ''}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    )}
                    
                    {paymentError && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {paymentError}
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </form>

        {/* Address Correction */}
        <AddressCorrection
          open={addressCorrectionOpen}
          onClose={() => setAddressCorrectionOpen(false)}
          originalAddress={correctedAddress}
          onAddressCorrected={handleAddressCorrected}
        />

        {/* Shipping Calculator */}
        <ShippingCalculator
          open={shippingOpen}
          onClose={() => setShippingOpen(false)}
          orderData={createShippingData()}
          onShippingSelected={handleShippingSelected}
        />

        {/* Shipping Confirmation Popup */}
        <ShippingConfirmationPopup
          open={shippingConfirmationOpen}
          onClose={() => setShippingConfirmationOpen(false)}
          onAccept={handleShippingAccept}
          shippingInfo={shippingInfo}
          cartItems={cart}
          total={cartTotal}
          customerInfo={{
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            address: {
              line1: formData.address,
              city: formData.city,
              postal_code: formData.zipCode,
              state: 'NY',
              country: 'US'
            },
            phone: formData.phone
          }}
          onPaymentSuccess={(paymentIntent) => {
            console.log('✅ Payment successful, clearing cart and navigating');
            clearCart();
            
            // Guardar información de envío en localStorage
            if (shippingInfo) {
              localStorage.setItem('lastShippingInfo', JSON.stringify(shippingInfo));
              console.log('📦 Shipping info saved:', shippingInfo);
            }
            
            // Pasar el payment intent ID en la URL
            navigate(`/checkout/success?payment_intent=${paymentIntent.id}`);
          }}
          onPaymentError={(error) => {
            console.log('❌ Payment error:', error);
            setPaymentError(error.message);
          }}
        />
      </Container>
    </Box>
  );
};

export default Checkout;

