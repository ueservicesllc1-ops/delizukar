import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const ContainerDebugger = () => {
  return (
    <Box sx={{ 
      py: 4, 
      backgroundColor: '#ffff00', 
      minHeight: '200px',
      border: '5px solid green',
      margin: '20px 0'
    }}>
      <Typography variant="h4" sx={{ color: 'green', textAlign: 'center', fontWeight: 'bold', mb: 2 }}>
        🚨 DEBUG DE CONTENEDORES 🚨
      </Typography>
      
      {/* Contenedor principal con borde rojo */}
      <Box sx={{ 
        border: '5px solid red',
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '10px',
        padding: '20px'
      }}>
        <Typography variant="h5" sx={{ color: 'red', fontWeight: 'bold', textAlign: 'center' }}>
          🔴 CONTENEDOR PRINCIPAL
        </Typography>
        <Typography variant="h6" sx={{ color: 'red', textAlign: 'center' }}>
          maxWidth: xl (1400px máximo)
        </Typography>
        
        {/* Contenedor interno con borde azul */}
        <Box sx={{ 
          width: '90%',
          border: '3px solid blue',
          backgroundColor: 'rgba(0, 0, 255, 0.2)',
          minHeight: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mt: 2,
          padding: '10px'
        }}>
          <Typography variant="h6" sx={{ color: 'blue', fontWeight: 'bold', textAlign: 'center' }}>
            🔵 CONTENEDOR INTERNO (90% del principal)
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ContainerDebugger;
