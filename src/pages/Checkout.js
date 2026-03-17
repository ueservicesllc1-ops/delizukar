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
  MenuItem,
  alpha
} from '@mui/material';
import { CreditCard, LocalShipping, Security, ArrowBack, LocalOffer, CardGiftcard } from '@mui/icons-material';
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
import GiftMessageModal from '../components/GiftMessageModal';
import toast from 'react-hot-toast';

// Inicializar EmailJS al cargar el módulo
const EMAILJS_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_7biylnb';
const EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'woa-DlbiNozuQWT44';

// Inicializar EmailJS una sola vez
if (EMAILJS_PUBLIC_KEY && EMAILJS_PUBLIC_KEY !== 'NOT SET') {
  try {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    console.log('✅ [EmailJS] Inicializado correctamente con Public Key:', EMAILJS_PUBLIC_KEY.substring(0, 10) + '...');
  } catch (error) {
    console.error('❌ [EmailJS] Error inicializando:', error);
  }
} else {
  console.warn('⚠️ [EmailJS] Public Key no configurada');
}

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
    'voucher.discount': 'Descuento',
    'voucher.remove': 'Quitar',
    'checkout.calcDelivery': '📦 Calculando fecha de entrega...',
    'checkout.shippedOn': '📦 Tu pedido será enviado el {date}',
    'checkout.transit': '🚚 Tránsito estimado: {days} días',
    'checkout.estDelivery': '📅 Entrega estimada: {date}',
    'checkout.tracking': 'Seguimiento:',
    'checkout.carrier': 'Transportista:',
    'checkout.eta': 'Tiempo estimado de llegada (ETA):',
    'checkout.ssl': 'Pago seguro con encriptación SSL',
    'checkout.shippingConfigured': '✓ Envío Configurado',
    'checkout.from': 'del',
    'checkout.to': 'al',
    'paypal.summary': 'Resumen de pago',
    'paypal.subtotal': 'Subtotal:',
    'paypal.shipping': 'Envío:',
    'paypal.free': 'Gratis',
    'paypal.total': 'Total:',
    'paypal.method': 'Método de Pago',
    'paypal.disclaimer': 'Pago seguro procesado por PayPal - Acepta las principales tarjetas de crédito/débito',
    'paypal.processing': 'Procesando tu pago...',
    'paypal.shippingAddress': 'Dirección de Envío',
    'paypal.emptyCart': 'Tu carrito está vacío'
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
    'voucher.discount': 'Discount',
    'voucher.remove': 'Remove',
    'checkout.calcDelivery': '📦 Calculating delivery date...',
    'checkout.shippedOn': '📦 Your order will be shipped on {date}',
    'checkout.transit': '🚚 Estimated transit: {days} days',
    'checkout.estDelivery': '📅 Estimated delivery: {date}',
    'checkout.tracking': 'Tracking:',
    'checkout.carrier': 'Carrier:',
    'checkout.eta': 'Estimated Time of Arrival (ETA):',
    'checkout.ssl': 'Secure payment with SSL encryption',
    'checkout.shippingConfigured': '✓ Shipping Configured',
    'checkout.from': 'from',
    'checkout.to': 'to',
    'paypal.summary': 'Payment Summary',
    'paypal.subtotal': 'Subtotal:',
    'paypal.shipping': 'Shipping:',
    'paypal.free': 'Free',
    'paypal.total': 'Total:',
    'paypal.method': 'Payment Method',
    'paypal.disclaimer': 'Secure payment powered by PayPal - Accepts all major credit/debit cards',
    'paypal.processing': 'Processing your payment...',
    'paypal.shippingAddress': 'Shipping Address',
    'paypal.emptyCart': 'Your cart is empty'
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
  const { getCartTotal, getCartItemsCount, clearCart, cart, addToCart } = useStore();
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
  const [showGiftModal, setShowGiftModal] = useState(false);

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
  const handleGiftConfirm = (giftData) => {
    // Añadir el producto de regalo con los detalles como metadata
    const giftItem = {
      ...giftData.product,
      id: `${giftData.product.id}-${Date.now()}`,
      giftDetails: giftData.details,
      description_extra: `Para: ${giftData.details.to} - De: ${giftData.details.from} - Mensaje: ${giftData.details.message}`
    };
    
    addToCart(giftItem);
    toast.success(language === 'es' ? 'Mensaje de regalo añadido' : 'Gift message added');
    setShowGiftModal(false);
  };

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
    
    // Calcular fechas de entrega: fecha de envío + rango de días
    const minDeliveryDate = new Date(shippingDate.getTime() + (minTransitDays * 24 * 60 * 60 * 1000));
    const maxDeliveryDate = new Date(shippingDate.getTime() + (maxTransitDays * 24 * 60 * 60 * 1000));
    
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
      deliveryDate: minDeliveryDate, // Usamos minDeliveryDate como base
      minDeliveryDate,
      maxDeliveryDate,
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

  // Función para simular compra exitosa (solo para pruebas)
  const handleTestPurchase = async () => {
    try {
      // Validar que todos los campos requeridos estén completos
      if (!formData.email || !formData.firstName || !formData.lastName || !formData.address || !formData.city || !formData.zipCode) {
        alert('Por favor completa todos los campos requeridos antes de probar');
        return;
      }

      if (cart.length === 0) {
        alert('El carrito está vacío');
        return;
      }

      console.log('🧪 [Test] Simulando compra exitosa...');
      
      // Crear datos de pago simulados
      const mockPaymentDetails = {
        id: `test_payment_${Date.now()}`,
        paymentId: `test_payment_${Date.now()}`,
        status: 'completed',
        amount: cartTotal
      };

      // Preparar datos de la orden igual que en el flujo real
      const packageInfo = shippingInfo?.packageInfo ? {
        weight: shippingInfo.packageInfo.weight || shippingInfo.packageInfo.mass || '0.22',
        weightUnit: shippingInfo.packageInfo.weightUnit || shippingInfo.packageInfo.massUnit || 'lb',
        length: shippingInfo.packageInfo.length || '8',
        width: shippingInfo.packageInfo.width || '6',
        height: shippingInfo.packageInfo.height || '4',
        distanceUnit: shippingInfo.packageInfo.distanceUnit || 'in'
      } : null;

      const orderData = {
        sessionId: mockPaymentDetails.paymentId,
        paymentIntentId: mockPaymentDetails.paymentId,
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
        cartItems: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          description_extra: item.description_extra || '',
          giftDetails: item.giftDetails || null
        })),
        total: cartTotal,
        paymentStatus: 'paid',
        packageInfo: packageInfo,
        shippingInfo: shippingInfo || null
      };

      console.log('🧪 [Test] Enviando orden al backend...', orderData);

      // Llamar al endpoint para crear la orden (esto enviará los correos automáticamente)
      // En desarrollo, usar directamente localhost:5000 ya que el proxy no siempre funciona
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:5000';
      
      console.log('📧 [Frontend] ========================================');
      console.log('📧 [Frontend] Enviando orden al servidor');
      console.log('📧 [Frontend] Base URL:', baseUrl);
      console.log('📧 [Frontend] ========================================');
      console.log('📧 [Frontend] Datos de la orden:');
      console.log('   - Customer Email:', orderData.customerInfo.email);
      console.log('   - Total:', orderData.total);
      console.log('   - Shipping Cost:', orderData.shippingInfo?.cost || 0);
      console.log('   - Items:', orderData.cartItems.length);
      
      const response = await fetch(`${baseUrl}/api/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      console.log('📧 [Frontend] Response status:', response.status);
      console.log('📧 [Frontend] Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [Frontend] Orden creada exitosamente:', result.orderId);
        
        // Enviar correos desde el frontend usando EmailJS (EmailJS solo funciona desde el navegador)
        console.log('📧 [Frontend] ========================================');
        console.log('📧 [Frontend] ENVIANDO CORREOS DESDE EL NAVEGADOR');
        console.log('📧 [Frontend] ========================================');
        
        const serviceId = EMAILJS_SERVICE_ID;
        const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_poovxvk';
        const publicKey = EMAILJS_PUBLIC_KEY;
        
        // Asegurar que EmailJS esté inicializado
        if (publicKey && publicKey !== 'NOT SET') {
          try {
            if (typeof emailjs.init === 'function') {
              emailjs.init(publicKey);
            }
          } catch (initError) {
            console.warn('⚠️ [EmailJS] Ya estaba inicializado o error:', initError);
          }
        }
        
        const shippingCost = parseFloat(orderData.shippingInfo?.cost || 0);
        const subtotal = orderData.total - shippingCost;
        const itemsListText = orderData.cartItems.map(item => 
          `${item.quantity}x ${item.name} ${item.description_extra ? `(${item.description_extra})` : ''} - $${parseFloat(item.price).toFixed(2)} cada uno = $${(parseFloat(item.price) * item.quantity).toFixed(2)}`
        ).join('\n');
        
        // Enviar correo al cliente
        try {
          console.log('📧 [Frontend] Enviando correo al cliente:', orderData.customerInfo.email);
          console.log('📧 [Frontend] Service ID:', serviceId);
          console.log('📧 [Frontend] Template ID:', templateId);
          console.log('📧 [Frontend] Public Key:', publicKey ? publicKey.substring(0, 10) + '...' : 'NOT SET');
          
          const customerEmailParams = {
            to_email: orderData.customerInfo.email,
            to_name: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
            order_id: result.orderId,
            customer_name: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
            customer_email: orderData.customerInfo.email,
            customer_phone: orderData.customerInfo.phone || 'N/A',
            customer_address: `${orderData.customerInfo.address.line1}, ${orderData.customerInfo.address.city}, ${orderData.customerInfo.address.state} ${orderData.customerInfo.address.postal_code}`,
            order_total: `$${orderData.total.toFixed(2)}`,
            shipping_cost: shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : '$0.00',
            subtotal: `$${subtotal.toFixed(2)}`,
            items_count: orderData.cartItems.length.toString(),
            items_list: itemsListText,
            payment_method: 'PayPal',
            payment_id: mockPaymentDetails.paymentId,
            order_date: new Date().toLocaleString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            subject: `¡Confirmación de tu pedido #${result.orderId}!`,
            message: `¡Gracias por tu compra en Delizukar! Tu pedido #${result.orderId} ha sido recibido y está siendo procesado.\n\nDetalles del pedido:\n${itemsListText}\n\nSubtotal: $${subtotal.toFixed(2)}\n${shippingCost > 0 ? `Envío: $${shippingCost.toFixed(2)}\n` : ''}Total: $${orderData.total.toFixed(2)}`,
            tracking_code: 'PENDING',
            tracking_url: '',
            label_url: ''
          };
          
          console.log('📧 [Frontend] Parámetros del correo al cliente:', customerEmailParams);
          
          const customerEmailResult = await emailjs.send(
            serviceId,
            templateId,
            customerEmailParams,
            { publicKey }
          );
          console.log('✅ [Frontend] Correo al cliente enviado exitosamente:', customerEmailResult);
        } catch (emailError) {
          console.error('❌ [Frontend] Error enviando correo al cliente:', emailError);
          console.error('❌ [Frontend] Error status:', emailError.status);
          console.error('❌ [Frontend] Error text:', emailError.text);
          console.error('❌ [Frontend] Error message:', emailError.message);
        }
        
        // Enviar notificación al administrador
        try {
          console.log('📧 [Frontend] Enviando notificación al administrador: delizukar@gmail.com');
          
          const adminEmailParams = {
            to_email: 'delizukar@gmail.com',
            to_name: 'Delizukar Admin',
            order_id: result.orderId,
            customer_name: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
            customer_email: orderData.customerInfo.email,
            customer_phone: orderData.customerInfo.phone || 'No proporcionado',
            customer_address: `${orderData.customerInfo.address.line1}, ${orderData.customerInfo.address.city}, ${orderData.customerInfo.address.state} ${orderData.customerInfo.address.postal_code}`,
            order_total: `$${orderData.total.toFixed(2)}`,
            shipping_cost: shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : '$0.00',
            subtotal: `$${subtotal.toFixed(2)}`,
            items_count: orderData.cartItems.length.toString(),
            items_list: itemsListText,
            payment_method: 'PayPal',
            payment_id: mockPaymentDetails.paymentId,
            order_date: new Date().toLocaleString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            subject: `🛒 Nueva Orden Recibida - #${result.orderId}`,
            message: `⚠️ ACCIÓN REQUERIDA: Nueva orden recibida\n\nID de pedido: ${result.orderId}\nID de pago: ${mockPaymentDetails.paymentId}\nEstado: paid\n\nCliente: ${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}\nEmail: ${orderData.customerInfo.email}\nTeléfono: ${orderData.customerInfo.phone || 'No proporcionado'}\n\nDirección:\n${orderData.customerInfo.address.line1}\n${orderData.customerInfo.address.city}, ${orderData.customerInfo.address.state} ${orderData.customerInfo.address.postal_code}\n\nProductos:\n${itemsListText}\n\nSubtotal: $${subtotal.toFixed(2)}\n${shippingCost > 0 ? `Envío: $${shippingCost.toFixed(2)}\n` : ''}Total: $${orderData.total.toFixed(2)}\n\nPor favor, procesa esta orden en el panel de administración.`,
            tracking_code: 'PENDING',
            tracking_url: '',
            label_url: ''
          };
          
          console.log('📧 [Frontend] Parámetros del correo al administrador:', adminEmailParams);
          
          const adminEmailResult = await emailjs.send(
            serviceId,
            templateId,
            adminEmailParams,
            { publicKey }
          );
          console.log('✅ [Frontend] Notificación al administrador enviada exitosamente:', adminEmailResult);
        } catch (emailError) {
          console.error('❌ [Frontend] Error enviando notificación al administrador:', emailError);
          console.error('❌ [Frontend] Error status:', emailError.status);
          console.error('❌ [Frontend] Error text:', emailError.text);
          console.error('❌ [Frontend] Error message:', emailError.message);
        }
        
        console.log('📧 [Frontend] ========================================');
        
        // Guardar información en localStorage
        localStorage.setItem('lastOrderId', result.orderId);
        localStorage.setItem('lastPaymentIntentId', mockPaymentDetails.paymentId);
        localStorage.setItem('lastPaymentAmount', cartTotal.toString());
        
        if (shippingInfo) {
          localStorage.setItem('lastShippingInfo', JSON.stringify(shippingInfo));
        }

        // Limpiar carrito
        clearCart();

        // Mostrar mensaje de éxito
        alert('✅ Compra de prueba exitosa!\n\nLos correos han sido enviados:\n- Al cliente: ' + formData.email + '\n- Al administrador: delizukar@gmail.com');

        // Redirigir a la página de éxito
        navigate(`/checkout/success?payment_id=${mockPaymentDetails.paymentId}`);
      } else {
        const errorData = await response.json();
        console.error('❌ [Test] Error creando orden:', errorData);
        alert('Error en la compra de prueba: ' + (errorData.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('❌ [Test] Error en compra de prueba:', error);
      alert('Error en la compra de prueba: ' + error.message);
    }
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

        {/* Botón de prueba de correo - OCULTO */}
        {false && (
        <Box sx={{ mb: 3, p: 2, backgroundColor: '#fff3cd', borderRadius: '12px', border: '2px dashed #ffc107' }}>
          <Typography variant="body2" sx={{ color: '#856404', mb: 1, fontWeight: 600 }}>
            📧 Probar Envío de Correo
          </Typography>
          <Typography variant="caption" sx={{ color: '#856404', display: 'block', mb: 2 }}>
            Prueba el envío de correos sin necesidad de completar el formulario.
          </Typography>
          <Button
            variant="outlined"
            fullWidth
            onClick={async () => {
              try {
                const testEmail = formData.email || prompt('Ingresa un email para probar:') || 'test@example.com';
                if (!testEmail) return;
                
                console.log('📧 [Test] Probando envío de correo a:', testEmail);
                console.log('📧 [Test] Usando EmailJS desde el navegador...');
                
                const serviceId = EMAILJS_SERVICE_ID;
                const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_poovxvk';
                const publicKey = EMAILJS_PUBLIC_KEY;
                
                const testOrderId = 'TEST-' + Date.now();
                
                console.log('📧 [Test] Service ID:', serviceId);
                console.log('📧 [Test] Template ID:', templateId);
                console.log('📧 [Test] Public Key:', publicKey ? publicKey.substring(0, 10) + '...' : 'NOT SET');
                
                // Asegurar que EmailJS esté inicializado antes de enviar
                if (publicKey && publicKey !== 'NOT SET') {
                  try {
                    if (typeof emailjs.init === 'function') {
                      emailjs.init(publicKey);
                      console.log('✅ [Test] EmailJS inicializado antes de enviar');
                    }
                  } catch (initError) {
                    console.warn('⚠️ [Test] EmailJS ya estaba inicializado:', initError);
                  }
                }
                
                const result = await emailjs.send(
                  serviceId,
                  templateId,
                  {
                    to_email: testEmail,
                    to_name: 'Test User',
                    order_id: testOrderId,
                    customer_name: 'Test User',
                    customer_email: testEmail,
                    customer_phone: 'N/A',
                    customer_address: '123 Test St, Test City, TS 12345',
                    order_total: '$100.00',
                    shipping_cost: '$10.00',
                    subtotal: '$90.00',
                    items_count: '1',
                    items_list: '1x Test Product - $90.00 cada uno = $90.00',
                    payment_method: 'Test',
                    payment_id: 'test_payment_' + Date.now(),
                    order_date: new Date().toLocaleString('es-ES', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }),
                    subject: `🧪 Test Email - ${testOrderId}`,
                    message: `Este es un correo de prueba para verificar que EmailJS está funcionando correctamente.\n\nOrder ID: ${testOrderId}\nFecha: ${new Date().toLocaleString()}`,
                    tracking_code: 'TEST',
                    tracking_url: '',
                    label_url: ''
                  },
                  { publicKey }
                );
                
                console.log('✅ [Test] Correo enviado exitosamente:', result);
                alert(`✅ Correo de prueba enviado exitosamente a ${testEmail}\n\nRevisa tu bandeja de entrada y la consola para más detalles.`);
              } catch (error) {
                console.error('❌ [Test] Error completo:', error);
                console.error('❌ [Test] Error message:', error.message);
                console.error('❌ [Test] Error status:', error.status);
                console.error('❌ [Test] Error text:', error.text);
                alert(`❌ Error: ${error.message || 'Error desconocido'}\n\nRevisa la consola para más detalles.`);
              }
            }}
            sx={{
              borderColor: '#ffc107',
              color: '#856404',
              '&:hover': {
                borderColor: '#ffb300',
                backgroundColor: '#fff9e6',
              },
              fontWeight: 600,
              py: 1.5
            }}
          >
            📧 Probar Envío de Correo
          </Button>
        </Box>
        )}

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
                                  {t('voucher.remove')}
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
                      
                      {!cart.some(item => item.category === 'regalo') && (
                        <Button
                          fullWidth
                          startIcon={<CardGiftcard />}
                          onClick={() => setShowGiftModal(true)}
                          sx={{ 
                            mt: 2, 
                            bgcolor: alpha('#c8626d', 0.1), 
                            color: '#c8626d',
                            borderRadius: '12px',
                            py: 1,
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { bgcolor: alpha('#c8626d', 0.2) }
                          }}
                        >
                          {language === 'es' ? 'Añadir Mensaje de Regalo + Tarjeta Premium' : 'Add Gift Message + Premium Card'}
                        </Button>
                      )}
                    </Box>

                    <GiftMessageModal 
                      open={showGiftModal}
                      onClose={() => setShowGiftModal(false)}
                      onConfirm={handleGiftConfirm}
                      onSkip={() => setShowGiftModal(false)}
                    />

                    {/* Información de envío */}
                    {shippingInfo && (
                      <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <Typography variant="body1" sx={{ mb: 0.5, color: '#c8626d', fontWeight: 600, fontSize: '0.9rem' }}>
                          {t('checkout.shippingConfigured')}
                        </Typography>
                        
                        {/* Información de fecha de entrega */}
                        {(() => {
                          const deliveryInfo = calculateDeliveryDate();
                          
                          // Validar que las fechas sean válidas
                          if (isNaN(deliveryInfo.shippingDate.getTime()) || isNaN(deliveryInfo.deliveryDate.getTime())) {
                            return (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem' }}>
                                  {t('checkout.calcDelivery')}
                                </Typography>
                              </Box>
                            );
                          }
                          
                          return (
                            <>
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem', mb: 0.5 }}>
                                  {t('checkout.shippedOn', { date: deliveryInfo.shippingDate.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { 
                                    weekday: 'long', 
                                    day: 'numeric', 
                                    month: 'long' 
                                  }) })}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem', mb: 0.5 }}>
                                  {t('checkout.transit', { days: deliveryInfo.minTransitDays === deliveryInfo.maxTransitDays
                                      ? `${deliveryInfo.minTransitDays}`
                                      : `${deliveryInfo.minTransitDays} - ${deliveryInfo.maxTransitDays}` })}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#c8626d', fontWeight: 600, fontSize: '0.85rem' }}>
                                  {t('checkout.estDelivery', { date: deliveryInfo.deliveryDate.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { 
                                    weekday: 'long', 
                                    day: 'numeric', 
                                    month: 'long' 
                                  }) })}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                                {t('checkout.tracking')} {shippingInfo.trackingNumber || 'PENDING'}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                                {t('checkout.carrier')} {shippingInfo.carrier} - {shippingInfo.serviceLevel}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                                {t('checkout.eta')}{' '}
                                {deliveryInfo.minTransitDays === deliveryInfo.maxTransitDays
                                  ? deliveryInfo.minDeliveryDate.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long' })
                                  : `${t('checkout.from')} ${deliveryInfo.minDeliveryDate.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long' })} ${t('checkout.to')} ${deliveryInfo.maxDeliveryDate.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long' })}`}
                              </Typography>
                            </>
                          );
                        })()}
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
                        {t('checkout.ssl')}
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
                    
                    {/* Botón de prueba de correo - OCULTO */}
                    {false && (
                    <Box sx={{ mb: 2, p: 2, backgroundColor: '#fff3cd', borderRadius: '12px', border: '2px dashed #ffc107' }}>
                      <Typography variant="body2" sx={{ color: '#856404', mb: 1, fontWeight: 600 }}>
                        📧 Probar Envío de Correo
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#856404', display: 'block', mb: 2 }}>
                        Prueba el envío de correos sin necesidad de completar el formulario.
                      </Typography>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={async () => {
                          try {
                            const testEmail = formData.email || prompt('Ingresa un email para probar:') || 'test@example.com';
                            if (!testEmail) return;
                            
                            console.log('📧 [Test] Probando envío de correo a:', testEmail);
                            console.log('📧 [Test] Usando EmailJS desde el navegador...');
                            
                            const serviceId = EMAILJS_SERVICE_ID;
                            const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_poovxvk';
                            const publicKey = EMAILJS_PUBLIC_KEY;
                            
                            const testOrderId = 'TEST-' + Date.now();
                            
                            console.log('📧 [Test] Service ID:', serviceId);
                            console.log('📧 [Test] Template ID:', templateId);
                            console.log('📧 [Test] Public Key:', publicKey ? publicKey.substring(0, 10) + '...' : 'NOT SET');
                            
                            // Asegurar que EmailJS esté inicializado antes de enviar
                            if (publicKey && publicKey !== 'NOT SET') {
                              try {
                                if (typeof emailjs.init === 'function') {
                                  emailjs.init(publicKey);
                                  console.log('✅ [Test] EmailJS inicializado antes de enviar');
                                }
                              } catch (initError) {
                                console.warn('⚠️ [Test] EmailJS ya estaba inicializado:', initError);
                              }
                            }
                            
                            const result = await emailjs.send(
                              serviceId,
                              templateId,
                              {
                                to_email: testEmail,
                                to_name: 'Test User',
                                order_id: testOrderId,
                                customer_name: 'Test User',
                                customer_email: testEmail,
                                customer_phone: 'N/A',
                                customer_address: '123 Test St, Test City, TS 12345',
                                order_total: '$100.00',
                                shipping_cost: '$10.00',
                                subtotal: '$90.00',
                                items_count: '1',
                                items_list: '1x Test Product - $90.00 cada uno = $90.00',
                                payment_method: 'Test',
                                payment_id: 'test_payment_' + Date.now(),
                                order_date: new Date().toLocaleString('es-ES', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                }),
                                subject: `🧪 Test Email - ${testOrderId}`,
                                message: `Este es un correo de prueba para verificar que EmailJS está funcionando correctamente.\n\nOrder ID: ${testOrderId}\nFecha: ${new Date().toLocaleString()}`,
                                tracking_code: 'TEST',
                                tracking_url: '',
                                label_url: ''
                              },
                              { publicKey }
                            );
                            
                            console.log('✅ [Test] Correo enviado exitosamente:', result);
                            alert(`✅ Correo de prueba enviado exitosamente a ${testEmail}\n\nRevisa tu bandeja de entrada y la consola para más detalles.`);
                          } catch (error) {
                            console.error('❌ [Test] Error completo:', error);
                            console.error('❌ [Test] Error message:', error.message);
                            console.error('❌ [Test] Error stack:', error.stack);
                            alert(`❌ Error: ${error.message}\n\nRevisa la consola para más detalles.`);
                          }
                        }}
                        sx={{
                          borderColor: '#ffc107',
                          color: '#856404',
                          '&:hover': {
                            borderColor: '#ffb300',
                            backgroundColor: '#fff9e6',
                          },
                          fontWeight: 600,
                          py: 1
                        }}
                      >
                        📧 Probar Envío de Correo
                      </Button>
                    </Box>
                    )}

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
                      {/* Botón de prueba para simular compra exitosa - OCULTO */}
                      {false && (
                      <Box sx={{ mb: 2, p: 2, backgroundColor: '#fff3cd', borderRadius: '12px', border: '2px dashed #ffc107' }}>
                        <Typography variant="body2" sx={{ color: '#856404', mb: 1, fontWeight: 600 }}>
                          🧪 Modo Prueba - Simular Compra
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#856404', display: 'block', mb: 2 }}>
                          Este botón simula una compra exitosa sin procesar pago real. Se enviarán correos automáticamente.
                        </Typography>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={handleTestPurchase}
                          sx={{
                            backgroundColor: '#ffc107',
                            color: '#000',
                            '&:hover': {
                              backgroundColor: '#ffb300',
                            },
                            fontWeight: 600,
                            py: 1.5
                          }}
                        >
                          🧪 Simular Compra Exitosa (Prueba)
                        </Button>
                      </Box>
                      )}
                      
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
                          // En desarrollo, usar directamente localhost:5000 ya que el proxy no siempre funciona
                          const baseUrl = process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:5000';
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
                            
                            console.log('📧 [Frontend] ========================================');
                            console.log('📧 [Frontend] INFORMACIÓN SOBRE CORREOS (PayPal):');
                            console.log('📧 [Frontend] ========================================');
                            if (result.emailStatus) {
                              console.log('📧 [Frontend] Email Status:', result.emailStatus);
                              console.log('📧 [Frontend] Customer Email:', result.emailStatus.customerEmail);
                              console.log('📧 [Frontend] Admin Email:', result.emailStatus.adminEmail);
                              console.log('📧 [Frontend] Status:', result.emailStatus.status);
                              console.log('📧 [Frontend] Message:', result.emailStatus.message);
                            } else {
                              console.log('📧 [Frontend] Los correos se están enviando en segundo plano');
                              console.log('📧 [Frontend] Correo al cliente:', orderData.customerInfo.email);
                              console.log('📧 [Frontend] Correo al administrador: delizukar@gmail.com');
                            }
                            console.log('📧 [Frontend] ========================================');
                            
                            if (result.orderId) {
                              localStorage.setItem('lastOrderId', result.orderId);
                              localStorage.setItem('lastPaymentIntentId', paymentDetails.paymentId || paymentDetails.id);
                              localStorage.setItem('lastPaymentAmount', cartTotal.toString());
                              console.log('💾 [Checkout] Order ID guardado en localStorage:', result.orderId);
                              
                              // Enviar correos desde el frontend usando EmailJS (EmailJS solo funciona desde el navegador)
                              console.log('📧 [Checkout] ========================================');
                              console.log('📧 [Checkout] ENVIANDO CORREOS DESDE EL NAVEGADOR (PayPal)');
                              console.log('📧 [Checkout] ========================================');
                              
                              const serviceId = EMAILJS_SERVICE_ID;
                              const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_poovxvk';
                              const publicKey = EMAILJS_PUBLIC_KEY;
                              
                              // Asegurar que EmailJS esté inicializado
                              if (publicKey && publicKey !== 'NOT SET') {
                                try {
                                  if (typeof emailjs.init === 'function') {
                                    emailjs.init(publicKey);
                                  }
                                } catch (initError) {
                                  console.warn('⚠️ [EmailJS] Ya estaba inicializado:', initError);
                                }
                              }
                              
                              const shippingCost = parseFloat(shippingInfo?.cost || 0);
                              const subtotal = cartTotal - shippingCost;
                              const itemsListText = cart.map(item => 
                                `${item.quantity}x ${item.name} ${item.description_extra ? `(${item.description_extra})` : ''} - $${parseFloat(item.price).toFixed(2)} cada uno = $${(parseFloat(item.price) * item.quantity).toFixed(2)}`
                              ).join('\n');
                              
                              // Enviar correo al cliente
                              try {
                                console.log('📧 [Checkout] Enviando correo al cliente:', orderData.customerInfo.email);
                                console.log('📧 [Checkout] Service ID:', serviceId);
                                console.log('📧 [Checkout] Template ID:', templateId);
                                console.log('📧 [Checkout] Public Key:', publicKey ? publicKey.substring(0, 10) + '...' : 'NOT SET');
                                
                                const customerEmailParams = {
                                  to_email: orderData.customerInfo.email,
                                  to_name: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
                                  order_id: result.orderId,
                                  customer_name: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
                                  customer_email: orderData.customerInfo.email,
                                  customer_phone: orderData.customerInfo.phone || 'N/A',
                                  customer_address: `${orderData.customerInfo.address.line1}, ${orderData.customerInfo.address.city}, ${orderData.customerInfo.address.state} ${orderData.customerInfo.address.postal_code}`,
                                  order_total: `$${cartTotal.toFixed(2)}`,
                                  shipping_cost: shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : '$0.00',
                                  subtotal: `$${subtotal.toFixed(2)}`,
                                  items_count: cart.length.toString(),
                                  items_list: itemsListText,
                                  payment_method: 'PayPal',
                                  payment_id: paymentDetails.paymentId || paymentDetails.id || 'N/A',
                                  order_date: new Date().toLocaleString('es-ES', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  }),
                                  subject: `¡Confirmación de tu pedido #${result.orderId}!`,
                                  message: `¡Gracias por tu compra en Delizukar! Tu pedido #${result.orderId} ha sido recibido y está siendo procesado.\n\nDetalles del pedido:\n${itemsListText}\n\nSubtotal: $${subtotal.toFixed(2)}\n${shippingCost > 0 ? `Envío: $${shippingCost.toFixed(2)}\n` : ''}Total: $${cartTotal.toFixed(2)}`,
                                  tracking_code: 'PENDING',
                                  tracking_url: '',
                                  label_url: ''
                                };
                                
                                console.log('📧 [Checkout] Parámetros del correo al cliente:', customerEmailParams);
                                
                                const customerEmailResult = await emailjs.send(
                                  serviceId,
                                  templateId,
                                  customerEmailParams,
                                  { publicKey }
                                );
                                console.log('✅ [Checkout] Correo al cliente enviado exitosamente:', customerEmailResult);
                              } catch (emailError) {
                                console.error('❌ [Checkout] Error enviando correo al cliente:', emailError);
                                console.error('❌ [Checkout] Error status:', emailError.status);
                                console.error('❌ [Checkout] Error text:', emailError.text);
                                console.error('❌ [Checkout] Error message:', emailError.message);
                              }
                              
                              // Enviar notificación al administrador
                              try {
                                console.log('📧 [Checkout] Enviando notificación al administrador: delizukar@gmail.com');
                                
                                const adminEmailParams = {
                                  to_email: 'delizukar@gmail.com',
                                  to_name: 'Delizukar Admin',
                                  order_id: result.orderId,
                                  customer_name: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
                                  customer_email: orderData.customerInfo.email,
                                  customer_phone: orderData.customerInfo.phone || 'No proporcionado',
                                  customer_address: `${orderData.customerInfo.address.line1}, ${orderData.customerInfo.address.city}, ${orderData.customerInfo.address.state} ${orderData.customerInfo.address.postal_code}`,
                                  order_total: `$${cartTotal.toFixed(2)}`,
                                  shipping_cost: shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : '$0.00',
                                  subtotal: `$${subtotal.toFixed(2)}`,
                                  items_count: cart.length.toString(),
                                  items_list: itemsListText,
                                  payment_method: 'PayPal',
                                  payment_id: paymentDetails.paymentId || paymentDetails.id || 'N/A',
                                  order_date: new Date().toLocaleString('es-ES', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  }),
                                  subject: `🛒 Nueva Orden Recibida - #${result.orderId}`,
                                  message: `⚠️ ACCIÓN REQUERIDA: Nueva orden recibida\n\nID de pedido: ${result.orderId}\nID de pago: ${paymentDetails.paymentId || paymentDetails.id || 'N/A'}\nEstado: paid\n\nCliente: ${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}\nEmail: ${orderData.customerInfo.email}\nTeléfono: ${orderData.customerInfo.phone || 'No proporcionado'}\n\nDirección:\n${orderData.customerInfo.address.line1}\n${orderData.customerInfo.address.city}, ${orderData.customerInfo.address.state} ${orderData.customerInfo.address.postal_code}\n\nProductos:\n${itemsListText}\n\nSubtotal: $${subtotal.toFixed(2)}\n${shippingCost > 0 ? `Envío: $${shippingCost.toFixed(2)}\n` : ''}Total: $${cartTotal.toFixed(2)}\n\nPor favor, procesa esta orden en el panel de administración.`,
                                  tracking_code: 'PENDING',
                                  tracking_url: '',
                                  label_url: ''
                                };
                                
                                console.log('📧 [Checkout] Parámetros del correo al administrador:', adminEmailParams);
                                
                                const adminEmailResult = await emailjs.send(
                                  serviceId,
                                  templateId,
                                  adminEmailParams,
                                  { publicKey }
                                );
                                console.log('✅ [Checkout] Notificación al administrador enviada exitosamente:', adminEmailResult);
                              } catch (emailError) {
                                console.error('❌ [Checkout] Error enviando notificación al administrador:', emailError);
                                console.error('❌ [Checkout] Error status:', emailError.status);
                                console.error('❌ [Checkout] Error text:', emailError.text);
                                console.error('❌ [Checkout] Error message:', emailError.message);
                              }
                              
                              console.log('📧 [Checkout] ========================================');
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
                                // Asegurar que EmailJS esté inicializado
                                if (EMAILJS_PUBLIC_KEY && EMAILJS_PUBLIC_KEY !== 'NOT SET') {
                                  try {
                                    if (typeof emailjs.init === 'function') {
                                      emailjs.init(EMAILJS_PUBLIC_KEY);
                                    }
                                  } catch (initError) {
                                    console.warn('⚠️ [EmailJS] Ya estaba inicializado:', initError);
                                  }
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
                                  items_list: cart.map(item => `${item.quantity}x ${item.name} ${item.description_extra ? `(${item.description_extra})` : ''} - $${parseFloat(item.price).toFixed(2)}`).join('\n'),
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
                                  EMAILJS_SERVICE_ID,
                                  process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_poovxvk',
                                  emailData,
                                  { publicKey: EMAILJS_PUBLIC_KEY }
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

