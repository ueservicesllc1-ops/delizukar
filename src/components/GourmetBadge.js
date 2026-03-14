import React, { useState, useEffect } from 'react';
import { Box, Chip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

const GourmetBadge = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: '20%', left: '20%' });

  const getRandomPosition = () => {
    const margin = 100;
    const sideMargin = 50; // Margen desde el borde
    const sideLimit = 250; // El badge solo aparecerá en los primeros o últimos 250px de ancho
    
    // Top aleatorio evitando el header
    const top = Math.floor(Math.random() * (window.innerHeight - margin * 2)) + margin;
    
    // Decidir aleatoriamente si aparece a la izquierda o a la derecha
    const isLeft = Math.random() > 0.5;
    let left;
    
    if (isLeft) {
      // Zona Izquierda
      left = Math.floor(Math.random() * (sideLimit - sideMargin)) + sideMargin;
    } else {
      // Zona Derecha
      left = window.innerWidth - (Math.floor(Math.random() * (sideLimit - sideMargin)) + sideMargin);
    }
    
    return { top: `${top}px`, left: `${left}px` };
  };

  useEffect(() => {
    const cycleAnimation = () => {
      // 1. Elegir posición aleatoria
      setPosition(getRandomPosition());
      
      // 2. Aparecer
      setIsVisible(true);

      // 3. Quedarse visible por 6 segundos
      setTimeout(() => {
        setIsVisible(false);
        
        // 4. Esperar un tiempo aleatorio entre 8 y 20 segundos antes de volver a empezar
        const nextDelay = Math.floor(Math.random() * (20000 - 8000 + 1)) + 8000;
        setTimeout(cycleAnimation, nextDelay);
      }, 6000);
    };

    // Iniciar el primer ciclo con un retraso inicial
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
            y: [0, -10, 0] // Sutil flotación
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
            zIndex: 99999, // Super arriba
            pointerEvents: 'auto', // Permitir click si se desea
            transform: 'translate(-50%, -50%) !important' // Centrar en el punto elegido
          }}
        >
          <Chip
            label="200g Gourmet NY-Style Cookies 🍪"
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
