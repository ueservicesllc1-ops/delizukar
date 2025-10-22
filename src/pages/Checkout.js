import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Container, Typography, Grid, Card, CardContent, TextField, Button, FormControlLabel, Checkbox, Divider, Alert } from '@mui/material';
import { CreditCard, LocalShipping, Security, ArrowBack } from '@mui/icons-material';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import ShippingCalculator from '../components/ShippingCalculator';
import AddressCorrection from '../components/AddressCorrection';
import StripeCheckout from '../components/StripeCheckout';
import { useShipping } from '../hooks/useShipping';

const Checkout = () => {
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
  
  // Estados para Stripe
  const [stripeError, setStripeError] = useState(null);

  const cartTotal = getCartTotal();
  const cartItemsCount = getCartItemsCount();

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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!shippingInfo) {
      setShippingError('Por favor completa el proceso de envío antes de proceder con el pago');
      return;
    }
    
    // Aquí iría la lógica de procesamiento del pago
    console.log('Processing payment with shipping info:', shippingInfo);
    clearCart();
    navigate('/mi-cuenta');
  };

  return (
    <Box sx={{ py: 2, pt: 4, backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <Container maxWidth="lg">
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
              sx={{
                color: '#8B4513',
                mr: 2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              Volver al Carrito
            </Button>
          </Box>

          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: '#8B4513',
              mb: 1,
              fontSize: { xs: '1.5rem', md: '2rem' },
              fontFamily: 'Playfair Display, serif'
            }}
          >
            Finalizar Compra
          </Typography>
          
          <Typography
            variant="body1"
            sx={{
              color: '#666',
              mb: 2,
              fontSize: '0.9rem'
            }}
          >
            Completa tu información para procesar el pedido
          </Typography>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Información de contacto - Izquierda */}
            <Grid item xs={12} sx={{ width: '700px', flex: '0 0 700px' }}>
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
                      Información de Contacto
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Nombre"
                          name="firstName"
                          value={formData.firstName}
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
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Apellido"
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
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Correo electrónico"
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
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Teléfono"
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
                      <LocalShipping sx={{ color: '#8B4513', mr: 1, fontSize: '1.2rem' }} />
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: '#333',
                          fontSize: '1.1rem'
                        }}
                      >
                        Dirección de Envío
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Dirección"
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
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Ciudad"
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
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Código Postal"
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
            <Grid item xs={12} sx={{ width: '400px', flex: '0 0 400px' }}>
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
                      Resumen del Pedido
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                          Subtotal ({cartItemsCount} {cartItemsCount === 1 ? 'artículo' : 'artículos'})
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          ${cartTotal.toFixed(2)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                          Envío
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: shippingInfo ? '#4CAF50' : '#666', fontSize: '0.9rem' }}>
                          {shippingInfo ? `$${parseFloat(shippingInfo.cost || 0).toFixed(2)}` : 'Por definir'}
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#333', fontSize: '1.1rem' }}>
                          Total
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#8B4513', fontSize: '1.1rem' }}>
                          ${(cartTotal + (shippingInfo ? parseFloat(shippingInfo.cost || 0) : 0)).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Información de envío */}
                    {shippingInfo && (
                      <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <Typography variant="body1" sx={{ mb: 0.5, color: '#8B4513', fontWeight: 600, fontSize: '0.9rem' }}>
                          ✓ Envío Configurado
                        </Typography>
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
                      <Security sx={{ color: '#4CAF50', mr: 1, fontSize: '1rem' }} />
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                        Pago seguro con encriptación SSL
                      </Typography>
                    </Box>


                  </CardContent>
                </Card>

                {/* Información de pago */}
                <Card sx={{ mb: 2, borderRadius: '15px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CreditCard sx={{ color: '#8B4513', mr: 1, fontSize: '1.2rem' }} />
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: '#333',
                          fontSize: '1.1rem'
                        }}
                      >
                        Información de Pago
                      </Typography>
                    </Box>
                    
                    {/* Método de pago con Stripe */}
                    <StripeCheckout 
                      cartItems={cart}
                      total={cartTotal + (shippingInfo ? parseFloat(shippingInfo.cost || 0) : 0)}
                      customerInfo={{
                        email: formData.email,
                        name: `${formData.firstName} ${formData.lastName}`,
                        address: {
                          line1: formData.address,
                          city: formData.city,
                          postal_code: formData.zipCode,
                          state: 'NY',
                          country: 'US'
                        },
                        phone: formData.phone
                      }}
                      onSuccess={() => {
                        clearCart();
                        navigate('/checkout/success');
                      }}
                      onError={(error) => {
                        setStripeError(error.message);
                      }}
                    />
                    
                    {stripeError && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {stripeError}
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
      </Container>
    </Box>
  );
};

export default Checkout;

