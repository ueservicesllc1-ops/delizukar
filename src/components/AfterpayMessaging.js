import React from 'react';
import PaymentMethodMessaging from './PaymentMethodMessaging';

const AfterpayMessaging = ({ amount, showDetails = true }) => {
  return (
    <PaymentMethodMessaging 
      amount={amount} 
      currency="USD" 
      countryCode="US" 
    />
  );
};

export default AfterpayMessaging;
