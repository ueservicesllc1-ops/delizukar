import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, IconButton, Chip } from '@mui/material';
import { Close, CheckCircle } from '@mui/icons-material';
import { useShoppingExperience } from '../context/ShoppingExperienceContext';
import { useLanguage } from '../context/LanguageContext';

export const HeaderExperienceFlyer = ({ type = 'pickup', isMobile = false }) => {
  const { modality, setModality } = useShoppingExperience();
  const { language } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  const isEn = language === 'en';
  const isSelected = modality === type;
  const isPickup = type === 'pickup';
  const bannerSrc = isPickup ? '/pickup-banner.png' : '/shipping-banner.png';
  const altText = isPickup ? 'Local Pick Up - Delizukar' : 'Delivery Shipping - Delizukar';
  const activeLabel = isEn ? 'Selected' : 'Seleccionado';

  const handleClick = (e) => {
    e.stopPropagation();
    setModality(type);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <Box
        component={motion.div}
        initial={{ opacity: 0, scale: 0.9, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleClick}
        sx={{
          cursor: 'pointer',
          position: 'relative',
          width: isMobile
            ? { xs: 'calc(50% - 6px)', sm: '140px' }
            : { md: '110px', lg: '128px', xl: '142px' },
          maxWidth: isMobile ? '160px' : '150px',
          borderRadius: { xs: '6px', sm: '8px', md: '10px' },
          overflow: 'hidden',
          backgroundColor: '#faebeb',
          border: isSelected ? '2px solid #c8626d' : '1.5px solid #ffffff',
          boxShadow: isSelected
            ? '0 4px 14px rgba(200, 98, 109, 0.4), 0 0 0 1.5px #c8626d'
            : '0 3px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(200, 98, 109, 0.12)',
          transition: 'all 0.25s ease',
          display: 'block',
          flexShrink: 0
        }}
      >
        {/* Botón cerrar */}
        <IconButton
          size="small"
          onClick={handleClose}
          aria-label={isEn ? `Close ${type}` : `Cerrar ${type}`}
          sx={{
            position: 'absolute',
            top: { xs: 1, sm: 2 },
            right: { xs: 1, sm: 2 },
            zIndex: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            color: '#c8626d',
            padding: '1.5px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            '&:hover': {
              backgroundColor: '#c8626d',
              color: '#ffffff',
              transform: 'scale(1.1)'
            },
            transition: 'all 0.2s ease'
          }}
          title={isEn ? 'Close' : 'Cerrar'}
        >
          <Close sx={{ fontSize: { xs: 10, sm: 11, md: 12 } }} />
        </IconButton>

        {/* Badge si está seleccionado */}
        {isSelected && (
          <Chip
            icon={<CheckCircle sx={{ fontSize: '9px !important', color: '#ffffff !important' }} />}
            label={activeLabel}
            size="small"
            sx={{
              position: 'absolute',
              bottom: { xs: 2, sm: 3 },
              left: { xs: 2, sm: 3 },
              zIndex: 9,
              backgroundColor: '#c8626d',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: { xs: '0.45rem', sm: '0.52rem', md: '0.56rem' },
              height: { xs: 14, sm: 16 },
              px: { xs: 0.2, sm: 0.4 },
              boxShadow: '0 2px 6px rgba(200, 98, 109, 0.4)'
            }}
          />
        )}

        {/* Imagen del Flyer */}
        <Box
          component="img"
          src={bannerSrc}
          alt={altText}
          sx={{
            width: '100%',
            height: 'auto',
            display: 'block'
          }}
        />
      </Box>
    </AnimatePresence>
  );
};

export default HeaderExperienceFlyer;
