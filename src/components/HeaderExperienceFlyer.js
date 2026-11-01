import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, IconButton, Typography } from '@mui/material';
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
  const stickerSrc = isPickup ? '/pickup-sticker.png' : '/shipping-sticker.png';
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
            ? { xs: 'calc(50% - 6px)', sm: '135px' }
            : { md: '112px', lg: '124px', xl: '132px' },
          maxWidth: isMobile ? '160px' : '140px',
          borderRadius: { xs: '10px', sm: '12px' },
          p: { xs: '6px 6px 5px', md: '5px 8px 5px', lg: '6px 10px 6px' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: { xs: 0.4, md: 0.5 },
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

        {/* Indicador superior si está seleccionado */}
        {isSelected && (
          <Box
            sx={{
              position: 'absolute',
              top: 2,
              left: 3,
              zIndex: 9,
              display: 'flex',
              alignItems: 'center',
              gap: 0.3,
              backgroundColor: '#c8626d',
              color: '#ffffff',
              borderRadius: '999px',
              px: { xs: 0.5, md: 0.6 },
              py: '1px',
              boxShadow: '0 1px 4px rgba(200, 98, 109, 0.3)'
            }}
          >
            <CheckCircle sx={{ fontSize: '9px !important', color: '#ffffff !important' }} />
            <Typography
              component="span"
              sx={{
                fontSize: { xs: '0.45rem', md: '0.48rem' },
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: '0.2px'
              }}
            >
              {activeLabel}
            </Typography>
          </Box>
        )}

        {/* Ilustración Grande (Carterita en Pickup / Camioncito en Shipping) */}
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pt: isSelected ? { xs: 1.2, md: 1.4 } : { xs: 0.4, md: 0.6 },
            pb: 0.2,
            minHeight: { xs: '38px', md: '42px', lg: '46px' }
          }}
        >
          <Box
            component="img"
            src={stickerSrc}
            alt={altText}
            sx={{
              height: { xs: 36, sm: 40, md: 38, lg: 44 },
              width: 'auto',
              maxWidth: '92%',
              objectFit: 'contain',
              display: 'block',
              filter: 'drop-shadow(0 2px 4px rgba(200, 98, 109, 0.18))',
              transition: 'transform 0.25s ease'
            }}
          />
        </Box>

        {/* Texto Pequeño abajo (PICK UP / SHIPPING) */}
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isSelected ? '#c8626d' : 'rgba(200, 98, 109, 0.12)',
            color: isSelected ? '#ffffff' : '#c8626d',
            border: isSelected ? 'none' : '1px solid rgba(200, 98, 109, 0.25)',
            borderRadius: '999px',
            py: { xs: '2px', md: '2px', lg: '2.5px' },
            px: 1,
            boxShadow: isSelected ? '0 2px 6px rgba(200, 98, 109, 0.35)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: '0.58rem', sm: '0.62rem', md: '0.62rem', lg: '0.68rem' },
              fontWeight: 800,
              letterSpacing: { xs: '0.5px', md: '0.7px' },
              lineHeight: 1.1,
              textAlign: 'center',
              textTransform: 'uppercase'
            }}
          >
            {labelText}
          </Typography>
        </Box>
      </Box>
    </AnimatePresence>
  );
};

export default HeaderExperienceFlyer;
