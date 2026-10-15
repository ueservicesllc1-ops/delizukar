import React from 'react';
import { Box, Typography } from '@mui/material';
import { Storefront } from '@mui/icons-material';
import { useLanguage } from '../context/LanguageContext';
import { getPickupText } from '../utils/pickup';

/**
 * Aviso fijo de la política de recogida (sin devoluciones).
 * variant="policy" -> bloque de política (Envíos / Términos)
 * variant="faq"    -> pregunta + respuesta (FAQ)
 */
const PickupPolicyNotice = ({ variant = 'policy' }) => {
  const { language } = useLanguage();
  const text = getPickupText(language);

  return (
    <Box sx={{ maxWidth: '800px', mx: 'auto', px: 2, mt: 4 }}>
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          alignItems: 'flex-start',
          p: 2,
          borderRadius: '12px',
          backgroundColor: '#fff4e5',
          borderLeft: '4px solid #f0a030'
        }}
      >
        <Storefront sx={{ color: '#c8626d', mt: '2px' }} />
        <Box>
          <Typography sx={{ fontWeight: 700, color: '#8a5a00', mb: 0.5 }}>
            {variant === 'faq' ? text.faqQuestion : text.policyTitle}
          </Typography>
          <Typography variant="body2" sx={{ color: '#8a5a00', lineHeight: 1.6 }}>
            {variant === 'faq' ? text.faqAnswer : text.policyText}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default PickupPolicyNotice;
