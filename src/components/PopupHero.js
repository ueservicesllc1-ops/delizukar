import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Container,
  Chip,
  Divider
} from '@mui/material';
import {
  Close,
  LocalOffer,
  Star,
  AutoAwesome,
  TrendingUp,
  FlashOn
} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const PopupHero = ({ open, onClose }) => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentOffer, setCurrentOffer] = useState(0);
  const [duration, setDuration] = useState(8); // Duración por defecto: 8 segundos
  const [timeLeft, setTimeLeft] = useState(8);
  const [isClosing, setIsClosing] = useState(false);

  console.log('PopupHero - open:', open, 'loading:', loading, 'offers:', offers.length);

  // Cargar ofertas y configuración desde Firebase
  useEffect(() => {
    const loadOffers = async () => {
      try {
        // Cargar ofertas
        const querySnapshot = await getDocs(collection(db, 'popupOffers'));
        const offersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Filtrar solo ofertas activas
        const activeOffers = offersData.filter(offer => offer.isActive === true);
        
        if (activeOffers.length === 0) {
          // Si no hay ofertas activas, no mostrar popup
          setOffers([]);
        } else {
          setOffers(activeOffers);
        }

        // Cargar configuración de duración
        const configSnapshot = await getDocs(collection(db, 'appConfig'));
        const configData = configSnapshot.docs.find(doc => doc.id === 'popupHero');
        
        if (configData) {
          const config = configData.data();
          const popupDuration = config.duration || 8; // Duración por defecto: 8 segundos
          setDuration(popupDuration);
          setTimeLeft(popupDuration);
        } else {
          setDuration(8);
          setTimeLeft(8);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error cargando ofertas:', error);
        // Ofertas de ejemplo en caso de error
        setOffers([{
          id: 'default',
          title: '¡Bienvenido a DeliZuKar!',
          description: 'Descubre nuestras deliciosas galletas artesanales',
          buttonText: 'Ver Productos',
          actionUrl: '/productos',
          isActive: true
        }]);
        setDuration(8);
        setTimeLeft(8);
        setLoading(false);
      }
    };

    if (open) {
      loadOffers();
    }
  }, [open]);

  // Cuenta regresiva y cierre automático
  useEffect(() => {
    if (open && !loading && offers.length > 0) {
      setTimeLeft(duration);
      setIsClosing(false);
      
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsClosing(true);
            setTimeout(() => {
              onClose();
            }, 500); // Pequeño delay para la animación de salida
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [open, loading, offers.length, duration, onClose]);

  // Cambiar oferta cada 4 segundos si hay múltiples ofertas
  useEffect(() => {
    if (offers.length > 1) {
      const interval = setInterval(() => {
        setCurrentOffer((prev) => (prev + 1) % offers.length);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [offers.length]);

  if (loading) {
    console.log('PopupHero - Still loading...');
    return null;
  }

  // Si no hay ofertas activas, no mostrar popup
  if (offers.length === 0) {
    console.log('PopupHero - No active offers, not showing popup');
    return null;
  }

  console.log('PopupHero - Rendering popup with offers:', offers.length);

  const currentOfferData = offers[currentOffer];

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          sx={{
            zIndex: 10000,
            '& .MuiDialog-paper': {
              zIndex: 10000
            },
            '& .MuiBackdrop-root': {
              zIndex: 9999
            }
          }}
          PaperProps={{
            sx: {
              width: '90vw',
              maxWidth: '700px',
              height: 'auto',
              maxHeight: '70vh',
              borderRadius: '32px',
              overflow: 'hidden',
              boxShadow: '0 32px 100px rgba(0,0,0,0.25)',
              backgroundColor: 'transparent',
              position: 'relative',
              backdropFilter: 'blur(20px)',
              zIndex: 10000
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 100 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ position: 'relative' }}
          >
            {/* Fondo blanco elegante con efectos */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.01) 100%)',
                  backdropFilter: 'blur(1px)'
                }
              }}
            />

            {/* Indicador de cuenta regresiva */}
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                left: 16,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: timeLeft <= 3 ? '#ff4444' : '#333',
                    fontSize: '1.1rem'
                  }}
                >
                  {timeLeft}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: '#666',
                  fontWeight: 500,
                  fontSize: '0.8rem'
                }}
              >
                seg
              </Typography>
            </Box>

            {/* Partículas de fondo flotantes */}
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.3, 1],
                y: [-20, 20, -20]
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                position: 'absolute',
                top: '10%',
                left: '10%',
                width: 60,
                height: 60,
                background: 'radial-gradient(circle, rgba(255,107,107,0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                zIndex: 1
              }}
            />

            <motion.div
              animate={{
                rotate: -360,
                scale: [1, 1.2, 1],
                x: [-15, 15, -15]
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                position: 'absolute',
                top: '20%',
                right: '15%',
                width: 40,
                height: 40,
                background: 'radial-gradient(circle, rgba(76,175,80,0.08) 0%, transparent 70%)',
                borderRadius: '50%',
                zIndex: 1
              }}
            />

            <motion.div
              animate={{
                rotate: 180,
                scale: [1, 1.4, 1],
                y: [10, -10, 10]
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                position: 'absolute',
                bottom: '20%',
                left: '20%',
                width: 50,
                height: 50,
                background: 'radial-gradient(circle, rgba(156,39,176,0.06) 0%, transparent 70%)',
                borderRadius: '50%',
                zIndex: 1
              }}
            />

            {/* Elementos decorativos de fondo */}
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(0,0,0,0.03) 0%, transparent 70%)',
                borderRadius: '50%'
              }}
            />

            <motion.div
              animate={{
                rotate: -360,
                scale: [1, 1.3, 1]
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                position: 'absolute',
                bottom: '-80px',
                left: '-80px',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(0,0,0,0.02) 0%, transparent 70%)',
                borderRadius: '50%'
              }}
            />

            {/* Botón de cerrar */}
            <IconButton
              onClick={onClose}
              sx={{
                position: 'absolute',
                top: 24,
                right: 24,
                zIndex: 10,
                backgroundColor: 'rgba(0,0,0,0.05)',
                color: '#333',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0,0,0,0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  transform: 'scale(1.1) rotate(90deg)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                },
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              }}
            >
              <Close />
            </IconButton>

            {/* Header rosa con efectos */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '140px',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)',
                zIndex: 3,
                boxShadow: '0 4px 20px rgba(255,107,107,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              {/* Partículas flotantes */}
              <motion.div
                animate={{
                  rotate: 360,
                  scale: [1, 1.2, 1],
                  y: [-10, 10, -10]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  position: 'absolute',
                  top: '20px',
                  left: '20px',
                  width: 15,
                  height: 15,
                  background: 'rgba(255,255,255,0.3)',
                  borderRadius: '50%',
                  backdropFilter: 'blur(5px)'
                }}
              />
              
              <motion.div
                animate={{
                  rotate: -360,
                  scale: [1, 1.3, 1],
                  y: [10, -10, 10]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  position: 'absolute',
                  top: '40px',
                  right: '30px',
                  width: 20,
                  height: 20,
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  backdropFilter: 'blur(5px)'
                }}
              />

              <motion.div
                animate={{
                  rotate: 180,
                  scale: [1, 1.1, 1],
                  x: [-5, 5, -5]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  position: 'absolute',
                  top: '60px',
                  left: '50px',
                  width: 12,
                  height: 12,
                  background: 'rgba(255,255,255,0.4)',
                  borderRadius: '50%',
                  backdropFilter: 'blur(5px)'
                }}
              />

              <motion.div
                animate={{
                  rotate: -180,
                  scale: [1, 1.4, 1],
                  x: [5, -5, 5]
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  position: 'absolute',
                  top: '30px',
                  right: '60px',
                  width: 18,
                  height: 18,
                  background: 'rgba(255,255,255,0.25)',
                  borderRadius: '50%',
                  backdropFilter: 'blur(5px)'
                }}
              />

              <motion.div
                animate={{
                  rotate: 90,
                  scale: [1, 1.2, 1],
                  y: [-8, 8, -8]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  position: 'absolute',
                  bottom: '30px',
                  left: '80px',
                  width: 14,
                  height: 14,
                  background: 'rgba(255,255,255,0.35)',
                  borderRadius: '50%',
                  backdropFilter: 'blur(5px)'
                }}
              />

              <motion.div
                animate={{
                  rotate: -90,
                  scale: [1, 1.3, 1],
                  y: [8, -8, 8]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  right: '40px',
                  width: 16,
                  height: 16,
                  background: 'rgba(255,255,255,0.3)',
                  borderRadius: '50%',
                  backdropFilter: 'blur(5px)'
                }}
              />

              {/* Partículas pequeñas alrededor del logo */}
              <motion.div
                animate={{
                  rotate: 360,
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '200px',
                  height: '200px',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1
                }}
              >
                {/* Partícula 1 */}
                <motion.div
                  animate={{
                    rotate: 360,
                    scale: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    width: 6,
                    height: 6,
                    background: 'rgba(255,255,255,0.6)',
                    borderRadius: '50%',
                    transform: 'translateX(-50%)'
                  }}
                />
                
                {/* Partícula 2 */}
                <motion.div
                  animate={{
                    rotate: -360,
                    scale: [0.3, 0.8, 0.3]
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '30px',
                    width: 4,
                    height: 4,
                    background: 'rgba(255,255,255,0.7)',
                    borderRadius: '50%',
                    transform: 'translateY(-50%)'
                  }}
                />

                {/* Partícula 3 */}
                <motion.div
                  animate={{
                    rotate: 180,
                    scale: [0.4, 1.1, 0.4]
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    position: 'absolute',
                    bottom: '40px',
                    left: '50%',
                    width: 5,
                    height: 5,
                    background: 'rgba(255,255,255,0.5)',
                    borderRadius: '50%',
                    transform: 'translateX(-50%)'
                  }}
                />

                {/* Partícula 4 */}
                <motion.div
                  animate={{
                    rotate: -180,
                    scale: [0.6, 1.3, 0.6]
                  }}
                  transition={{
                    duration: 9,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '30px',
                    width: 3,
                    height: 3,
                    background: 'rgba(255,255,255,0.8)',
                    borderRadius: '50%',
                    transform: 'translateY(-50%)'
                  }}
                />

                {/* Partícula 5 */}
                <motion.div
                  animate={{
                    rotate: 90,
                    scale: [0.2, 0.9, 0.2]
                  }}
                  transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    position: 'absolute',
                    top: '30px',
                    right: '50%',
                    width: 4,
                    height: 4,
                    background: 'rgba(255,255,255,0.6)',
                    borderRadius: '50%',
                    transform: 'translateX(50%)'
                  }}
                />

                {/* Partícula 6 */}
                <motion.div
                  animate={{
                    rotate: -90,
                    scale: [0.7, 1.4, 0.7]
                  }}
                  transition={{
                    duration: 11,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    position: 'absolute',
                    bottom: '30px',
                    right: '50%',
                    width: 3,
                    height: 3,
                    background: 'rgba(255,255,255,0.4)',
                    borderRadius: '50%',
                    transform: 'translateX(50%)'
                  }}
                />
              </motion.div>

              {/* Logo centrado con efecto dorado sutil */}
                  <motion.img
                    src="/LOGO.png"
                    alt="DeliZuKar Logo"
                    style={{
                  height: '90px',
                      width: 'auto',
                  filter: 'sepia(1) saturate(1.5) hue-rotate(40deg) brightness(1.1) drop-shadow(0 2px 8px rgba(255,215,0,0.2))',
                  position: 'relative',
                  zIndex: 2
                    }}
                    animate={{
                  y: [-2, 2, -2]
                    }}
                    transition={{
                  duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
            </Box>

            {/* Contenido principal */}
            <DialogContent sx={{ p: 0, position: 'relative', zIndex: 2, pt: '140px' }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' },
                minHeight: '350px'
              }}>
                {/* LADO IZQUIERDO - CONTENIDO */}
                <Box sx={{ 
                  flex: 1, 
                  padding: '30px 25px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  position: 'relative',
                  minHeight: '100%',
                  overflow: 'auto'
                }}>

                  {/* Título principal */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        color: '#1a1a1a',
                        fontWeight: 800,
                        mb: 1.5,
                        fontFamily: 'Playfair Display, serif',
                        textShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        background: 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: '1.8rem'
                      }}
                    >
                      ¡Bienvenido a DeliZuKar!
                    </Typography>
                  </motion.div>

                  {/* Subtítulo */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#ff6b6b',
                        fontWeight: 700,
                        mb: 2,
                        fontFamily: 'Playfair Display, serif',
                        textShadow: '0 1px 5px rgba(255,107,107,0.2)',
                        fontSize: '1.2rem'
                      }}
                    >
                      {currentOfferData.title || '¡Ofertas Especiales!'}
                    </Typography>
                  </motion.div>

                  {/* Descripción */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#666',
                        mb: 3,
                        lineHeight: 1.6,
                        fontSize: '0.95rem',
                        fontWeight: 500
                      }}
                    >
                      {currentOfferData.description || 'Descubre nuestras deliciosas galletas artesanales horneadas con ingredientes premium y mucho amor'}
                    </Typography>
                  </motion.div>

                  {/* Descuento Grande con Efectos */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.0 }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                      <motion.div
                        whileHover={{ 
                          scale: 1.1, 
                          rotate: [0, -2, 2, 0],
                          y: -5
                        }}
                        whileTap={{ scale: 0.95 }}
                        animate={{
                          y: [-3, 3, -3],
                          rotate: [0, 1, -1, 0],
                          scale: [1, 1.05, 1]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)',
                          borderRadius: '15px',
                          padding: '10px 20px',
                          boxShadow: '0 6px 24px rgba(255,107,107,0.4)',
                          border: '2px solid #ff6b6b',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Efecto de brillo */}
                        <motion.div
                          animate={{
                            x: ['-100%', '100%']
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                            zIndex: 1
                          }}
                        />
                        
                        <Typography
                          variant="h4"
                          sx={{
                            color: 'white',
                            fontWeight: 900,
                            fontSize: '1.3rem',
                            textAlign: 'center',
                            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                            position: 'relative',
                            zIndex: 2,
                            fontFamily: 'Playfair Display, serif'
                          }}
                        >
                          {currentOfferData.discountPercent || '20'}% DESCUENTO
                        </Typography>
                        
                        <Typography
                          variant="body1"
                          sx={{
                            color: 'rgba(255,255,255,0.9)',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            textAlign: 'center',
                            textShadow: '0 1px 5px rgba(0,0,0,0.3)',
                            position: 'relative',
                            zIndex: 2,
                            mt: 0.3
                          }}
                        >
                          {currentOfferData.discountText || '¡APROVECHA ESTA OFERTA!'}
                        </Typography>
                        
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgba(255,255,255,0.8)',
                            fontWeight: 500,
                            fontSize: '0.7rem',
                            textAlign: 'center',
                            textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                            position: 'relative',
                            zIndex: 2,
                            mt: 0.5,
                            fontStyle: 'italic'
                          }}
                        >
                          *{currentOfferData.discountConditions || 'A usuarios registrados en su primera compra'}
                        </Typography>
                        
                        {currentOfferData.discountCode && (
                          <Box sx={{ 
                            mt: 0.8, 
                            p: 0.5, 
                            backgroundColor: 'rgba(255,255,255,0.1)', 
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.2)'
                          }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'rgba(255,255,255,0.9)',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                textAlign: 'center',
                                textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                position: 'relative',
                                zIndex: 2,
                                fontFamily: 'monospace',
                                letterSpacing: '0.1em'
                              }}
                            >
                              Código: {currentOfferData.discountCode}
                            </Typography>
                          </Box>
                        )}
                      </motion.div>
                    </Box>
                  </motion.div>

                  {/* Botón principal con efectos espectaculares */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <motion.div
                        whileHover={{ 
                          scale: 1.05, 
                          y: -5,
                          rotate: [0, -1, 1, 0]
                        }}
                        whileTap={{ scale: 0.95 }}
                        animate={{
                          y: [-2, 2, -2],
                          boxShadow: [
                            '0 8px 32px rgba(255,107,107,0.3)',
                            '0 12px 40px rgba(255,107,107,0.4)',
                            '0 8px 32px rgba(255,107,107,0.3)'
                          ]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Button
                          variant="contained"
                          size="medium"
                          startIcon={<motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <FlashOn />
                          </motion.div>}
                          sx={{
                            background: 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)',
                            color: 'white',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            px: 3,
                            py: 1,
                            borderRadius: '50px',
                            textTransform: 'none',
                            border: '2px solid #ff6b6b',
                            boxShadow: '0 8px 32px rgba(255,107,107,0.3)',
                            position: 'relative',
                            overflow: 'hidden',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #ff5252 0%, #ff1744 100%)',
                              border: '2px solid #ff5252'
                            },
                            transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: '-100%',
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                              transition: 'left 0.5s'
                            },
                            '&:hover::before': {
                              left: '100%'
                            }
                          }}
                          onClick={() => {
                            window.location.href = currentOfferData.actionUrl || '/productos';
                          }}
                        >
                          {currentOfferData.buttonText || '¡Aceptar la Oferta!'}
                        </Button>
                      </motion.div>
                    </Box>
                  </motion.div>
              </Box>

                {/* LADO DERECHO - CONTENEDOR DE FOTO */}
                <Box sx={{ 
                  flex: 1, 
                  padding: '0',
                  display: 'flex',
                  alignItems: 'stretch',
                  justifyContent: 'stretch',
                  position: 'relative',
                  overflow: 'hidden',
                  backgroundColor: '#f8f9fa',
                  minHeight: '100%'
                }}>
                  {/* Contenedor máscara - ventana fija que ocupa todo el espacio */}
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                      overflow: 'hidden',
                      background: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {/* Imagen que se mueve detrás de la máscara */}
                    <motion.img
                      src="https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                      alt="Deliciosas Galletas"
                      style={{
                        width: '120%',
                        height: '120%',
                        objectFit: 'cover',
                        position: 'absolute',
                        top: '-10%',
                        left: '-10%'
                      }}
                      animate={{
                        x: [-20, 20, -20],
                        y: [-15, 15, -15],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </DialogContent>
          </motion.div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default PopupHero;
