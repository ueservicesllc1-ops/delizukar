# Mejores Prácticas - React Stripe.js para Delizukar

## Configuración Optimizada para React

### 1. Configuración del Provider

#### Configuración Básica
```jsx
// App.js
import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { STRIPE_ELEMENTS_CONFIG } from './stripe/config';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function App() {
  return (
    <Elements stripe={stripePromise} options={STRIPE_ELEMENTS_CONFIG}>
      <CheckoutPage />
    </Elements>
  );
}

export default App;
```

#### Configuración Avanzada con CheckoutProvider
```jsx
// Para Checkout Sessions
import { CheckoutProvider } from '@stripe/react-stripe-js/checkout';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function CheckoutApp() {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Crear Checkout Session
    fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartItems, total, customerInfo })
    })
    .then(res => res.json())
    .then(data => setClientSecret(data.clientSecret));
  }, []);

  return (
    <CheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm />
    </CheckoutProvider>
  );
}
```

### 2. Componentes de Pago Optimizados

#### PaymentElement con Manejo de Estados
```jsx
// components/StripePaymentForm.jsx
import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Box, Button, Alert, CircularProgress } from '@mui/material';

const StripePaymentForm = ({ onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message);
      setLoading(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    });

    if (confirmError) {
      setError(confirmError.message);
      onError && onError(confirmError);
    } else {
      onSuccess && onSuccess();
    }

    setLoading(false);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <PaymentElement 
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['card', 'klarna', 'afterpay']
        }}
      />
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      <Button
        type="submit"
        disabled={!stripe || loading}
        fullWidth
        variant="contained"
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Pagar'}
      </Button>
    </Box>
  );
};

export default StripePaymentForm;
```

#### ExpressCheckoutElement para Pagos Rápidos
```jsx
// components/ExpressCheckout.jsx
import React from 'react';
import { ExpressCheckoutElement } from '@stripe/react-stripe-js';

const ExpressCheckout = ({ onConfirm }) => {
  return (
    <ExpressCheckoutElement
      options={{
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
      }}
      onConfirm={onConfirm}
    />
  );
};

export default ExpressCheckout;
```

### 3. Hooks Personalizados

#### useStripePayment Hook
```jsx
// hooks/useStripePayment.js
import { useState, useCallback } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';

export const useStripePayment = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const processPayment = useCallback(async (paymentData) => {
    if (!stripe || !elements) {
      setError('Stripe no está cargado');
      return { success: false, error: 'Stripe no está cargado' };
    }

    setLoading(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message);
        return { success: false, error: submitError.message };
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      });

      if (confirmError) {
        setError(confirmError.message);
        return { success: false, error: confirmError.message };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Error desconocido';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [stripe, elements]);

  return {
    processPayment,
    loading,
    error,
    setError
  };
};
```

#### useCheckout Hook (para Checkout Sessions)
```jsx
// hooks/useCheckout.js
import { useCheckout as useStripeCheckout } from '@stripe/react-stripe-js/checkout';

export const useCheckout = () => {
  const checkoutState = useStripeCheckout();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (checkoutState.type === 'loading') {
      return { success: false, error: 'Cargando...' };
    }

    if (checkoutState.type === 'error') {
      return { success: false, error: checkoutState.error.message };
    }

    const { checkout } = checkoutState;
    const result = await checkout.confirm();

    if (result.type === 'error') {
      return { success: false, error: result.error.message };
    }

    return { success: true };
  };

  return {
    checkoutState,
    handleSubmit,
    isLoading: checkoutState.type === 'loading',
    hasError: checkoutState.type === 'error',
    error: checkoutState.type === 'error' ? checkoutState.error : null
  };
};
```

### 4. Manejo de Errores Robusto

#### Error Boundary para Stripe
```jsx
// components/StripeErrorBoundary.jsx
import React from 'react';
import { Alert, Box, Button } from '@mui/material';

class StripeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Stripe Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Error en el sistema de pagos. Por favor, intenta de nuevo.
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
          >
            Recargar Página
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default StripeErrorBoundary;
```

#### Manejo de Errores Específicos
```jsx
// utils/stripeErrorHandler.js
export const handleStripeError = (error) => {
  const errorMessages = {
    'card_declined': 'Tu tarjeta fue rechazada. Intenta con otra tarjeta.',
    'insufficient_funds': 'Fondos insuficientes. Verifica tu saldo.',
    'expired_card': 'Tu tarjeta ha expirado. Usa una tarjeta válida.',
    'incorrect_cvc': 'El código CVC es incorrecto.',
    'processing_error': 'Error de procesamiento. Intenta de nuevo.',
    'authentication_required': 'Se requiere autenticación adicional.',
  };

  return errorMessages[error.code] || error.message || 'Error de pago desconocido';
};
```

