import { loadStripe } from '@stripe/stripe-js';

// Clave pública de Stripe
const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_51234567890abcdef...';

// Inicializar Stripe
export const stripePromise = loadStripe(stripePublishableKey);

// Configuración de Stripe Checkout
export const STRIPE_CHECKOUT_CONFIG = {
  // URLs para páginas de éxito y cancelación
  successUrl: `${window.location.origin}/checkout/success`,
  cancelUrl: `${window.location.origin}/checkout`,
  
  // Métodos de pago disponibles
  paymentMethodTypes: ['card', 'link', 'klarna', 'paypal', 'afterpay_clearpay', 'affirm'],
  
  // Creación de clientes
  customerCreation: 'always',
  
  // Opciones de métodos de pago guardados
  savedPaymentMethodOptions: {
    paymentMethodSave: 'enabled',
    paymentMethodRemove: 'enabled'
  },
  
  // Recolección de dirección de facturación
  billingAddressCollection: 'required',
  
  // Recolección de dirección de envío
  shippingAddressCollection: {
    allowedCountries: ['US', 'CA', 'MX', 'ES', 'FR', 'DE', 'IT', 'GB']
  },
  
  // Recolección de número de teléfono
  phoneNumberCollection: {
    enabled: true
  },
  
  // Cálculo automático de impuestos
  automaticTax: {
    enabled: true
  }
};

// Configuración de Stripe Elements
export const STRIPE_ELEMENTS_CONFIG = {
  appearance: {
    theme: 'stripe',
    variables: {
      colorPrimary: '#C8626D',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'Ideal Sans, system-ui, sans-serif',
      spacingUnit: '2px',
      borderRadius: '4px',
    }
  }
};

// Configuración del Express Checkout Element
export const EXPRESS_CHECKOUT_CONFIG = {
  layout: {
    overflow: 'never',
    maxColumns: 2,
    maxRows: 1
  },
  buttonTheme: {
    applePay: 'black',
    googlePay: 'black',
    paypal: 'black'
  }
};

// Configuración general de Stripe
export const stripeConfig = {
  // Configuración para el modo de desarrollo
  mode: process.env.NODE_ENV === 'production' ? 'live' : 'test',
  
  // Configuración de moneda
  currency: 'usd',
  
  // Configuración de país
  country: 'US',
  
  // Configuración de idioma
  locale: 'es',
  
  // Configuración de métodos de pago permitidos
  paymentMethods: {
    card: true,
    link: true,
    klarna: true,
    paypal: true,
    afterpay_clearpay: true,
    affirm: true
  }
};

export default stripeConfig;
