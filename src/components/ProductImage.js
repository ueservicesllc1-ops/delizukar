import React, { useState } from 'react';
import { Box, Skeleton } from '@mui/material';
import { useLanguage } from '../context/LanguageContext';

const TEXTS = {
  es: { noImage: 'Imagen no disponible' },
  en: { noImage: 'Image not available' }
};

const ProductImage = ({ src, alt, height = 350, sx = {} }) => {
  const { language } = useLanguage();
  const texts = TEXTS[language] || TEXTS.es;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', ...sx }}>
      {/* Skeleton mientras carga */}
      {!imageLoaded && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height={height}
          animation="wave"
          sx={{
            backgroundColor: '#f8f8f8',
            borderRadius: 1
          }}
        />
      )}
      
      {/* Imagen real */}
      {!imageError && (
        <img
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            width: '100%',
            height: height,
            objectFit: 'contain',
            backgroundColor: '#f8f8f8',
            display: imageLoaded ? 'block' : 'none',
            position: 'relative',
            zIndex: 1
          }}
        />
      )}
      
      {/* Imagen de error si falla la carga */}
      {imageError && (
        <Box
          sx={{
            width: '100%',
            height: height,
            backgroundColor: '#f8f8f8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontSize: '0.875rem'
          }}
        >
          {texts.noImage}
        </Box>
      )}
    </Box>
  );
};

export default ProductImage;