### 5. Optimización de Rendimiento

#### Lazy Loading de Componentes
```jsx
// components/LazyStripeCheckout.jsx
import React, { Suspense, lazy } from 'react';
import { CircularProgress, Box } from '@mui/material';

const StripeCheckout = lazy(() => import('./StripeCheckout'));

const LazyStripeCheckout = (props) => {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    }>
      <StripeCheckout {...props} />
    </Suspense>
  );
};

export default LazyStripeCheckout;
```

#### Memoización de Componentes
```jsx
// components/OptimizedPaymentForm.jsx
import React, { memo, useMemo } from 'react';
import { PaymentElement } from '@stripe/react-stripe-js';

const OptimizedPaymentForm = memo(({ onSuccess, onError }) => {
  const paymentElementOptions = useMemo(() => ({
    layout: 'tabs',
    paymentMethodOrder: ['card', 'klarna', 'afterpay'],
    fields: {
      billingDetails: 'auto'
    }
  }), []);

  return (
    <PaymentElement options={paymentElementOptions} />
  );
});

OptimizedPaymentForm.displayName = 'OptimizedPaymentForm';

export default OptimizedPaymentForm;
```

### 6. Testing de Componentes

#### Test de Componente Stripe
```jsx
// __tests__/StripePaymentForm.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePaymentForm from '../components/StripePaymentForm';

// Mock de Stripe
const mockStripe = {
  confirmPayment: jest.fn(),
  elements: jest.fn()
};

const mockElements = {
  submit: jest.fn()
};

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve(mockStripe))
}));

const stripePromise = loadStripe('pk_test_...');

const renderWithStripe = (component) => {
  return render(
    <Elements stripe={stripePromise}>
      {component}
    </Elements>
  );
};

describe('StripePaymentForm', () => {
  test('renders payment form', () => {
    renderWithStripe(<StripePaymentForm />);
    expect(screen.getByRole('button', { name: /pagar/i })).toBeInTheDocument();
  });

  test('handles payment submission', async () => {
    mockElements.submit.mockResolvedValue({ error: null });
    mockStripe.confirmPayment.mockResolvedValue({ error: null });

    renderWithStripe(<StripePaymentForm />);
    
    const submitButton = screen.getByRole('button', { name: /pagar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockElements.submit).toHaveBeenCalled();
    });
  });
});
```

### 7. Configuración de Desarrollo

#### Variables de Entorno
```env
# .env.development
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
REACT_APP_STRIPE_SECRET_KEY=sk_test_...
REACT_APP_STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Configuración de Webpack (si es necesario)
```javascript
// webpack.config.js
module.exports = {
  resolve: {
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer")
    }
  }
};
```

### 8. Mejores Prácticas de Seguridad

#### Validación de Cliente
```jsx
// utils/validation.js
export const validatePaymentData = (data) => {
  const errors = {};

  if (!data.email || !data.email.includes('@')) {
    errors.email = 'Email válido requerido';
  }

  if (!data.name || data.name.length < 2) {
    errors.name = 'Nombre requerido';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

#### Sanitización de Datos
```jsx
// utils/sanitization.js
export const sanitizePaymentData = (data) => {
  return {
    email: data.email?.toLowerCase().trim(),
    name: data.name?.trim(),
    // No incluir datos sensibles
  };
};
```

### 9. Monitoreo y Analytics

#### Tracking de Eventos
```jsx
// hooks/useStripeAnalytics.js
import { useEffect } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';

export const useStripeAnalytics = () => {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (!stripe || !elements) return;

    const trackEvent = (eventName, properties = {}) => {
      // Integrar con tu sistema de analytics
      console.log('Stripe Event:', eventName, properties);
    };

    // Track cuando Stripe se carga
    trackEvent('stripe_loaded');

    return () => {
      trackEvent('stripe_unmounted');
    };
  }, [stripe, elements]);
};
```

### 10. Documentación de Componentes

#### JSDoc para Componentes
```jsx
/**
 * Componente de pago con Stripe
 * @param {Object} props - Props del componente
 * @param {Function} props.onSuccess - Callback cuando el pago es exitoso
 * @param {Function} props.onError - Callback cuando hay un error
 * @param {Object} props.cartItems - Items del carrito
 * @param {number} props.total - Total del pago
 * @param {Object} props.customerInfo - Información del cliente
 * @returns {JSX.Element} Componente de pago
 */
const StripePaymentForm = ({ onSuccess, onError, cartItems, total, customerInfo }) => {
  // ... implementación
};
```

## Recursos Adicionales

- [React Stripe.js Documentation](https://stripe.com/docs/stripe-js/react)
- [Stripe Elements Reference](https://stripe.com/docs/js/elements_object)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [React Best Practices](https://reactjs.org/docs/thinking-in-react.html)
