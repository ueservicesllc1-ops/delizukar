# Stripe API v2 Integration Guide

## 🚀 Enhanced Stripe Integration with API v2

This guide shows you how to implement the latest Stripe API v2 features in your e-commerce application.

## 📋 Prerequisites

- Stripe account with API keys
- Node.js and npm installed
- Firebase project configured

## 🔧 Environment Configuration

Create a `.env` file in your project root:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51234567890abcdef...
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef...
STRIPE_WEBHOOK_SECRET=whsec_...

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## 🆕 API v2 Features Implemented

### 1. Enhanced Error Handling
- **Specific error types**: `card_error`, `validation_error`, `api_error`, `authentication_error`, `rate_limit_error`
- **User-friendly messages**: Localized error messages in Spanish
- **Retry logic**: Automatic retry with exponential backoff

### 2. Improved Security
- **CSRF protection**: `X-Requested-With` header validation
- **Security headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- **Request size limits**: 10MB limit for JSON payloads
- **Idempotency keys**: Unique keys for payment requests

### 3. Enhanced Payment Methods
- **Buy Now, Pay Later**: Afterpay, Klarna, Affirm
- **Digital Wallets**: Apple Pay, Google Pay
- **Bank Transfers**: ACH, SEPA
- **Cryptocurrency**: Bitcoin, Ethereum (if enabled)

### 4. Advanced Webhook Handling
- **Thin events**: API v2 webhook events
- **Event filtering**: Only process relevant events
- **Error recovery**: Automatic retry for failed webhooks
- **Event logging**: Comprehensive event tracking

## 🔄 API v2 vs API v1 Differences

| Feature | API v1 | API v2 |
|---------|--------|--------|
| **Request Format** | Form encoding | JSON encoding |
| **Idempotency** | 24 hours | 30 days |
| **Error Handling** | Basic | Enhanced with retry logic |
| **Event Payloads** | Full objects | Thin events |
| **Pagination** | `starting_after` | `page_token` |
| **Metadata** | String values | Null values supported |

## 🛠️ Implementation Details

### Frontend (React)

```javascript
// Enhanced Stripe initialization
const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
  {
    apiVersion: '2024-09-30.acacia', // Latest API version
    locale: 'es' // Spanish locale
  }
);

// Enhanced error handling
const handlePayment = async (event) => {
  try {
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
      redirect: 'if_required'
    });

    if (stripeError) {
      // Enhanced error handling with specific error types
      let errorMessage = 'Error al procesar el pago';
      
      switch (stripeError.type) {
        case 'card_error':
          errorMessage = `Error de tarjeta: ${stripeError.message}`;
          break;
        case 'validation_error':
          errorMessage = `Error de validación: ${stripeError.message}`;
          break;
        case 'api_error':
          errorMessage = 'Error del servidor. Por favor, inténtalo de nuevo.';
          break;
        case 'authentication_error':
          errorMessage = 'Error de autenticación. Por favor, recarga la página.';
          break;
        case 'rate_limit_error':
          errorMessage = 'Demasiadas solicitudes. Por favor, espera un momento.';
          break;
        default:
          errorMessage = stripeError.message || 'Error desconocido';
      }
      
      setError(errorMessage);
    }
  } catch (err) {
    console.error('Payment error:', err);
    setError('Error inesperado al procesar el pago');
  }
};
```

### Backend (Node.js)

```javascript
// Enhanced Stripe client initialization
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-09-30.acacia', // Latest API version
  maxNetworkRetries: 3, // Enhanced retry logic
  timeout: 30000, // 30 second timeout
});

// Enhanced PaymentIntent creation
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(total * 100),
  currency: 'usd',
  automatic_payment_methods: {
    enabled: true,
    allow_redirects: 'always',
  },
  payment_method_types: ['card', 'afterpay_clearpay', 'klarna', 'affirm', 'link'],
  metadata: {
    customer_email: customerInfo.email,
    customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
    order_items: JSON.stringify(cartItems),
    source: 'web_checkout',
    version: '2.0',
    integration: 'stripe_js_v2'
  },
  receipt_email: customerInfo.email,
  confirmation_method: 'automatic',
  setup_future_usage: 'off_session',
}, {
  idempotencyKey: `pi_${Date.now()}_${customerInfo.email}`,
  timeout: 30000,
  maxNetworkRetries: 3
});
```

