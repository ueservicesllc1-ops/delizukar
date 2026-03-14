import React from 'react';
import { Box, Chip } from '@mui/material';
import { motion } from 'framer-motion';

const GourmetBadge = () => {
  return (
    <Box
      component={motion.div}
      initial={{ scale: 0 }}
      animate={{ 
        scale: [1, 1.1, 1],
        rotate: [0, 5, -5, 0],
      }}
      transition={{ 
        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: 3, repeat: Infinity, ease: "easeInOut" }
      }}
      sx={{
        position: 'fixed',
        bottom: 120,
        left: { xs: 10, md: 30 },
        zIndex: 9998,
        pointerEvents: 'none'
      }}
    >
      <Chip
        label="200g Gourmet NY-Style Cookies 🍪"
        sx={{
          backgroundColor: '#c8626d',
          color: 'white',
          fontWeight: 900,
          fontSize: { xs: '0.7rem', md: '0.9rem' },
          height: { xs: 32, md: 40 },
          px: 1,
          borderRadius: '20px',
          boxShadow: '0 8px 24px rgba(200, 98, 109, 0.4)',
          border: '2px solid white',
          '& .MuiChip-label': {
            px: 2
          }
        }}
      />
    </Box>
  );
};

export default GourmetBadge;
