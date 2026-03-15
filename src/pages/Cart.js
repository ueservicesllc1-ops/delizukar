
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, Container, Typography, Grid, Card, CardContent, CardActions, Button, IconButton, TextField, Divider, Checkbox, FormControlLabel, Alert, Chip } from '@mui/material';
import { Add, Remove, Delete, ShoppingCart, ArrowBack, AccountBalanceWallet, ShoppingBag, LocalOffer, CheckCircle } from '@mui/icons-material';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import AfterpayMessaging from '../components/AfterpayMessaging';
import { useMinProducts } from '../hooks/useMinProducts';
import { useLanguage } from '../context/LanguageContext';
 
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

const CART_TRANSLATIONS = {
  en: {
    'cart.continueShopping': 'Continue Shopping',
    'cart.empty': 'Your cart is empty',
    'cart.emptyDescription': 'Add some delicious cookies to get started!',
    'cart.orderSummary': 'Order Summary',
    'cart.subtotal': 'Subtotal',
    'cart.item': 'item',
    'cart.items': 'items',
    'cart.shipping': 'Shipping',
    'cart.toBeDetermined': 'To be determined',
    'cart.total': 'Total',
    'cart.accept': 'I accept the',
    'cart.shippingPolicy': 'Shipping Policy',
    'cart.checkout': 'Proceed to Payment',
    'cart.minimumProducts': 'Minimum {count} product{plural} required',
    'cart.acceptShipping': 'You must accept the Shipping Policy',
    'cart.cannotProceed': 'Cannot proceed',
    'voucher.discountCode': 'Discount Code',
    'voucher.enterDiscountCode': 'Enter your discount code',
    'voucher.apply': 'Apply coupon',
    'voucher.applying': 'Applying...',
    'voucher.loginToUse': 'Log in to use discount codes',
    'voucher.mustBeLoggedIn': 'You must be logged in to use a coupon.',
    'voucher.enterCode': 'Please enter a discount code.',
    'voucher.invalidCode': 'Invalid discount code.',
    'voucher.notActive': 'This coupon is not active.',
    'voucher.alreadyUsed': 'You have already used this coupon.',
    'voucher.applied': 'Coupon applied: {percentage}% off',
    'voucher.discount': 'Discount',
    'voucher.discountLabel': '{code}: {percentage}% off'
  },
  es: {
    'cart.continueShopping': 'Seguir comprando',
    'cart.empty': 'Tu carrito está vacío',
    'cart.emptyDescription': '¡Agrega algunas galletas deliciosas para comenzar!',
    'cart.orderSummary': 'Resumen del pedido',
    'cart.subtotal': 'Subtotal',
    'cart.item': 'artículo',
    'cart.items': 'artículos',
    'cart.shipping': 'Envío',
    'cart.toBeDetermined': 'Por determinar',
    'cart.total': 'Total',
    'cart.accept': 'Acepto la',
    'cart.shippingPolicy': 'Política de envío',
    'cart.checkout': 'Proceder al pago',
    'cart.minimumProducts': 'Se requiere un mínimo de {count} producto{plural}',
    'cart.acceptShipping': 'Debes aceptar la Política de envío',
    'cart.cannotProceed': 'No se puede continuar',
    'voucher.discountCode': 'Código de descuento',
    'voucher.enterDiscountCode': 'Introduce tu código de descuento',
    'voucher.apply': 'Aplicar cupón',
    'voucher.applying': 'Aplicando...',
    'voucher.loginToUse': 'Inicia sesión para usar códigos de descuento',
    'voucher.mustBeLoggedIn': 'Debes iniciar sesión para usar un cupón.',
    'voucher.enterCode': 'Introduce un código de descuento.',
    'voucher.invalidCode': 'Código de descuento inválido.',
    'voucher.notActive': 'Este cupón no está activo.',
    'voucher.alreadyUsed': 'Ya has usado este cupón.',
    'voucher.applied': 'Cupón aplicado: {percentage}% de descuento',
    'voucher.discount': 'Descuento',
    'voucher.discountLabel': '{code}: {percentage}% de descuento'
  }
};

