import React from 'react';
import { Box, Typography } from '@mui/material';

const Inicio = () => {
  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      px: { xs: 2, md: 4 },
      py: { xs: 6, md: 10 }
    }}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Nueva página Inicio
      </Typography>
      <Typography variant="body1" sx={{ textAlign: 'center', maxWidth: 480 }}>
        Aquí iremos componiendo la versión mobile-first con todas las secciones del Home original.
      </Typography>
    </Box>
  );
};

export default Inicio;