## 🔐 Security Best Practices

### 1. API Key Management
- **Environment variables**: Never hardcode API keys
- **Key rotation**: Regularly rotate secret keys
- **Restricted keys**: Use restricted keys for specific operations
- **IP allowlisting**: Restrict API access to specific IPs

### 2. Webhook Security
- **Signature verification**: Always verify webhook signatures
- **HTTPS only**: Use HTTPS for webhook endpoints
- **Event filtering**: Only process relevant events
- **Idempotency**: Handle duplicate events gracefully

### 3. Data Protection
- **PCI compliance**: Never store card data
- **Encryption**: Encrypt sensitive data at rest
- **Access control**: Implement proper authentication
- **Audit logging**: Log all payment operations

## 📊 Monitoring and Analytics

### 1. Payment Metrics
- **Success rate**: Track payment success rates
- **Error rates**: Monitor payment failures
- **Processing time**: Measure payment processing time
- **Revenue tracking**: Monitor revenue by payment method

### 2. Error Monitoring
- **Error tracking**: Log all payment errors
- **Alert system**: Set up alerts for critical errors
- **Performance monitoring**: Monitor API response times
- **Webhook monitoring**: Track webhook delivery success

### 3. Business Intelligence
- **Payment method analysis**: Analyze preferred payment methods
- **Geographic analysis**: Track payments by location
- **Customer behavior**: Analyze customer payment patterns
- **Revenue optimization**: Identify opportunities for improvement

## 🧪 Testing

### 1. Test Cards
```javascript
// Success
const testCardSuccess = '4242424242424242';

// Decline
const testCardDecline = '4000000000000002';

// 3D Secure
const testCard3DS = '4000002500003155';

// Insufficient funds
const testCardInsufficient = '4000000000009995';
```

### 2. Test Scenarios
- **Successful payments**: Test with valid cards
- **Failed payments**: Test with declined cards
- **3D Secure**: Test with authentication required
- **Webhook testing**: Test webhook delivery
- **Error handling**: Test error scenarios

### 3. Sandbox Testing
- **Stripe CLI**: Use Stripe CLI for local testing
- **Webhook testing**: Test webhooks locally
- **Event simulation**: Simulate various events
- **Integration testing**: Test end-to-end flows

## 🚀 Deployment

### 1. Production Setup
- **Environment variables**: Set production environment variables
- **SSL certificates**: Ensure HTTPS is enabled
- **Webhook endpoints**: Configure production webhook URLs
- **Monitoring**: Set up production monitoring

### 2. Go-Live Checklist
- [ ] API keys configured
- [ ] Webhook endpoints tested
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Error handling tested
- [ ] Performance optimized
- [ ] Security reviewed
- [ ] Documentation updated

## 📚 Additional Resources

- [Stripe API v2 Documentation](https://docs.stripe.com/api-v2-overview)
- [Stripe.js ES Module](https://docs.stripe.com/sdks/stripejs-esmodule)
- [React Stripe.js](https://docs.stripe.com/sdks/stripejs-react)
- [Stripe Testing Guide](https://docs.stripe.com/testing)
- [Stripe Security Best Practices](https://docs.stripe.com/security)

## 🆘 Support

If you encounter any issues:

1. **Check the logs**: Review server and client logs
2. **Verify configuration**: Ensure all environment variables are set
3. **Test webhooks**: Use Stripe CLI to test webhooks
4. **Check API status**: Visit [Stripe Status](https://status.stripe.com/)
5. **Contact support**: Reach out to Stripe support if needed

## 🔄 Updates

This integration is regularly updated to include the latest Stripe features:

- **API v2 support**: Latest API version
- **Enhanced security**: Improved security measures
- **Better error handling**: More robust error handling
- **Performance optimization**: Faster payment processing
- **New payment methods**: Support for latest payment methods

---

**Last updated**: December 2024
**Stripe API Version**: 2024-09-30.acacia
**React Stripe.js Version**: Latest