const Cart = () => {
  const { language } = useLanguage();
  const t = (key, fallbackOrVars, maybeVars) => {
    let fallback = undefined;
    let vars = {};

    if (typeof fallbackOrVars === 'object' && fallbackOrVars !== null && !Array.isArray(fallbackOrVars)) {
      vars = fallbackOrVars;
    } else {
      fallback = fallbackOrVars;
      if (typeof maybeVars === 'object' && maybeVars !== null) {
        vars = maybeVars;
      }
    }

    const template =
      CART_TRANSLATIONS[language]?.[key] ??
      CART_TRANSLATIONS.es[key] ??
      fallback ??
      (typeof key === 'string' ? key : '');

    if (typeof template !== 'string') {
      return template;
    }

    return Object.keys(vars).reduce(
      (acc, currentKey) => acc.replace(new RegExp(`\\{${currentKey}\\}`, 'g'), vars[currentKey]),
      template
    );
  };
  const { cart, updateCartQuantity, removeFromCart, getCartTotal, getCartItemsCount } = useStore();

  // Función para mapear categorías
  const getCategoryDisplayName = (category) => {
    const categoryMap = {
      'Clásicas NY': 'NY Style Cookies',
      'clasicas': 'NY Style Cookies',
      'Clásicas': 'NY Style Cookies'
    };
    return categoryMap[category] || category;
  };
  const navigate = useNavigate();
  const { minProducts } = useMinProducts();

  const cartTotal = getCartTotal();
  const cartItemsCount = getCartItemsCount();

  // Estado para el checkbox de política de envío
  const [acceptShippingPolicy, setAcceptShippingPolicy] = useState(false);

  // Estados para vouchers
  const [user, setUser] = useState(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');
  const [voucherSuccess, setVoucherSuccess] = useState('');
  const [loadingVoucher, setLoadingVoucher] = useState(false);

  // Usar solo el carrito real del contexto
  const items = cart;

  // Detectar usuario logueado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Funciones para manejar cambios de cantidad
  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    updateCartQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
  };

  // Calcular totales del carrito
  const calculateSubtotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    if (appliedVoucher) {
      const discount = subtotal * (appliedVoucher.discountPercentage / 100);
      return subtotal - discount;
    }
    return subtotal; // Envío gratis
  };

  // Funciones para manejar vouchers
  const handleApplyVoucher = async () => {
    if (!user) {
      setVoucherError(t('voucher.mustBeLoggedIn'));
      return;
    }

    if (!voucherCode.trim()) {
      setVoucherError(t('voucher.enterCode'));
      return;
    }

    setLoadingVoucher(true);
    setVoucherError('');
    setVoucherSuccess('');

    try {
      // Buscar el voucher en Firestore
      const vouchersRef = collection(db, 'vouchers');
      const q = query(vouchersRef, where('code', '==', voucherCode.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error(t('voucher.invalidCode'));
      }

      const voucherDoc = querySnapshot.docs[0];
      const voucherData = { id: voucherDoc.id, ...voucherDoc.data() };

      // Verificar si el voucher está activo
      if (!voucherData.isActive) {
        throw new Error(t('voucher.notActive'));
      }

      // Verificar si el usuario ya usó este voucher en la colección voucherUsages
      const voucherUsagesRef = collection(db, 'voucherUsages');
      const usageQuery = query(
        voucherUsagesRef, 
        where('voucherCode', '==', voucherData.code),
        where('userId', '==', user.uid)
      );
      const usageSnapshot = await getDocs(usageQuery);

      if (!usageSnapshot.empty) {
        throw new Error(t('voucher.alreadyUsed'));
      }

      // Aplicar el voucher
      setAppliedVoucher(voucherData);
      setVoucherSuccess(t('voucher.applied', { percentage: voucherData.discountPercentage }));
      setVoucherCode('');

      // Guardar voucher en localStorage para el checkout
      localStorage.setItem('appliedVoucher', JSON.stringify(voucherData));

    } catch (error) {
      console.error('Error aplicando voucher:', error);
      setVoucherError(error.message);
    } finally {
      setLoadingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherError('');
    setVoucherSuccess('');
    
    // Remover voucher del localStorage
    localStorage.removeItem('appliedVoucher');
  };

  const getDiscountAmount = () => {
    if (!appliedVoucher) return 0;
    const subtotal = calculateSubtotal();
    return subtotal * (appliedVoucher.discountPercentage / 100);
  };

  // Verificar si se puede proceder al checkout
  const canProceedToCheckout = () => {
    const hasCombo = items.some(item => item.category === 'boxes');
    const meetsMinItems = hasCombo || calculateTotalItems() >= minProducts;
    return meetsMinItems && acceptShippingPolicy;
  };

  return (
    <Box className="cart-page-mobile" sx={{ py: 4, pt: { xs: 8, md: 12 }, backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/')}
              sx={{
                color: '#c8626d',
                mr: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              {t('cart.continueShopping')}
            </Button>
          </Box>

        </motion.div>

        {items.length === 0 ? (
          /* Carrito vacío */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card
              sx={{
                textAlign: 'center',
                p: 8,
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}
            >
              <ShoppingBag sx={{ fontSize: '4rem', color: '#ccc', mb: 3 }} />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  color: '#333',
                  mb: 2
                }}
              >
                {t('cart.empty')}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#666',
                  mb: 4
                }}
              >
                {t('cart.emptyDescription')}
              </Typography>
            </Card>
          </motion.div>
        ) : (
          <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Lista de productos */}
            <Box sx={{ flex: 2 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card
                      sx={{
                        mb: 3,
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                        }
                      }}
                    >
                      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: { xs: 'column', sm: 'row' }, 
                          alignItems: { xs: 'center', sm: 'center' }, 
                          gap: { xs: 2, sm: 3 }, 
                          width: '100%' 
                        }}>
                          {/* Imagen del producto */}
                          <Box sx={{ flex: '0 0 auto' }}>
                            <Box sx={{ position: 'relative' }}>
                              <Box
                                component="img"
                                src={item.image}
                                alt={item.name}
                                  sx={{
                                    width: { xs: 60, sm: 80 },
                                    height: { xs: 60, sm: 80 },
                                    objectFit: 'cover',
                                    borderRadius: '12px'
                                  }}
                              />
                              {item.isBestSeller && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: -4,
                                    left: -4,
                                    backgroundColor: '#FF6B35',
                                    color: 'white',
                                    px: 0.8,
                                    py: 0.2,
                                    borderRadius: '6px',
                                    fontSize: '0.55rem',
                                    fontWeight: 700,
                                    zIndex: 2,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  BEST SELLER
                                </Box>
                              )}
                            </Box>
                          </Box>

                          {/* Información del producto */}
                          <Box sx={{ flex: 1, minWidth: 0, textAlign: { xs: 'center', sm: 'left' }, width: { xs: '100%', sm: 'auto' } }}>
                            <Typography
                              variant="h6"
                                sx={{
                                  fontWeight: 600,
                                  color: '#333',
                                  mb: 0.2,
                                  fontFamily: '"Asap", sans-serif',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  fontSize: { xs: '0.85rem', sm: '0.9rem' }
                                }}
                            >
                              {item.name}
                            </Typography>
                            <Typography
                              variant="body2"
                                sx={{
                                  color: '#666',
                                  mb: 0.5,
                                  fontFamily: '"Asap", sans-serif',
                                  textTransform: 'uppercase',
                                  fontSize: { xs: '0.6rem', sm: '0.65rem' },
                                  letterSpacing: '0.3px'
                                }}
                            >
                              {getCategoryDisplayName(item.category)}
                            </Typography>
                            {item.description_extra && (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: '#c8626d',
                                  mb: 1,
                                  fontSize: '0.75rem',
                                  fontStyle: 'italic',
                                  fontWeight: 500
                                }}
                              >
                                {item.description_extra}
                              </Typography>
                            )}
                            {item.category === 'boxes' && item.discountPercentage > 0 && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#4caf50',
                                  display: 'block',
                                  mb: 1,
                                  fontWeight: 600
                                }}
                              >
                                Descuento de Box ({item.discountPercentage}%) aplicado
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 700,
                                  color: '#c8626d',
                                  fontSize: '0.9rem'
                                }}
                              >
                                ${item.price}
                              </Typography>
                              {item.originalPrice && (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: '#999',
                                    textDecoration: 'line-through'
                                  }}
                                >
                                  ${item.originalPrice}
                                </Typography>
                              )}
                            </Box>
                          </Box>

                          {/* Controles de cantidad y eliminar - Layout adaptativo */}
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: { xs: 'row', sm: 'column' }, 
                            alignItems: 'center', 
                            justifyContent: { xs: 'space-between', sm: 'center' },
                            gap: { xs: 1, sm: 1 }, 
                            width: { xs: '100%', sm: 'auto' },
                            ml: { xs: 0, sm: 'auto' },
                            mt: { xs: 1, sm: 0 },
                            pt: { xs: 1.5, sm: 0 },
                            borderTop: { xs: '1px solid rgba(0,0,0,0.05)', sm: 'none' }
                          }}>
                            {/* Controles de cantidad arriba */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <IconButton
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                sx={{
                                  backgroundColor: '#FFFFFF',
                                  color: '#c8626d',
                                  width: '32px',
                                  height: '32px',
                                  '&:hover': {
                                    backgroundColor: '#c8626d20'
                                  }
                                }}
                              >
                                <Remove sx={{ fontSize: '1rem' }} />
                              </IconButton>
                              
                              <TextField
                                value={item.quantity}
                                onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                                size="small"
                                sx={{
                                  width: '45px !important',
                                  maxWidth: '45px !important',
                                  minWidth: '45px !important',
                                  '& .MuiOutlinedInput-root': {
                                    width: '45px !important',
                                    textAlign: 'center',
                                    height: '32px',
                                    paddingLeft: '0 !important',
                                    paddingRight: '0 !important'
                                  },
                                  '& .MuiInputBase-input': {
                                    textAlign: 'center',
                                    padding: '6px 0 !important',
                                    fontSize: '0.85rem'
                                  }
                                }}
                              />
                              
                              <IconButton
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                sx={{
                                  backgroundColor: '#FFFFFF',
                                  color: '#c8626d',
                                  width: '32px',
                                  height: '32px',
                                  '&:hover': {
                                    backgroundColor: '#c8626d20'
                                  }
                                }}
                              >
                                <Add sx={{ fontSize: '1rem' }} />
                              </IconButton>
                            </Box>
                            
                            {/* Botón eliminar abajo */}
                            <IconButton
                              onClick={() => handleRemoveItem(item.id)}
                              sx={{
                                color: '#7C2815',
                                width: '32px',
                                height: '32px',
                                '&:hover': {
                                  backgroundColor: '#ffebee'
                                }
                              }}
                            >
                              <Delete sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </Box>

            {/* Resumen del pedido */}
            <Box sx={{ flex: 1, minWidth: '300px' }}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card
                  sx={{
                    borderRadius: '15px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    position: 'sticky',
                    top: 20
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: '#333',
                        mb: 2,
                        fontSize: '1.1rem',
                        fontFamily: '"Asap", sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {t('cart.orderSummary')}
                    </Typography>

                    {/* Sección de Vouchers */}
                    {user ? (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocalOffer sx={{ color: '#c8626d' }} />
                          {t('voucher.discountCode')}
                        </Typography>
                        
                        {appliedVoucher ? (
                          <Box sx={{ mb: 2 }}>
                            <Alert severity="success" sx={{ mb: 1 }}>
                              {voucherSuccess}
                            </Alert>
                            <Chip
                              label={t('voucher.discountLabel', { code: appliedVoucher.code, percentage: appliedVoucher.discountPercentage })}
                              onDelete={handleRemoveVoucher}
                              color="success"
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <TextField
                              fullWidth
                              placeholder={t('voucher.enterDiscountCode')}
                              value={voucherCode}
                              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                              size="small"
                              sx={{ flex: 1 }}
                            />
                            <Button
                              variant="contained"
                              onClick={handleApplyVoucher}
                              disabled={loadingVoucher || !voucherCode.trim()}
                              sx={{
                                backgroundColor: '#c8626d',
                                color: 'white',
                                px: 3,
                                '&:hover': {
                                  backgroundColor: '#b5555a'
                                }
                              }}
                            >
                              {loadingVoucher ? t('voucher.applying') : t('voucher.apply')}
                            </Button>
                          </Box>
                        )}
                        
                        {voucherError && (
                          <Alert severity="error" sx={{ mb: 2 }}>
                            {voucherError}
                          </Alert>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ mb: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <Typography variant="body2" sx={{ color: '#666', textAlign: 'center' }}>
                          <LocalOffer sx={{ fontSize: '1rem', mr: 1, verticalAlign: 'middle' }} />
                          {t('voucher.loginToUse')}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                          {t('cart.subtotal')} ({calculateTotalItems()} {calculateTotalItems() === 1 ? t('cart.item') : t('cart.items')})
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          ${calculateSubtotal().toFixed(2)}
                        </Typography>
                      </Box>
                      
                      {appliedVoucher && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: '#4caf50', fontSize: '0.9rem' }}>
                            {t('voucher.discount')} ({appliedVoucher.code})
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50', fontSize: '0.9rem' }}>
                            -${getDiscountAmount().toFixed(2)}
                          </Typography>
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                          {t('cart.shipping')}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#666', fontSize: '0.9rem' }}>
                          {t('cart.toBeDetermined')}
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#333', fontSize: '1.1rem' }}>
                          {t('cart.total')}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#c8626d', fontSize: '1.1rem' }}>
                          ${calculateTotal().toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Afterpay Messaging */}
                    {calculateTotal() >= 1 && calculateTotal() <= 4000 && (
                      <AfterpayMessaging amount={calculateTotal()} />
                    )}

                    {/* Checkbox para aceptar política de envío */}
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={acceptShippingPolicy}
                          onChange={(e) => setAcceptShippingPolicy(e.target.checked)}
                          size="small"
                          sx={{
                            color: '#c8626d',
                            '&.Mui-checked': {
                              color: '#c8626d'
                            }
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                          {t('cart.accept')}{' '}
                          <Button
                            variant="text"
                            sx={{
                              color: '#c8626d',
                              textTransform: 'none',
                              p: 0,
                              minWidth: 'auto',
                              textDecoration: 'underline',
                              fontSize: '0.8rem',
                              '&:hover': {
                                backgroundColor: 'transparent',
                                textDecoration: 'underline'
                              }
                            }}
                            onClick={() => navigate('/shipping')}
                          >
                            {t('cart.shippingPolicy')}
                          </Button>
                        </Typography>
                      }
                      sx={{ mb: 1.5, alignItems: 'flex-start' }}
                    />

                    <Button
                      variant="contained"
                      fullWidth
                      size="medium"
                      onClick={() => navigate('/checkout')}
                      disabled={!canProceedToCheckout()}
                      sx={{
                        backgroundColor: canProceedToCheckout() ? '#c8626D' : '#ccc',
                        color: 'white',
                        py: 1.5,
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        borderRadius: '15px',
                        textTransform: 'none',
                        mb: 1.5,
                        '&:hover': canProceedToCheckout() ? {
                          backgroundColor: '#b5555a',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(139, 69, 19, 0.3)'
                        } : {},
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {canProceedToCheckout()
                        ? t('cart.checkout')
                        : (calculateTotalItems() < minProducts && !items.some(item => item.category === 'boxes'))
                        ? t('cart.minimumProducts', {
                            count: minProducts,
                            plural: minProducts > 1 ? 's' : ''
                          })
                        : !acceptShippingPolicy
                        ? t('cart.acceptShipping')
                        : t('cart.cannotProceed')}
                    </Button>

                    <Button
                      variant="outlined"
                      fullWidth
                      size="small"
                      onClick={() => navigate('/productos')}
                      sx={{
                        borderColor: '#c8626d',
                        color: '#c8626d',
                        py: 1,
                        borderRadius: '15px',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        '&:hover': {
                          backgroundColor: '#c8626d20',
                          borderColor: '#c8626d'
                        }
                      }}
                    >
                      {t('cart.continueShopping')}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Cart;
