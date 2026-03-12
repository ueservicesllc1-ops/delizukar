import React from 'react';
import { Box, Typography } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

const Maintenance = () => {
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        backgroundColor: '#F5E6D3', // Color de fondo crema suave basado en la imagen
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        textAlign: 'center',
        padding: 4
      }}
    >
      {/* Logo superior */}
      <Box 
        component="img" 
        src="/LOGO.png" 
        alt="DeliZukar Logo" 
        sx={{ 
          width: { xs: '180px', md: '250px' }, 
          mb: { xs: 4, md: 6 },
          opacity: 0.9
        }} 
      />

      {/* Iconos decorativos de engranajes (como en la imagen) */}
      <Box sx={{ 
        position: 'absolute', 
        left: { xs: '5%', md: '10%' }, 
        top: '50%', 
        transform: 'translateY(-50%)',
        opacity: 0.4,
        display: { xs: 'none', sm: 'block' }
      }}>
        <SettingsIcon sx={{ fontSize: { xs: '60px', md: '120px' }, color: '#c8626d' }} />
      </Box>

      <Box sx={{ 
        position: 'absolute', 
        right: { xs: '5%', md: '10%' }, 
        top: '50%', 
        transform: 'translateY(-50%)',
        opacity: 0.4,
        display: { xs: 'none', sm: 'block' }
      }}>
        <SettingsIcon sx={{ fontSize: { xs: '60px', md: '120px' }, color: '#c8626d' }} />
      </Box>

      {/* Texto principal */}
      <Typography
        sx={{
          fontFamily: 'BrittanySignature',
          fontSize: { xs: '2.5rem', sm: '3.5rem', md: '5rem' },
          color: '#c8626d',
          lineHeight: 1.2,
          fontWeight: 400,
          px: 2
        }}
      >
        página en mantenimiento
      </Typography>

      {/* Destello/Estrella en la esquina inferior derecha */}
      <Box sx={{ 
        position: 'absolute', 
        bottom: '40px', 
        right: '40px', 
        opacity: 0.6 
      }}>
        <AutoFixHighIcon sx={{ fontSize: '40px', color: '#c8626d' }} />
      </Box>
    </Box>
  );
};

export default Maintenance;
