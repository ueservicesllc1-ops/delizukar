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
    pickupDesc: 'Order your favorite cookies online and pick them up locally in Clifton, New Jersey.',
    pickupSubtext: 'Serving Clifton, Paterson, Garfield, and nearby New Jersey areas.',
    pickupButton: 'SHOP LOCAL PICKUP',
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
    pickupDesc: 'Ordena tus galletas favoritas online y recógelas localmente en Clifton, New Jersey.',
    pickupSubtext: 'Sirviendo a Clifton, Paterson, Garfield y áreas cercanas de New Jersey.',
    pickupButton: 'COMPRAR CON RECOGIDA LOCAL',
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


  const options = [
    {
      key: 'pickup',
      Icon: Storefront,
      title: t.pickupTitle,
      desc: t.pickupDesc,
      sub: t.pickupSubtext,
      button: t.pickupButton,
      SubIcon: Place
    },
    {
      key: 'shipping',
      Icon: LocalShipping,
      title: t.shippingTitle,
      desc: t.shippingDesc,
      sub: t.shippingSubtext,
      button: t.shippingButton,
      badge: t.shippingBadge,
      badgeColor: '#c8626d',
      SubIcon: LocalShipping
    }
  ];

  const langBtnSx = (active) => ({
    minWidth: 30,
    height: 22,
    px: 0.8,
    fontSize: '0.7rem',
    fontWeight: active ? 800 : 600,
    borderRadius: '999px',
    backgroundColor: active ? '#c8626d' : 'transparent',
    color: active ? '#ffffff' : '#666',
    '&:hover': { backgroundColor: active ? '#b5555a' : 'rgba(200, 98, 109, 0.08)' },
    transition: 'all 0.2s ease',
    lineHeight: 1
  });

  return (
    <Dialog
      open={isModalOpen}
      onClose={closeModal}
      maxWidth={false}
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
          width: { xs: 'calc(100% - 24px)', sm: 560 },
          maxWidth: '100%',
          maxHeight: 'calc(100% - 24px)',
          m: { xs: 1.5, sm: 2 },
          borderRadius: { xs: '18px', sm: '22px' },
          background: 'linear-gradient(180deg, #fffaf7 0%, #ffffff 100%)',
          boxShadow: '0 24px 60px rgba(100, 30, 40, 0.25)',
          border: '1px solid rgba(200, 98, 109, 0.15)',
          position: 'relative',
          overflowY: 'auto',
          overflowX: 'hidden'
        }
      }}
    >
      {/* Selector de Idioma */}
      <Box
        role="group"
        aria-label={t.selectLanguageAria}
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          border: '1.5px solid rgba(200, 98, 109, 0.28)',
          borderRadius: '999px',
          p: '2px',
          zIndex: 10
        }}
      >
        <Translate sx={{ fontSize: 15, color: '#c8626d', ml: 0.6, mr: 0.3 }} />
        <Button size="small" onClick={() => handleLanguageChange('en')} sx={langBtnSx(language === 'en')}>
          EN
        </Button>
        <Button size="small" onClick={() => handleLanguageChange('es')} sx={langBtnSx(language !== 'en')}>
          ES
        </Button>
      </Box>

      {/* Botón cerrar */}
      <IconButton
        aria-label={t.closeAria}
        onClick={closeModal}
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          color: '#888',
          backgroundColor: '#f5f5f5',
          width: 30,
          height: 30,
          '&:hover': { backgroundColor: '#c8626d', color: '#fff', transform: 'rotate(90deg)' },
          transition: 'all 0.25s ease',
          zIndex: 10
        }}
      >
        <Close sx={{ fontSize: 18 }} />
      </IconButton>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 5, sm: 4 } }}>
        {/* Solo logo */}
        <Box sx={{ textAlign: 'center', mb: { xs: 2, sm: 2.5 } }}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Box
              component="img"
              src="/LOGO.png"
              alt="DeliZukar"
              sx={{
                height: { xs: 52, sm: 64 },
                maxWidth: '70%',
                objectFit: 'contain',
                width: 'auto',
                mx: 'auto',
                mb: 1,
                display: 'block'
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: '#666',
                maxWidth: 420,
                mx: 'auto',
                fontSize: { xs: '0.82rem', sm: '0.9rem' },
                lineHeight: 1.4
              }}
            >
              {t.welcomeSubtitle}
            </Typography>
          </motion.div>
        </Box>

        {/* Opciones */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: { xs: 1.5, sm: 2 },
            alignItems: 'stretch'
          }}
        >
          {options.map(({ key, Icon, title, desc, sub, button, badge, badgeColor, SubIcon }, i) => (
            <Box
              key={key}
              component={motion.div}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 + i * 0.07 }}
              whileHover={{ y: -2 }}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minWidth: 0,
                borderRadius: '16px',
                p: { xs: 1.6, sm: 2 },
                backgroundColor: modality === key ? '#fff7f7' : '#ffffff',
                border: modality === key ? '2px solid #c8626d' : '1.5px solid #f0d5d8',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
                transition: 'border-color 0.25s ease'
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                      borderRadius: '12px',
                      backgroundColor: alpha('#c8626d', 0.12),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#c8626d'
                    }}
                  >
                    <Icon sx={{ fontSize: 24 }} />
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: '"Playfair Display", serif',
                      fontWeight: 700,
                      color: '#2c1e21',
                      fontSize: { xs: '0.9rem', sm: '0.95rem' },
                      lineHeight: 1.2,
                      overflowWrap: 'anywhere'
                    }}
                  >
                    {title}
                  </Typography>
                </Box>

                {(badge || modality === key) && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mb: 1 }}>
                  {badge && (
                  <Chip
                    label={badge}
                    size="small"
                    sx={{
                      backgroundColor: badgeColor,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.62rem',
                      letterSpacing: '0.4px',
                      height: 20
                    }}
                  />
                  )}
                  {modality === key && (
                    <Chip
                      icon={<CheckCircle sx={{ fontSize: '12px !important', color: '#c8626d !important' }} />}
                      label={t.currentlyActive}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: '#c8626d', color: '#c8626d', fontWeight: 600, fontSize: '0.62rem', height: 20 }}
                    />
                  )}
                </Box>
                )}

                <Typography variant="body2" sx={{ color: '#444', fontSize: '0.8rem', lineHeight: 1.45, mb: 1 }}>
                  {desc}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.6, color: '#775257' }}>
                  <SubIcon sx={{ fontSize: 14, color: '#c8626d', flexShrink: 0, mt: '2px' }} />
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', lineHeight: 1.35 }}>
                    {sub}
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                fullWidth
                onClick={() => handleSelect(key)}
                endIcon={<ArrowForward sx={{ fontSize: '16px !important' }} />}
                sx={{
                  mt: 1.6,
                  py: 0.9,
                  backgroundColor: '#c8626d',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: { xs: '0.78rem', sm: '0.8rem' },
                  borderRadius: '12px',
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(200, 98, 109, 0.3)',
                  '&:hover': { backgroundColor: '#b5555a', boxShadow: '0 6px 16px rgba(200, 98, 109, 0.4)' }
                }}
              >
                {button}
              </Button>
            </Box>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ShoppingExperienceModal;
