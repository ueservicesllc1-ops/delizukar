import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Divider,
  Alert,
  Select,
  MenuItem
} from '@mui/material';
import { CreditCard, LocalShipping, Security, ArrowBack, LocalOffer } from '@mui/icons-material';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import ShippingCalculator from '../components/ShippingCalculator';
import AddressCorrection from '../components/AddressCorrection';
import PayPalPaymentForm from '../components/PayPalPaymentForm';
import ShippingConfirmationPopup from '../components/ShippingConfirmationPopup';
import { useShipping } from '../hooks/useShipping';
 
import { db, auth } from '../firebase/config';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import emailjs from '@emailjs/browser';
import { useLanguage } from '../context/LanguageContext';

const CARD_LOGOS = [
  { alt: 'Visa', src: '/assets/payments/visa.svg' },
  { alt: 'Mastercard', src: '/assets/payments/mastercard.svg' },
  { alt: 'American Express', src: '/assets/payments/amex.svg' },
  { alt: 'Discover', src: '/assets/payments/discover.svg' },
  { alt: 'JCB', src: '/assets/payments/jcb.svg' },
  { alt: 'Diners Club', src: '/assets/payments/dinersclub.svg' }
];

const CHECKOUT_TRANSLATIONS = {
  es: {
    'checkout.backToCart': 'Volver al carrito',
    'checkout.title': 'Completa tu compra',
    'checkout.subtitle': 'Completa tus datos para procesar el pedido',
    'checkout.contactInfo': 'Información de contacto',
    'checkout.firstName': 'Nombre',
    'checkout.lastName': 'Apellido',
    'checkout.email': 'Correo electrónico',
    'checkout.phone': 'Teléfono',
    'checkout.shippingAddress': 'Dirección de envío',
    'checkout.address': 'Dirección',
    'checkout.city': 'Ciudad',
    'checkout.zipCode': 'Código postal',
    'checkout.state': 'Estado / Provincia',
    'checkout.orderSummary': 'Resumen del pedido',
    'checkout.subtotal': 'Subtotal',
    'checkout.item': 'artículo',
    'checkout.items': 'artículos',
    'checkout.shipping': 'Envío',
    'checkout.toBeDetermined': 'Por determinar',
    'checkout.total': 'Total',
    'checkout.paymentInfo': 'Información de pago',
    'checkout.languageLabel': 'Idioma',
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
    'voucher.applied': '¡Cupón aplicado! {percentage}% de descuento',
    'voucher.appliedLabel': '{code} - {percentage}% DTO',
    'voucher.discount': 'Descuento'
  },
  en: {
    'checkout.backToCart': 'Back to cart',
    'checkout.title': 'Complete purchase',
    'checkout.subtitle': 'Fill in your information to process the order',
    'checkout.contactInfo': 'Contact information',
    'checkout.firstName': 'First name',
    'checkout.lastName': 'Last name',
    'checkout.email': 'Email',
    'checkout.phone': 'Phone',
    'checkout.shippingAddress': 'Shipping address',
    'checkout.address': 'Address',
    'checkout.city': 'City',
    'checkout.zipCode': 'ZIP / Postal code',
    'checkout.state': 'State / Province',
    'checkout.orderSummary': 'Order summary',
    'checkout.subtotal': 'Subtotal',
    'checkout.item': 'item',
    'checkout.items': 'items',
    'checkout.shipping': 'Shipping',
    'checkout.toBeDetermined': 'To be determined',
    'checkout.total': 'Total',
    'checkout.paymentInfo': 'Payment information',
    'checkout.languageLabel': 'Language',
    'voucher.discountCode': 'Discount code',
    'voucher.enterDiscountCode': 'Enter your discount code',
    'voucher.apply': 'Apply coupon',
    'voucher.applying': 'Applying...',
    'voucher.loginToUse': 'Log in to use discount codes',
    'voucher.mustBeLoggedIn': 'You must be logged in to use a voucher.',
    'voucher.enterCode': 'Please enter a voucher code.',
    'voucher.invalidCode': 'Invalid voucher code.',
    'voucher.notActive': 'This voucher is not active.',
    'voucher.alreadyUsed': 'You have already used this voucher.',
    'voucher.applied': 'Coupon applied! {percentage}% discount',
    'voucher.appliedLabel': '{code} - {percentage}% OFF',
    'voucher.discount': 'Discount'
  }
};

