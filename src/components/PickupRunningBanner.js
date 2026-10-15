import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PickupRunningBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (dismissed) return null;

  // Distancias basadas en el ancho de pantalla
  // Distancias basadas en el ancho de pantalla (de izquierda a derecha)
  const offscreenLeft = -(windowWidth > 800 ? windowWidth * 0.75 : windowWidth * 0.95);
  const peekLeft1 = offscreenLeft * 0.55;
  const peekHide1 = offscreenLeft * 0.72;
  const peekLeft2 = offscreenLeft * 0.45;
  const offscreenRight = windowWidth > 800 ? windowWidth * 0.85 : windowWidth * 1.1;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: { xs: '32%', sm: '35%', md: '38%' },
        left: '50%',
        zIndex: 9999,
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <motion.div
        initial={{ x: offscreenLeft, opacity: 0, rotate: -12, scale: 0.9 }}
        animate={{
          // Secuencia (de izquierda a derecha):
          // 1. Asomarse jugando desde la izquierda (0% a 30%)
          // 2. Entrar y quedarse en la mitad de la pantalla (40% a 75%)
          // 3. Salir corriendo hacia la derecha (80% a 100%)
          x: [
            offscreenLeft,  // Inicio fuera por la izquierda
            peekLeft1,      // Se asoma jugando
            peekHide1,      // Se esconde un poquito
            peekLeft2,      // Se asoma más jugando
            0,              // Llega a la mitad exacta
            0,              // Se queda en la mitad
            0,              // Sigue en la mitad
            35,             // Toma impulso
            offscreenRight  // Sale corriendo a la derecha y se va
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
            -12
          ],
          rotate: [
            -10,
            12,    // Inclinación juguetona al asomarse desde la izquierda
            -8,
            10,
            0,     // Centrado
            -2,    // Flotando suave
            2,
            -5,    // Impulso
            14     // Inclinado hacia adelante corriendo a la derecha
          ],
          scale: [
            0.85,
            0.92,
            0.88,
            0.95,
            1.05,  // Llega al centro
            1.0,
            1.02,
            0.96,
            1.04
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
          duration: 9.5,
          times: [0, 0.15, 0.22, 0.30, 0.42, 0.58, 0.75, 0.82, 1.0],
          ease: 'easeInOut'
        }}
        onAnimationComplete={() => {
          setDismissed(true);
        }}
        whileHover={{ scale: 1.05 }}
        style={{
          pointerEvents: 'auto',
          cursor: 'pointer',
          position: 'relative'
        }}
        onClick={() => navigate('/faq')}
      >
        <Box
          sx={{
            position: 'relative',
            width: { xs: '310px', sm: '420px', md: '520px' },
            maxWidth: '92vw',
            borderRadius: { xs: '18px', md: '24px' },
            overflow: 'hidden',
            boxShadow: '0 12px 35px rgba(200, 98, 109, 0.45), 0 4px 15px rgba(0,0,0,0.15)',
            border: '3px solid #ffffff',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            backgroundColor: '#faebeb',
            '&:hover': {
              boxShadow: '0 16px 45px rgba(200, 98, 109, 0.6)'
            }
          }}
        >
          {/* Botón cerrar sutil */}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setDismissed(true);
            }}
            sx={{
              position: 'absolute',
              top: 6,
              right: 6,
              zIndex: 10,
              backgroundColor: 'rgba(255,255,255,0.85)',
              color: '#c8626d',
              padding: '3px',
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
