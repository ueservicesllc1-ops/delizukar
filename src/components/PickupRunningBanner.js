import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PickupRunningBanner = ({ onFinish }) => {
  const [dismissed, setDismissed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1000
  );
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Garantía de desaparición: tras 9.5s desaparece siempre por completo
  useEffect(() => {
    const timer = setTimeout(() => {
      setDismissed(true);
      if (typeof onFinish === 'function') onFinish();
    }, 9500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  if (dismissed) return null;

  // Distancias seguras para cualquier tamaño de pantalla (móvil y desktop)
  const marginExtra = 350;
  const offscreenLeft = -(windowWidth / 2 + marginExtra);
  const peekLeft1 = -(windowWidth * 0.38);
  const peekHide1 = -(windowWidth * 0.48);
  const peekLeft2 = -(windowWidth * 0.28);
  const offscreenRight = windowWidth / 2 + marginExtra;

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof onFinish === 'function') onFinish();
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <motion.div
        initial={{ x: offscreenLeft, opacity: 0, rotate: -12, scale: 0.85 }}
        animate={{
          // Secuencia (de izquierda a derecha):
          // 1. Asomarse jugando desde la izquierda (0% - 30%)
          // 2. Llegar y quedarse en la mitad exacta (40% - 75%)
          // 3. Tomar impulso y salir corriendo hacia la derecha hasta desaparecer (80% - 100%)
          x: [
            offscreenLeft,  // Inicio completamente fuera por la izquierda
            peekLeft1,      // Se asoma jugando
            peekHide1,      // Se esconde un poquito
            peekLeft2,      // Se asoma más jugando
            0,              // Llega a la mitad exacta (0px = centrado absoluto)
            0,              // Se queda en la mitad
            0,              // Sigue en la mitad
            30,             // Toma impulso hacia atrás
            offscreenRight  // Sale corriendo a la derecha hasta desaparecer
          ],
          y: [
            0,
            -8,
            0,
            -10,
            0,
            -8,
            0,
            -4,
            -14
          ],
          rotate: [
            -10,
            12,    // Inclinación juguetona al asomarse desde la izquierda
            -8,
            10,
            0,     // Centrado
            -2,    // Flotando suave
            2,
            -4,    // Impulso
            14     // Inclinado hacia adelante corriendo hacia la derecha
          ],
          scale: [
            0.85,
            0.92,
            0.88,
            0.95,
            1.04,  // Llega al centro
            1.0,
            1.02,
            0.96,
            1.02
          ],
          opacity: [
            0,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            0
          ]
        }}
        transition={{
          duration: 9.0,
          times: [0, 0.15, 0.22, 0.30, 0.42, 0.58, 0.75, 0.84, 1.0],
          ease: 'easeInOut'
        }}
        onAnimationComplete={handleDismiss}
        whileHover={{ scale: 1.04 }}
        style={{
          pointerEvents: 'auto',
          cursor: 'pointer',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
        onClick={() => navigate('/faq')}
      >
        <Box
          sx={{
            position: 'relative',
            width: { xs: '86vw', sm: '380px', md: '480px' },
            maxWidth: '480px',
            borderRadius: { xs: '16px', md: '22px' },
            overflow: 'hidden',
            boxShadow: '0 12px 35px rgba(200, 98, 109, 0.5), 0 4px 15px rgba(0,0,0,0.2)',
            border: '3px solid #ffffff',
            backgroundColor: '#faebeb'
          }}
        >
          {/* Botón cerrar */}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            sx={{
              position: 'absolute',
              top: 6,
              right: 6,
              zIndex: 10,
              backgroundColor: 'rgba(255,255,255,0.9)',
              color: '#c8626d',
              padding: '4px',
              '&:hover': {
                backgroundColor: '#ffffff',
                transform: 'scale(1.1)'
              }
            }}
            title="Cerrar"
          >
            <Close sx={{ fontSize: 16 }} />
          </IconButton>

          <Box
            component="img"
            src="/pickup-banner.png"
            alt="New Service PICK UP - Delizukar"
            sx={{
              width: '100%',
              height: 'auto',
              display: 'block'
            }}
          />
        </Box>
      </motion.div>
    </Box>
  );
};

export default PickupRunningBanner;
