import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useShoppingExperience } from '../context/ShoppingExperienceContext';
import { useLanguage } from '../context/LanguageContext';

export const HeaderExperienceFlyer = ({ type = 'pickup', isMobile = false }) => {
  const { modality, setModality } = useShoppingExperience();
  const { language } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  const isEn = language === 'en';
  const isSelected = modality === type;
  const isPickup = type === 'pickup';
  const stickerSrc = isPickup ? '/pickup-sticker-text.jpg' : '/shipping-sticker-text.jpg';
  const altText = isPickup ? 'Local Pick Up - Delizukar' : 'Delivery Shipping - Delizukar';
  const labelText = isPickup ? 'PICK UP' : 'SHIPPING';
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
        initial={{ opacity: 0, scale: 0.92, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={`${labelText} - ${isSelected ? activeLabel : (isEn ? 'Click to select' : 'Clic para seleccionar')}`}
        sx={{
          cursor: 'pointer',
          position: 'relative',
          width: isMobile
            ? { xs: '76px', sm: '92px' }
            : { md: '106px', lg: '120px', xl: '128px' },
          maxWidth: isMobile ? '100px' : '140px',
          borderRadius: { xs: '10px', sm: '12px' },
          aspectRatio: '1 / 1',
          overflow: 'hidden',
          p: 0,
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'stretch',
          background: isSelected
            ? 'linear-gradient(180deg, #fffcfb 0%, #fae8e8 100%)'
            : 'linear-gradient(180deg, #ffffff 0%, #faf0ef 100%)',
          border: isSelected ? '2px solid #c8626d' : '1.5px solid rgba(200, 98, 109, 0.25)',
          boxShadow: isSelected
            ? '0 4px 14px rgba(200, 98, 109, 0.38), 0 0 0 1px #c8626d'
            : '0 2px 7px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(200, 98, 109, 0.08)',
          transition: 'all 0.25s ease',
          flexShrink: 0,
          userSelect: 'none'
        }}
      >
        {/* Botón cerrar */}
        <IconButton
          size="small"
          onClick={handleClose}
          aria-label={isEn ? `Close ${labelText}` : `Cerrar ${labelText}`}
          sx={{
            position: 'absolute',
            top: 2,
            right: 2,
            zIndex: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            color: '#c8626d',
            padding: '1.5px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            '&:hover': {
              backgroundColor: '#c8626d',
              color: '#ffffff',
              transform: 'scale(1.1)'
            },
            transition: 'all 0.2s ease'
          }}
          title={isEn ? 'Close' : 'Cerrar'}
        >
          <Close sx={{ fontSize: { xs: 10, sm: 11, md: 11 } }} />
        </IconButton>

        {/* Ilustración a pleno tamaño dentro del marco */}
        <Box
          component="img"
          src={stickerSrc}
          alt={altText}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            mixBlendMode: 'multiply',
            transform: `scale(${isPickup ? 1.14 : 1.06})`,
            transformOrigin: isPickup ? '55% 52%' : '50% 52%',
            transition: 'transform 0.25s ease'
          }}
        />
      </Box>
    </AnimatePresence>
  );
};

export default HeaderExperienceFlyer;