const Checkout = () => {
  const { language, setLanguage } = useLanguage();
  const t = (key, fallbackOrVars, maybeVars) => {
    let fallback = undefined;
    let vars = {};

    if (
      typeof fallbackOrVars === 'object' &&
      fallbackOrVars !== null &&
      !Array.isArray(fallbackOrVars)
    ) {
      vars = fallbackOrVars;
    } else {
      fallback = fallbackOrVars;
      if (typeof maybeVars === 'object' && maybeVars !== null) {
        vars = maybeVars;
      }
    }

    const dictionary = CHECKOUT_TRANSLATIONS[language] || CHECKOUT_TRANSLATIONS.es;
    let template =
      dictionary[key] ??
      CHECKOUT_TRANSLATIONS.es[key] ??
      fallback ??
      (typeof key === 'string' ? key : '');

    if (typeof template === 'string') {
      Object.entries(vars || {}).forEach(([token, value]) => {
        template = template.replace(new RegExp(`\\{${token}\\}`, 'g'), value);
      });
    }

    return template;
  };
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
    state: '', // El usuario debe ingresar el estado
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
  const autoValidationSignatureRef = useRef('');

  // Estados para vouchers
  const [user, setUser] = useState(null);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherError, setVoucherError] = useState('');
  const [voucherSuccess, setVoucherSuccess] = useState('');
  const [loadingVoucher, setLoadingVoucher] = useState(false);

  const cartTotal = getCartTotal();
  const cartItemsCount = getCartItemsCount();

  // Calcular totales con descuento
  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    if (appliedVoucher) {
      const discount = subtotal * (appliedVoucher.discountPercentage / 100);
      return subtotal - discount;
    }
    return subtotal;
  };

  const getDiscountAmount = () => {
    if (!appliedVoucher) return 0;
    const subtotal = calculateSubtotal();
    return subtotal * (appliedVoucher.discountPercentage / 100);
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

      // Guardar voucher en localStorage para persistencia
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
    setVoucherCode('');
    
    // Remover voucher del localStorage
    localStorage.removeItem('appliedVoucher');
  };

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
    if (shippingInfo?.minTransitDays !== undefined && shippingInfo?.maxTransitDays !== undefined) {
      const minCandidate = Number(shippingInfo.minTransitDays);
      const maxCandidate = Number(shippingInfo.maxTransitDays);
      if (!Number.isNaN(minCandidate) && minCandidate > 0) {
        minTransitDays = minCandidate;
      }
      if (!Number.isNaN(maxCandidate) && maxCandidate > 0) {
        maxTransitDays = maxCandidate;
      }
    }
 
    if (shippingInfo?.transitDays) {
      const transitDaysValue = shippingInfo.transitDays;
      const transitDaysStr = String(transitDaysValue);
      const parsedNumber = parseInt(transitDaysStr);
      
      console.log('🔍 [Checkout] transitDays recibido:', transitDaysValue, 'tipo:', typeof transitDaysValue);
      
      // Verificar si está en formato correcto "2-3" o "1"
      // Si es "23" (sin guión), es un error - debería ser "2-3"
      const hasHyphen = transitDaysStr.includes('-');
      const hasValidFormat = hasHyphen || (parsedNumber <= 10 && parsedNumber > 0 && parsedNumber < 10);
      
      // Si NO tiene guión Y es un número de 2 dígitos (ej: 23, 12, etc), es un error
      // Debería ser "2-3" no "23"
      const isTwoDigitNumber = !hasHyphen && parsedNumber >= 10 && parsedNumber <= 99;
      
      console.log('🔍 [Checkout] Análisis de transitDays:');
      console.log('   Valor:', transitDaysValue);
      console.log('   String:', transitDaysStr);
      console.log('   Tiene guión:', hasHyphen);
      console.log('   Número parseado:', parsedNumber);
      console.log('   Es número de 2 dígitos sin guión:', isTwoDigitNumber);
      
      // Si NO tiene formato válido, es un número mayor a 10, o es un número de 2 dígitos sin guión, calcular el rango
      if (!hasValidFormat || parsedNumber > 10 || typeof transitDaysValue === 'number' || isTwoDigitNumber) {
        console.log('🔍 [Checkout] transitDays es un número inválido (' + transitDaysValue + '), calculando rango basado en carrier/service');
        // Es un número, calcular el rango basado en el carrier y service
        const carrier = (shippingInfo.carrier || shippingInfo.rate?.carrier || shippingInfo.rate?.provider || '').toLowerCase();
        const serviceLevel = (shippingInfo.serviceLevel || shippingInfo.service || shippingInfo.rate?.service || shippingInfo.rate?.servicelevel?.name || '').toLowerCase();
        
        if (carrier === 'usps') {
          if (serviceLevel.includes('ground') || serviceLevel.includes('advantage')) {
            minTransitDays = 2; maxTransitDays = 3;
          } else if (serviceLevel.includes('priority')) {
            minTransitDays = 1; maxTransitDays = 2;
          } else if (serviceLevel.includes('express')) {
            minTransitDays = 1; maxTransitDays = 1;
          }
        } else if (carrier === 'ups') {
          if (serviceLevel.includes('ground')) {
            minTransitDays = 1; maxTransitDays = 5;
          } else if (serviceLevel.includes('standard')) {
            minTransitDays = 1; maxTransitDays = 3;
          }
        } else if (carrier === 'fedex' || carrier === 'fedexdefault') {
          if (serviceLevel.includes('smart') || serviceLevel.includes('post')) {
            minTransitDays = 2; maxTransitDays = 3;
          } else if (serviceLevel.includes('ground')) {
            minTransitDays = 1; maxTransitDays = 5;
          } else if (serviceLevel.includes('standard')) {
            minTransitDays = 1; maxTransitDays = 3;
          }
        }
        
        console.log('🔍 [Checkout] Rango calculado:', minTransitDays, '-', maxTransitDays);
      } else {
        console.log('🔍 [Checkout] transitDays tiene formato válido, parseando:', transitDaysStr);
        // Es un string en formato "2-3" o "1"
        const transitRange = transitDaysStr.split('-');
        if (transitRange.length === 2) {
          minTransitDays = parseInt(transitRange[0]);
          maxTransitDays = parseInt(transitRange[1]);
        } else if (transitRange.length === 1) {
          minTransitDays = parseInt(transitRange[0]);
          maxTransitDays = parseInt(transitRange[0]);
        }
        console.log('🔍 [Checkout] Rango parseado:', minTransitDays, '-', maxTransitDays);
      }
    } else {
      console.log('🔍 [Checkout] No hay transitDays en shippingInfo, usando valores por defecto (2-3)');
    }
    
    // Calcular fecha de entrega usando el promedio de días
    const avgTransitDays = Math.ceil((minTransitDays + maxTransitDays) / 2);
    const deliveryDate = new Date(shippingDate.getTime() + (avgTransitDays * 24 * 60 * 60 * 1000));
    
    // Formatear transitDays para mostrar
    const formattedTransitDays = minTransitDays === maxTransitDays 
      ? `${minTransitDays}` 
      : `${minTransitDays}-${maxTransitDays}`;
    const formattedTransitDaysDisplay = minTransitDays === maxTransitDays
      ? `${minTransitDays}`
      : `${minTransitDays} - ${maxTransitDays}`;
     
    console.log('🔍 [Checkout] formattedTransitDays final:', formattedTransitDays);
    
    return {
      shippingDate,
      deliveryDate,
      transitDays: formattedTransitDays,
      daysToMonday,
      minTransitDays,
      maxTransitDays,
      transitDaysDisplay: formattedTransitDaysDisplay
    };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
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

    // Si hay una dirección corregida, usarla; si no, usar formData
    let toAddress;
    if (correctedAddress) {
      toAddress = {
        name: correctedAddress.name || `${formData.firstName} ${formData.lastName}`,
        street1: correctedAddress.street1 || formData.address,
        city: correctedAddress.city || formData.city,
        state: correctedAddress.state || formData.state || '',
        zip: correctedAddress.zip || formData.zipCode,
        country: 'US',
        phone: correctedAddress.phone || formData.phone,
        email: correctedAddress.email || formData.email,
        is_residential: true
      };
    } else {
      toAddress = {
        name: `${formData.firstName} ${formData.lastName}`,
        street1: formData.address,
        city: formData.city,
        state: formData.state || '',
        zip: formData.zipCode,
        country: 'US',
        phone: formData.phone,
        email: formData.email,
        is_residential: true
      };
    }

    console.log('Creating shipping data with address:', toAddress);
    console.log('Cart items:', cart);
    console.log('From address:', fromAddress);
    console.log('Using corrected address:', !!correctedAddress);
    
    const orderData = createOrderData(cart, fromAddress, toAddress);
    console.log('Generated order data:', orderData);
    return orderData;
  };

  // Abrir calculador de envíos automáticamente
  const handleOpenShipping = (overrideFormData) => {
    setShippingError(null);

    const data = overrideFormData || formData;
    
    // Crear dirección para validar (sin validar campos primero)
    const addressToValidate = {
      name: `${data.firstName || ''} ${data.lastName || ''}`,
      street1: data.address || '',
      city: data.city || '',
      state: data.state || '', // Usar el estado del formulario
      zip: data.zipCode || '',
      country: 'US',
      phone: data.phone || '',
      email: data.email || '',
      is_residential: true
    };
    
    // Abrir corrección de dirección automáticamente
    setCorrectedAddress(addressToValidate);
    setAddressCorrectionOpen(true);
  };

  useEffect(() => {
    const zipReady = formData.zipCode && formData.zipCode.trim().length >= 5;
    const requiredFieldsFilled =
      zipReady &&
      formData.firstName &&
      formData.lastName &&
      formData.address &&
      formData.city &&
      formData.state;

    if (!requiredFieldsFilled) {
      return;
    }

    const signature = [
      formData.firstName?.trim(),
      formData.lastName?.trim(),
      formData.address?.trim(),
      formData.city?.trim(),
      formData.state?.trim(),
      formData.zipCode?.trim(),
      formData.phone?.trim() || '',
      formData.email?.trim() || ''
    ].join('|');

    if (autoValidationSignatureRef.current === signature) {
      return;
    }

    autoValidationSignatureRef.current = signature;

    const timeout = setTimeout(() => {
      handleOpenShipping(formData);
    }, 400);

    return () => clearTimeout(timeout);
  }, [
    formData.firstName,
    formData.lastName,
    formData.address,
    formData.city,
    formData.state,
    formData.zipCode,
    formData.phone,
    formData.email
  ]);

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
    
    // Guardar la dirección corregida
    setCorrectedAddress(correctedAddressData);
    
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
        state: correctedAddressData.state || prev.state,
        phone: correctedAddressData.phone || prev.phone,
        email: correctedAddressData.email || prev.email
      }));
    }
    
    // Cerrar corrección y abrir calculador de envíos
    setAddressCorrectionOpen(false);
    
    // Esperar un momento para que se actualicen los datos del formulario
    setTimeout(() => {
      setShippingOpen(true);
    }, 100);
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
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
              mb: 2
            }}
          >
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/carrito')}
              className="button-mobile"
              sx={{
                color: '#c8626d',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              {t('checkout.backToCart')}
            </Button>

            <Select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              size="small"
              sx={{
                minWidth: 140,
                backgroundColor: '#fff',
                borderRadius: '20px',
                '& .MuiSelect-select': { py: 1, px: 2, fontWeight: 600 }
              }}
            >
              <MenuItem value="es">Español</MenuItem>
              <MenuItem value="en">English</MenuItem>
            </Select>
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
            {t('checkout.title')}
          </Typography>
          
          <Typography
            variant="body1"
            sx={{
              color: '#666',
              mb: 2,
              fontSize: '0.9rem'
            }}
          >
            {t('checkout.subtitle')}
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
                      {t('checkout.contactInfo')}
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label={t('checkout.firstName')}
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
                          label={t('checkout.lastName')}
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
                          label={t('checkout.email')}
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
                          label={t('checkout.phone')}
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
                        {t('checkout.shippingAddress')}
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid size={12}>
                        <TextField
                          fullWidth
                          label={t('checkout.address')}
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
                          label={t('checkout.city')}
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
                          label={t('checkout.zipCode')}
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
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label={t('checkout.state')}
                          name="state"
                          value={formData.state}
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
                      {t('checkout.orderSummary')}
                    </Typography>

                    {/* Sección de Voucher */}
                    <Box sx={{ mb: 2 }}>
                      {user ? (
                        <Box>
                          {appliedVoucher ? (
                            <Box>
                              {voucherSuccess && (
                                <Alert severity="success" sx={{ mb: 1 }}>
                                  {voucherSuccess}
                                </Alert>
                              )}
                              <Box sx={{ p: 1.5, backgroundColor: '#e8f5e8', borderRadius: '8px', border: '1px solid #4caf50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <LocalOffer sx={{ fontSize: '1rem' }} />
                                  {t('voucher.appliedLabel', {
                                    code: appliedVoucher.code,
                                    percentage: appliedVoucher.discountPercentage
                                  })}
                                </Typography>
                                <Button
                                  size="small"
                                  onClick={handleRemoveVoucher}
                                  sx={{ 
                                    color: '#d32f2f', 
                                    textTransform: 'none',
                                    minWidth: 'auto',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  Remove
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', gap: 1 }}>
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
                                  px: 2,
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
                            <Alert severity="error" sx={{ mt: 1 }}>
                              {voucherError}
                            </Alert>
                          )}
                        </Box>
                      ) : (
                        <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                          <Typography variant="body2" sx={{ color: '#666', textAlign: 'center' }}>
                            <LocalOffer sx={{ fontSize: '1rem', mr: 1, verticalAlign: 'middle' }} />
                            {t('voucher.loginToUse')}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                          {t('checkout.subtotal')} ({cartItemsCount}{' '}
                          {cartItemsCount === 1 ? t('checkout.item') : t('checkout.items')})
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
                          {t('checkout.shipping')}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: shippingInfo ? '#C8626D' : '#666', fontSize: '0.9rem' }}>
                          {shippingInfo
                            ? `$${parseFloat(shippingInfo.cost || 0).toFixed(2)}`
                            : t('checkout.toBeDetermined')}
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#333', fontSize: '1.1rem' }}>
                          {t('checkout.total')}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#c8626d', fontSize: '1.1rem' }}>
                          ${(calculateTotal() + (shippingInfo ? parseFloat(shippingInfo.cost || 0) : 0)).toFixed(2)}
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
                                🚚 Estimated transit: {
                                  deliveryInfo.minTransitDays === deliveryInfo.maxTransitDays
                                    ? `${deliveryInfo.minTransitDays}`
                                    : `${deliveryInfo.minTransitDays} - ${deliveryInfo.maxTransitDays}`
                                } days
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
                        {t('checkout.paymentInfo')}
                      </Typography>
                    </Box>
                    
                    {/* Método de pago con PayPal - Solo mostrar si hay datos completos */}
                    {(() => {
                      const hasAllFields = formData.email && formData.firstName && formData.lastName && formData.address && formData.city && formData.zipCode;
                      console.log('Form data check:', {
                        email: !!formData.email,
                        firstName: !!formData.firstName,
                        lastName: !!formData.lastName,
                        address: !!formData.address,
                        city: !!formData.city,
                        zipCode: !!formData.zipCode,
                        hasAllFields
                      });
                      return hasAllFields;
                    })() ? (
                      <>
                      <PayPalPaymentForm 
                        key={`paypal-${formData.email}-${cartTotal}`}
                        cartItems={cart}
                        shippingInfo={shippingInfo}
                        onPaymentSuccess={async (paymentDetails) => {
                          console.log('🚀🚀🚀 [Checkout] onPaymentSuccess LLAMADO');
                          console.log('✅ PayPal payment successful, clearing cart and navigating');
                          console.log('💰 Payment details:', paymentDetails);
                          console.log('🔍 paymentDetails.id:', paymentDetails.id);
                          console.log('🔍 paymentDetails.paymentId:', paymentDetails.paymentId);
                          
                          // Registrar uso del voucher en la colección voucherUsages
                          if (appliedVoucher && user) {
                            try {
                              const voucherUsagesRef = collection(db, 'voucherUsages');
                              await addDoc(voucherUsagesRef, {
                                voucherCode: appliedVoucher.code,
                                userId: user.uid,
                                userEmail: user.email,
                                discountPercentage: appliedVoucher.discountPercentage,
                                usedAt: new Date(),
                                orderAmount: calculateTotal(),
                                paymentId: paymentDetails.id || paymentDetails.paymentId
                              });
                              console.log('✅ Uso de voucher registrado:', appliedVoucher.code);
                              
                              // Limpiar voucher del localStorage
                              localStorage.removeItem('appliedVoucher');
                            } catch (error) {
                              console.error('Error registrando uso de voucher:', error);
                            }
                          }
                          
                          // Guardar información de envío y pago en localStorage
                          if (shippingInfo) {
                            localStorage.setItem('lastShippingInfo', JSON.stringify(shippingInfo));
                            console.log('📦 Shipping info saved:', shippingInfo);
                          }
                          
                          // Guardar detalles del pago
                          if (paymentDetails.amount) {
                            console.log('💰 [Checkout] paymentDetails.amount:', paymentDetails.amount);
                            console.log('💰 [Checkout] paymentDetails:', paymentDetails);
                            localStorage.setItem('lastPaymentAmount', paymentDetails.amount);
                            console.log('💰 [Checkout] Payment amount saved:', paymentDetails.amount);
                          }
                          
                          // CRÍTICO: Extraer packageInfo del shippingInfo si existe
                          // Esto asegura que se use el mismo peso/dimensiones que se usaron para calcular los rates
                          const packageInfo = shippingInfo?.packageInfo ? {
                            weight: shippingInfo.packageInfo.weight || shippingInfo.packageInfo.mass || '0.22',
                            weightUnit: shippingInfo.packageInfo.weightUnit || shippingInfo.packageInfo.massUnit || 'lb',
                            length: shippingInfo.packageInfo.length || '8',
                            width: shippingInfo.packageInfo.width || '6',
                            height: shippingInfo.packageInfo.height || '4',
                            distanceUnit: shippingInfo.packageInfo.distanceUnit || 'in'
                          } : null;
                          
                          console.log('📦 [Checkout] PackageInfo a guardar en orden:', packageInfo);
                          
                          // Guardar orden usando el endpoint del backend que establece status: 'pending'
                          const orderData = {
                            sessionId: paymentDetails.paymentId || paymentDetails.id,
                            paymentIntentId: paymentDetails.paymentId || paymentDetails.id,
                            customerInfo: {
                              firstName: formData.firstName,
                              lastName: formData.lastName,
                              email: formData.email,
                              phone: formData.phone,
                              address: {
                                line1: formData.address,
                                city: formData.city,
                                postal_code: formData.zipCode,
                                state: formData.state,
                                country: 'US'
                              }
                            },
                            cartItems: cart,
                            total: cartTotal,
                            paymentStatus: 'paid',
                            shippingInfo: shippingInfo,
                            // CRÍTICO: Guardar packageInfo exacto usado para calcular rates
                            packageInfo: packageInfo,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                          };
                          
                          // Usar el endpoint del backend que establece status: 'pending' correctamente
                          const baseUrl = process.env.NODE_ENV === 'production' ? window.location.origin : '';
                          console.log('📤 [Checkout] Enviando orden al backend:', {
                            url: `${baseUrl}/api/create-order`,
                            orderData: {
                              ...orderData,
                              paymentStatus: orderData.paymentStatus,
                              total: orderData.total,
                              cartItemsCount: orderData.cartItems?.length
                            }
                          });
                          
                          try {
                            const response = await fetch(`${baseUrl}/api/create-order`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify(orderData)
                            });
                            
                            console.log('📥 [Checkout] Response status:', response.status);
                            
                            if (!response.ok) {
                              const errorData = await response.json();
                              console.error('❌ [Checkout] Error del servidor:', errorData);
                              throw new Error(errorData.error || 'Error del servidor');
                            }
                            
                            const result = await response.json();
                            console.log('✅ [Checkout] Orden guardada en Firestore:', result);
                            console.log('✅ [Checkout] Order ID:', result.orderId);
                            console.log('✅ [Checkout] Payment Status:', result.order?.paymentStatus);
                            console.log('✅ [Checkout] Status:', result.order?.status);
                            
                            if (result.orderId) {
                              localStorage.setItem('lastOrderId', result.orderId);
                              console.log('💾 [Checkout] Order ID guardado en localStorage:', result.orderId);
                              
                              // Enviar email de confirmación de nuevo pedido a luisuf@gmail.com
                              try {
                                // Inicializar EmailJS si no está inicializado
                                if (!emailjs.init) {
                                  emailjs.init({
                                    publicKey: 'TbgeNq-PEAHvSqjzR'
                                  });
                                }
                                
                                const emailData = {
                                  to_email: 'luisuf@gmail.com',
                                  to_name: 'Luis',
                                  order_id: result.orderId,
                                  customer_name: `${formData.firstName} ${formData.lastName}`,
                                  customer_email: formData.email,
                                  customer_phone: formData.phone || 'N/A',
                                  customer_address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
                                  order_total: `$${cartTotal.toFixed(2)}`,
                                  shipping_cost: shippingInfo ? `$${parseFloat(shippingInfo.cost || 0).toFixed(2)}` : '$0.00',
                                  subtotal: `$${(cartTotal - (shippingInfo ? parseFloat(shippingInfo.cost || 0) : 0)).toFixed(2)}`,
                                  items_count: cart.length,
                                  items_list: cart.map(item => `${item.quantity}x ${item.name} - $${parseFloat(item.price).toFixed(2)}`).join('\n'),
                                  payment_method: 'PayPal',
                                  payment_id: paymentDetails.id || paymentDetails.paymentId || 'N/A',
                                  order_date: new Date().toLocaleString('es-ES', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  }),
                                  subject: `Nuevo Pedido #${result.orderId} - DeliZuKar`,
                                  message: `Se ha recibido un nuevo pedido:\n\nID: ${result.orderId}\nCliente: ${formData.firstName} ${formData.lastName}\nEmail: ${formData.email}\nTotal: $${cartTotal.toFixed(2)}`
                                };
                                
                                await emailjs.send(
                                  'service_7biylnb',
                                  'template_poovxvk',
                                  emailData
                                );
                                
                                console.log('✅ [Checkout] Email de confirmación de nuevo pedido enviado a luisuf@gmail.com');
                              } catch (emailError) {
                                console.error('❌ [Checkout] Error enviando email de confirmación:', emailError);
                                // No bloquear el flujo si falla el email
                              }
                            } else {
                              console.warn('⚠️ [Checkout] No se recibió orderId en la respuesta');
                            }
                          } catch (error) {
                            console.error('❌ [Checkout] Error guardando orden:', error);
                            console.error('❌ [Checkout] Error details:', {
                              message: error.message,
                              stack: error.stack
                            });
                            
                            // Fallback: guardar directamente si el endpoint falla
                            try {
                              console.log('🔄 [Checkout] Intentando guardar directamente en Firestore (fallback)...');
                              const docRef = await addDoc(collection(db, 'orders'), {
                                ...orderData,
                                status: 'pending', // Asegurar status pending incluso en fallback
                                paymentStatus: 'paid' // Asegurar paymentStatus paid
                              });
                              console.log('✅ [Checkout] Orden guardada directamente (fallback):', docRef.id);
                              localStorage.setItem('lastOrderId', docRef.id);
                              
                              // Enviar email de confirmación de nuevo pedido a luisuf@gmail.com
                              try {
                                // Inicializar EmailJS si no está inicializado
                                if (!emailjs.init) {
                                  emailjs.init({
                                    publicKey: 'TbgeNq-PEAHvSqjzR'
                                  });
                                }
                                
                                const emailData = {
                                  to_email: 'luisuf@gmail.com',
                                  to_name: 'Luis',
                                  order_id: docRef.id,
                                  customer_name: `${formData.firstName} ${formData.lastName}`,
                                  customer_email: formData.email,
                                  customer_phone: formData.phone || 'N/A',
                                  customer_address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
                                  order_total: `$${cartTotal.toFixed(2)}`,
                                  shipping_cost: shippingInfo ? `$${parseFloat(shippingInfo.cost || 0).toFixed(2)}` : '$0.00',
                                  subtotal: `$${(cartTotal - (shippingInfo ? parseFloat(shippingInfo.cost || 0) : 0)).toFixed(2)}`,
                                  items_count: cart.length,
                                  items_list: cart.map(item => `${item.quantity}x ${item.name} - $${parseFloat(item.price).toFixed(2)}`).join('\n'),
                                  payment_method: 'PayPal',
                                  payment_id: paymentDetails.id || paymentDetails.paymentId || 'N/A',
                                  order_date: new Date().toLocaleString('es-ES', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  }),
                                  subject: `Nuevo Pedido #${docRef.id} - DeliZuKar`,
                                  message: `Se ha recibido un nuevo pedido:\n\nID: ${docRef.id}\nCliente: ${formData.firstName} ${formData.lastName}\nEmail: ${formData.email}\nTotal: $${cartTotal.toFixed(2)}`
                                };
                                
                                await emailjs.send(
                                  'service_7biylnb',
                                  'template_poovxvk',
                                  emailData
                                );
                                
                                console.log('✅ [Checkout] Email de confirmación de nuevo pedido enviado a luisuf@gmail.com (fallback)');
                              } catch (emailError) {
                                console.error('❌ [Checkout] Error enviando email de confirmación (fallback):', emailError);
                                // No bloquear el flujo si falla el email
                              }
                            } catch (fallbackError) {
                              console.error('❌ [Checkout] Error en fallback:', fallbackError);
                              alert('Error guardando orden: ' + fallbackError.message);
                            }
                          }
                          
                          clearCart();
                          
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
                          state: formData.state,
                          zipCode: formData.zipCode,
                          country: 'US'
                        }}
                      />
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: { xs: 'flex-start', md: 'center' },
                          gap: 2,
                          flexWrap: 'wrap',
                          mt: 3
                        }}
                      >
                        {CARD_LOGOS.map((logo) => (
                          <Box
                            key={logo.alt}
                            sx={{
                              backgroundColor: '#ffffff',
                              borderRadius: '8px',
                              p: 0.75,
                              boxShadow: '0 3px 10px rgba(0,0,0,0.12)'
                            }}
                          >
                            <img
                              src={`${process.env.PUBLIC_URL}${logo.src}`}
                              alt={logo.alt}
                              style={{
                                height: '30px',
                                maxWidth: '96px',
                                display: 'block',
                                objectFit: 'contain'
                              }}
                            />
                          </Box>
                        ))}
                      </Box>
                      </>
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
              state: formData.state,
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

