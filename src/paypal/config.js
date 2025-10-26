// PayPal Configuration
export const PAYPAL_CONFIG = {
  clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID || "sb", // PayPal client ID from environment
  currency: process.env.REACT_APP_PAYPAL_CURRENCY || "USD",
  intent: process.env.REACT_APP_PAYPAL_INTENT || "capture", // or "authorize"
  environment: process.env.REACT_APP_PAYPAL_ENVIRONMENT || "sandbox", // Change to "production" for live payments
};

// PayPal Button Styles
export const PAYPAL_BUTTON_STYLES = {
  layout: "vertical",
  color: "gold",
  shape: "rect",
  label: "paypal",
  height: 45,
};
