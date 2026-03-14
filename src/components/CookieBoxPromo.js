import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, IconButton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';

const CookieBoxPromo = ({ open, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <Box
          component={motion.div}
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          sx={{
            position: 'fixed',
            bottom: { xs: 20, md: 40 },
            right: { xs: 20, md: 40 },
            zIndex: 9999,
            maxWidth: { xs: 'calc(100vw - 40px)', md: 400 },
          }}
        >
          <Paper
            elevation={24}
            sx={{
              p: 3,
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #c8626d 0%, #ff8a95 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(200, 98, 109, 0.4)',
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          >
            {/* Decorative circles */}
            <Box sx={{
              position: 'absolute',
              top: -20,
              left: -20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
            }} />
            <Box sx={{
              position: 'absolute',
              bottom: -30,
              right: -10,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
            }} />

            <IconButton
              onClick={() => {
                setVisible(false);
                onClose();
              }}
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                color: 'white',
                '&:hover': { background: 'rgba(255,255,255,0.2)' }
              }}
            >
              <Close fontSize="small" />
            </IconButton>

            <Box sx={{ position: 'relative', textAlign: 'center' }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  mb: 1,
                  fontFamily: '"Asap", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  lineHeight: 1.2,
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                Build Your NY-Style Cookie Box 🍪
              </Typography>
              
              <Box sx={{ 
                height: '3px', 
                width: '60px', 
                backgroundColor: 'rgba(255,255,255,0.5)', 
                mx: 'auto', 
                mb: 2,
                borderRadius: '2px'
              }} />

              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  opacity: 0.95
                }}
              >
                Minimum 4 Cookies
              </Typography>
              
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mt: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1
                }}
              >
                Ships Nationwide 🇺🇸
              </Typography>

              <Box
                component={motion.div}
                animate={{ 
                  y: [0, -5, 0],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                sx={{ mt: 2, fontSize: '2rem' }}
              >
                📦✨
              </Box>
            </Box>
          </Paper>
        </Box>
      )}
    </AnimatePresence>
  );
};

export default CookieBoxPromo;
