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
            ? { xs: 'calc(50% - 6px)', sm: '190px' }
            : { md: '165px', lg: '205px', xl: '240px' },
          maxWidth: isMobile ? '200px' : '250px',
          borderRadius: { xs: '8px', sm: '12px', md: '14px' },
          overflow: 'hidden',
          backgroundColor: '#faebeb',
          border: isSelected ? '2px solid #c8626d' : '2px solid #ffffff',
          boxShadow: isSelected
            ? '0 6px 18px rgba(200, 98, 109, 0.45), 0 0 0 2px #c8626d'
            : '0 4px 12px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(200, 98, 109, 0.15)',
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
            top: { xs: 2, sm: 4 },
            right: { xs: 2, sm: 4 },
            zIndex: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            color: '#c8626d',
            padding: { xs: '2px', sm: '3px' },
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            '&:hover': {
              backgroundColor: '#c8626d',
              color: '#ffffff',
              transform: 'scale(1.1)'
            },
            transition: 'all 0.2s ease'
          }}
          title={isEn ? 'Close' : 'Cerrar'}
        >
          <Close sx={{ fontSize: { xs: 11, sm: 13, md: 15 } }} />
        </IconButton>

        {/* Badge si está seleccionado */}
        {isSelected && (
          <Chip
            icon={<CheckCircle sx={{ fontSize: '11px !important', color: '#ffffff !important' }} />}
            label={activeLabel}
            size="small"
            sx={{
              position: 'absolute',
              bottom: { xs: 3, sm: 5 },
              left: { xs: 3, sm: 5 },
              zIndex: 9,
              backgroundColor: '#c8626d',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: { xs: '0.5rem', sm: '0.62rem', md: '0.68rem' },
              height: { xs: 16, sm: 20 },
              px: { xs: 0.2, sm: 0.6 },
              boxShadow: '0 2px 8px rgba(200, 98, 109, 0.4)'
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
