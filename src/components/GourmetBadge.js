import React, { useState, useEffect } from 'react';
import { Box, Chip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const GourmetBadge = () => {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: '20%', left: '20%' });

  const label = language === 'en' 
    ? "200g Gourmet NY-Style Cookies 🍪" 
    : "Galletas Gourmet de 200g Estilo NY 🍪";

  const getRandomPosition = () => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    
    // Márgenes de seguridad (px)
    const marginY = 120; // Evitar el header y el footer
    // Estimación del ancho del chip para evitar desbordamiento lateral
    const estChipWidth = vw < 600 ? 250 : 350; // Aumentado para mayor seguridad
    const safeMarginX = (estChipWidth / 2) + 20;
    
    // Top aleatorio en zona segura
    const availableHeight = vh - (marginY * 2);
    const top = Math.floor(Math.random() * Math.max(availableHeight, 100)) + marginY;
    
    let left;
    
    if (vw < 600) {
      // Lógica para Móviles: Rango más libre pero con márgenes laterales estrictos
      const availableWidth = vw - (safeMarginX * 2);
      if (availableWidth > 0) {
        left = Math.floor(Math.random() * availableWidth) + safeMarginX;
      } else {
        left = vw / 2;
      }
    } else {
      // Lógica para Desktop: Aparece preferiblemente en los laterales
      const sideLimit = Math.min(300, vw / 2 - 100);
      const isLeft = Math.random() > 0.5;
      
      if (isLeft) {
        const range = sideLimit - safeMarginX;
        left = Math.floor(Math.random() * Math.max(range, 20)) + safeMarginX;
      } else {
        const range = sideLimit - safeMarginX;
        left = vw - (Math.floor(Math.random() * Math.max(range, 20)) + safeMarginX);
      }
    }
    
    return { top: `${top}px`, left: `${left}px` };
  };

  useEffect(() => {
    const cycleAnimation = () => {
      setPosition(getRandomPosition());
      setIsVisible(true);

      setTimeout(() => {
        setIsVisible(false);
        const nextDelay = Math.floor(Math.random() * (20000 - 8000 + 1)) + 8000;
        setTimeout(cycleAnimation, nextDelay);
      }, 6000);
    };

    const initialTimer = setTimeout(cycleAnimation, 3000);
    return () => clearTimeout(initialTimer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <Box
          component={motion.div}
          initial={{ opacity: 0, scale: 0, rotate: -15 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            rotate: 0,
            y: [0, -10, 0]
          }}
          exit={{ opacity: 0, scale: 0, rotate: 15 }}
          transition={{ 
            duration: 0.5,
            y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          sx={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            zIndex: 99999,
            pointerEvents: 'auto',
            transform: 'translate(-50%, -50%) !important'
          }}
        >
          <Chip
            label={label}
            sx={{
              backgroundColor: '#c8626d',
              color: 'white',
              fontWeight: 900,
              fontSize: { xs: '0.75rem', md: '0.9rem' },
              height: { xs: 36, md: 45 },
              px: 2,
              borderRadius: '25px',
              boxShadow: '0 12px 30px rgba(200, 98, 109, 0.5)',
              border: '2px solid white',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              '&:hover': {
                backgroundColor: '#b5555a',
                transform: 'scale(1.05)'
              },
              '& .MuiChip-label': {
                px: 2
              }
            }}
          />
        </Box>
      )}
    </AnimatePresence>
  );
};

export default GourmetBadge;
