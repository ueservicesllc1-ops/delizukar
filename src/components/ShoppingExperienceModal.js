import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import {
  Close,
  Storefront,
  LocalShipping,
  CheckCircle,
  Place,
  ArrowForward,
  Translate
} from '@mui/icons-material';
import { useShoppingExperience } from '../context/ShoppingExperienceContext';
import { useLanguage } from '../context/LanguageContext';
import { stopAutoTranslate, startAutoTranslate, applyTranslations } from '../utils/applyTranslations';

const MODAL_TEXTS = {
  en: {
    welcomeSubtitle: 'Please select how you would like to receive your freshly baked cookies:',
    pickupTitle: 'LOCAL PICKUP — CLIFTON, NJ',
    pickupDesc: 'Order your favorite cookies online and pick them up locally in Clifton, New Jersey. No shipping fees!',
    pickupSubtext: 'Serving Clifton, Paterson, Garfield, and nearby New Jersey areas.',
    pickupButton: 'SHOP LOCAL PICKUP',
    pickupBadge: 'NO SHIPPING FEES',
    shippingTitle: 'SHIPPING — DELIVERED TO YOU',
    shippingDesc: 'Shop your favorite cookies and have them delivered directly to your door.',
    shippingSubtext: 'Carefully packaged and shipped fresh across the United States.',
    shippingButton: 'SHOP WITH SHIPPING',
    shippingBadge: 'DELIVERED TO YOU',
    currentlyActive: 'Currently selected',
    closeAria: 'Close experience selector',
    selectLanguageAria: 'Select language'
  },
  es: {
    welcomeSubtitle: 'Por favor selecciona cómo deseas recibir tus deliciosas galletas recién horneadas:',
    pickupTitle: 'LOCAL PICKUP — CLIFTON, NJ',
    pickupDesc: 'Ordena tus galletas favoritas online y recógelas localmente en Clifton, New Jersey. ¡Sin costo de envío!',
    pickupSubtext: 'Sirviendo a Clifton, Paterson, Garfield y áreas cercanas de New Jersey.',
    pickupButton: 'COMPRAR CON RECOGIDA LOCAL',
    pickupBadge: 'SIN COSTO DE ENVÍO',
    shippingTitle: 'SHIPPING — DELIVERED TO YOU',
    shippingDesc: 'Compra tus galletas favoritas y recíbelas directamente en la puerta de tu casa.',
    shippingSubtext: 'Cuidadosamente empacadas y enviadas frescas a todo Estados Unidos.',
    shippingButton: 'COMPRAR CON ENVÍO',
    shippingBadge: 'DIRECTO A TU PUERTA',
    currentlyActive: 'Actualmente seleccionada',
    closeAria: 'Cerrar selector de experiencia',
    selectLanguageAria: 'Seleccionar idioma'
  }
};

