// PayPal Configuration
export const PAYPAL_CONFIG = {
  clientId: "AVB4RgfQ-5QsURuFvjuEozb155zmRaOnMq7K-8gZOQWSMRS2ChXP8YSo_RlLJ8HG9cCJvd7rglAnwS1m",
  currency: "USD",
  intent: "capture", // or "authorize"
  environment: "sandbox", // Change to "production" for live payments
};

// PayPal Button Styles
export const PAYPAL_BUTTON_STYLES = {
  layout: "vertical",
  color: "gold",
  shape: "rect",
  label: "paypal",
  height: 45,
};
