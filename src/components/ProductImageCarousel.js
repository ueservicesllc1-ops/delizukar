import React, { useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

const ProductImageCarousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '500px' }}>
      {/* Imagen actual */}
      <img
        src={images[currentIndex]}
        alt={`Product image ${currentIndex + 1}`}
        style={{ 
          width: '100%', 
          height: '500px', 
          objectFit: 'cover', 
          display: 'block' 
        }}
      />

      {/* Botón anterior */}
      {images.length > 1 && (
        <IconButton
          onClick={prevImage}
          sx={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.7)'
            }
          }}
        >
          <ChevronLeft />
        </IconButton>
      )}

      {/* Botón siguiente */}
      {images.length > 1 && (
        <IconButton
          onClick={nextImage}
          sx={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.7)'
            }
          }}
        >
          <ChevronRight />
        </IconButton>
      )}

      {/* Indicadores de posición */}
      {images.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 1
          }}
        >
          {images.map((_, index) => (
            <Box
              key={index}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: index === currentIndex ? 'white' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </Box>
      )}

      {/* Contador de imágenes */}
      {images.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem'
          }}
        >
          {currentIndex + 1} / {images.length}
        </Box>
      )}
    </Box>
  );
};

export default ProductImageCarousel;