const ShoppingExperienceModal = () => {
  const { isModalOpen, closeModal, setModality, modality } = useShoppingExperience();
  const { language, setLanguage } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const t = MODAL_TEXTS[language === 'en' ? 'en' : 'es'];

  const handleSelect = (mode) => {
    setModality(mode);
  };

  const handleLanguageChange = (newLang) => {
    if (newLang === language) return;
    setLanguage(newLang);
    if (newLang === 'es') {
      stopAutoTranslate();
    } else {
      try {
        applyTranslations(newLang, 'es');
        startAutoTranslate(newLang, 'es');
      } catch (err) {
        console.warn('Translation warning:', err);
      }
    }
  };

  return (
    <Dialog
      open={isModalOpen}
      onClose={closeModal}
      maxWidth="md"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(30, 15, 18, 0.65)',
            backdropFilter: 'blur(8px)'
          }
        }
      }}
      PaperProps={{
        sx: {
          borderRadius: { xs: '20px', md: '28px' },
          p: { xs: 2.5, sm: 4 },
          background: 'linear-gradient(180deg, #fffaf7 0%, #ffffff 100%)',
          boxShadow: '0 24px 60px rgba(100, 30, 40, 0.25)',
          border: '1px solid rgba(200, 98, 109, 0.15)',
          position: 'relative',
          overflow: 'visible',
          m: { xs: 2, sm: 3 }
        }
      }}
    >
      {/* Selector de Idioma (Top-Left) */}
      <Box
        role="group"
        aria-label={t.selectLanguageAria}
        sx={{
          position: 'absolute',
          top: { xs: 12, md: 16 },
          left: { xs: 12, md: 16 },
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          border: '1.5px solid rgba(200, 98, 109, 0.28)',
          borderRadius: '999px',
          p: '2px',
          boxShadow: '0 2px 8px rgba(200, 98, 109, 0.1)',
          zIndex: 10
        }}
      >
        <Translate
          sx={{
            fontSize: { xs: 15, sm: 17 },
            color: '#c8626d',
            ml: 0.8,
            mr: 0.3
          }}
        />
        <Button
          size="small"
          onClick={() => handleLanguageChange('en')}
          sx={{
            minWidth: { xs: 32, sm: 36 },
            height: { xs: 24, sm: 26 },
            px: { xs: 0.6, sm: 1 },
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            fontWeight: language === 'en' ? 800 : 600,
            borderRadius: '999px',
            backgroundColor: language === 'en' ? '#c8626d' : 'transparent',
            color: language === 'en' ? '#ffffff' : '#666',
            boxShadow: language === 'en' ? '0 2px 6px rgba(200, 98, 109, 0.3)' : 'none',
            '&:hover': {
              backgroundColor: language === 'en' ? '#b5555a' : 'rgba(200, 98, 109, 0.08)'
            },
            transition: 'all 0.2s ease',
            lineHeight: 1
          }}
        >
          EN
        </Button>
        <Button
          size="small"
          onClick={() => handleLanguageChange('es')}
          sx={{
            minWidth: { xs: 32, sm: 36 },
            height: { xs: 24, sm: 26 },
            px: { xs: 0.6, sm: 1 },
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            fontWeight: language === 'es' ? 800 : 600,
            borderRadius: '999px',
            backgroundColor: language === 'es' ? '#c8626d' : 'transparent',
            color: language === 'es' ? '#ffffff' : '#666',
            boxShadow: language === 'es' ? '0 2px 6px rgba(200, 98, 109, 0.3)' : 'none',
            '&:hover': {
              backgroundColor: language === 'es' ? '#b5555a' : 'rgba(200, 98, 109, 0.08)'
            },
            transition: 'all 0.2s ease',
            lineHeight: 1
          }}
        >
          ES
        </Button>
      </Box>

      {/* Botón cerrar */}
      <IconButton
        aria-label={t.closeAria}
        onClick={closeModal}
        sx={{
          position: 'absolute',
          top: { xs: 12, md: 16 },
          right: { xs: 12, md: 16 },
          color: '#888',
          backgroundColor: '#f5f5f5',
          width: 36,
          height: 36,
          '&:hover': {
            backgroundColor: '#c8626d',
            color: '#fff',
            transform: 'rotate(90deg)'
          },
          transition: 'all 0.25s ease',
          zIndex: 10
        }}
      >
        <Close sx={{ fontSize: 20 }} />
      </IconButton>

      <DialogContent sx={{ p: { xs: 1, sm: 2 }, pt: { xs: 3, sm: 2 }, overflow: 'visible' }}>
        {/* Logo and Intro Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 }, mt: { xs: 1.5, sm: 0 } }}>
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Box
              component="img"
              src="/LOGO.png"
              alt="DeliZukar"
              sx={{
                height: { xs: 65, md: 85 },
                width: 'auto',
                mx: 'auto',
                mb: 1.5,
                display: 'block'
              }}
            />
            <Typography
              variant="h4"
              sx={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 700,
                color: '#c8626d',
                fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.1rem' },
                mb: 1
              }}
            >
              DeliZukar Bakery
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#666',
                maxWidth: '560px',
                mx: 'auto',
                fontSize: { xs: '0.9rem', md: '1.02rem' },
                lineHeight: 1.5
              }}
            >
              {t.welcomeSubtitle}
            </Typography>
          </motion.div>
        </Box>

        {/* Options Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: { xs: 2.5, md: 3 },
            alignItems: 'stretch'
          }}
        >
          {/* OPCIÓN 1: LOCAL PICKUP */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            whileHover={{ y: -4, boxShadow: '0 16px 36px rgba(200, 98, 109, 0.18)' }}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderRadius: '20px',
              p: { xs: 2.5, sm: 3 },
              backgroundColor: modality === 'pickup' ? '#fff7f7' : '#ffffff',
              border: modality === 'pickup' ? '2.5px solid #c8626d' : '1.5px solid #f0d5d8',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
              position: 'relative',
              transition: 'border-color 0.25s ease'
            }}
          >
            {/* Badge superior */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Chip
                label={t.pickupBadge}
                size="small"
                sx={{
                  backgroundColor: '#4caf50',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  letterSpacing: '0.5px',
                  height: 24
                }}
              />
              {modality === 'pickup' && (
                <Chip
                  icon={<CheckCircle sx={{ fontSize: '14px !important', color: '#c8626d !important' }} />}
                  label={t.currentlyActive}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: '#c8626d',
                    color: '#c8626d',
                    fontWeight: 600,
                    fontSize: '0.7rem'
                  }}
                />
              )}
            </Box>

            {/* Icono + Títulos */}
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '16px',
                  backgroundColor: alpha('#c8626d', 0.12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  color: '#c8626d'
                }}
              >
                <Storefront sx={{ fontSize: 32 }} />
              </Box>

              <Typography
                variant="h6"
                sx={{
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 700,
                  color: '#2c1e21',
                  fontSize: { xs: '1.15rem', md: '1.25rem' },
                  letterSpacing: '0.3px',
                  mb: 1.2
                }}
              >
                {t.pickupTitle}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: '#444',
                  fontSize: '0.92rem',
                  lineHeight: 1.55,
                  mb: 1.5
                }}
              >
                {t.pickupDesc}
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.8,
                  backgroundColor: '#fbf5f2',
                  p: 1.2,
                  borderRadius: '10px',
                  border: '1px dashed #e8c4c8'
                }}
              >
                <Place sx={{ fontSize: 18, color: '#c8626d', flexShrink: 0 }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: '#775257',
                    fontWeight: 500,
                    fontSize: '0.78rem',
                    lineHeight: 1.35
                  }}
                >
                  {t.pickupSubtext}
                </Typography>
              </Box>
            </Box>

            {/* Botón de Selección */}
            <Button
              variant="contained"
              fullWidth
              onClick={() => handleSelect('pickup')}
              endIcon={<ArrowForward />}
              sx={{
                mt: 2,
                py: 1.4,
                backgroundColor: '#c8626d',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: { xs: '0.9rem', md: '0.95rem' },
                borderRadius: '14px',
                textTransform: 'none',
                letterSpacing: '0.4px',
                boxShadow: '0 6px 18px rgba(200, 98, 109, 0.35)',
                '&:hover': {
                  backgroundColor: '#b5555a',
                  boxShadow: '0 8px 24px rgba(200, 98, 109, 0.45)'
                }
              }}
            >
              {t.pickupButton}
            </Button>
          </Box>

          {/* OPCIÓN 2: SHIPPING */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            whileHover={{ y: -4, boxShadow: '0 16px 36px rgba(200, 98, 109, 0.18)' }}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderRadius: '20px',
              p: { xs: 2.5, sm: 3 },
              backgroundColor: modality === 'shipping' ? '#fff7f7' : '#ffffff',
              border: modality === 'shipping' ? '2.5px solid #c8626d' : '1.5px solid #f0d5d8',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
              position: 'relative',
              transition: 'border-color 0.25s ease'
            }}
          >
            {/* Badge superior */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Chip
                label={t.shippingBadge}
                size="small"
                sx={{
                  backgroundColor: '#c8626d',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  letterSpacing: '0.5px',
                  height: 24
                }}
              />
              {modality === 'shipping' && (
                <Chip
                  icon={<CheckCircle sx={{ fontSize: '14px !important', color: '#c8626d !important' }} />}
                  label={t.currentlyActive}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: '#c8626d',
                    color: '#c8626d',
                    fontWeight: 600,
                    fontSize: '0.7rem'
                  }}
                />
              )}
            </Box>

            {/* Icono + Títulos */}
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '16px',
                  backgroundColor: alpha('#c8626d', 0.12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  color: '#c8626d'
                }}
              >
                <LocalShipping sx={{ fontSize: 32 }} />
              </Box>

              <Typography
                variant="h6"
                sx={{
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 700,
                  color: '#2c1e21',
                  fontSize: { xs: '1.15rem', md: '1.25rem' },
                  letterSpacing: '0.3px',
                  mb: 1.2
                }}
              >
                {t.shippingTitle}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: '#444',
                  fontSize: '0.92rem',
                  lineHeight: 1.55,
                  mb: 1.5
                }}
              >
                {t.shippingDesc}
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.8,
                  backgroundColor: '#fbf5f2',
                  p: 1.2,
                  borderRadius: '10px',
                  border: '1px dashed #e8c4c8'
                }}
              >
                <LocalShipping sx={{ fontSize: 18, color: '#c8626d', flexShrink: 0 }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: '#775257',
                    fontWeight: 500,
                    fontSize: '0.78rem',
                    lineHeight: 1.35
                  }}
                >
                  {t.shippingSubtext}
                </Typography>
              </Box>
            </Box>

            {/* Botón de Selección */}
            <Button
              variant="contained"
              fullWidth
              onClick={() => handleSelect('shipping')}
              endIcon={<ArrowForward />}
              sx={{
                mt: 2,
                py: 1.4,
                backgroundColor: '#c8626d',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: { xs: '0.9rem', md: '0.95rem' },
                borderRadius: '14px',
                textTransform: 'none',
                letterSpacing: '0.4px',
                boxShadow: '0 6px 18px rgba(200, 98, 109, 0.35)',
                '&:hover': {
                  backgroundColor: '#b5555a',
                  boxShadow: '0 8px 24px rgba(200, 98, 109, 0.45)'
                }
              }}
            >
              {t.shippingButton}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ShoppingExperienceModal;
