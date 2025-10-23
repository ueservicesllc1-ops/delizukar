import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Container } from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const Banner2 = () => {
  const [banner2Photos, setBanner2Photos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar fotos del Banner 2 desde Firebase
  useEffect(() => {
    const loadBanner2Photos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'banner2Photos'));
        const photos = [];
        querySnapshot.forEach((doc) => {
          photos.push({ id: doc.id, ...doc.data() });
        });
        // Ordenar por el campo 'order'
        const sortedPhotos = photos.sort((a, b) => a.order - b.order);
        setBanner2Photos(sortedPhotos);
      } catch (error) {
        console.error('Error cargando fotos del Banner 2:', error);
        // Si hay error, usar foto por defecto
        setBanner2Photos([
          {
            id: 'default',
            title: "Banner 2",
            description: "Banner de una sola foto",
            imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
            color: "#c8626d"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadBanner2Photos();
  }, []);

  // Si está cargando, mostrar un placeholder
  if (loading) {
    return (
      <Box
        sx={{
          position: 'relative',
          height: '35vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          mb: 8
        }}
      >
        <Typography variant="h6" sx={{ color: '#666' }}>
          Cargando Banner 2...
        </Typography>
      </Box>
    );
  }

  // Si no hay fotos, mostrar mensaje
  if (banner2Photos.length === 0) {
    return (
      <Box
        sx={{
          position: 'relative',
          height: '35vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          mb: 8
        }}
      >
        <Typography variant="h6" sx={{ color: '#666' }}>
          No hay fotos en el Banner 2. Sube una foto desde el panel de administración.
        </Typography>
      </Box>
    );
  }

  // Mostrar la primera foto (o la única foto)
  const currentPhoto = banner2Photos[0];

  return (
      <Box
        className="banner2-mobile"
        sx={{
          position: 'relative',
          height: '35vh',
          backgroundImage: `url(${currentPhoto.imageUrl})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 8
        }}
      >
      {/* Overlay opcional si se especifica un color */}
      {currentPhoto.color && currentPhoto.color !== '#c8626d' && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: `${currentPhoto.color}40`, // 40 = 25% de opacidad
            zIndex: 1
          }}
        />
      )}

      {/* Contenido del banner (opcional) */}
      {(currentPhoto.title || currentPhoto.description) && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}
        >
          {currentPhoto.title && (
            <Typography
              variant="h2"
              sx={{
                color: 'white',
                fontWeight: 800,
                mb: 3,
                fontSize: { xs: '2rem', md: '3.5rem' },
                fontFamily: 'Playfair Display, serif',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              {currentPhoto.title}
            </Typography>
          )}
          {currentPhoto.description && (
            <Typography
              variant="h5"
              sx={{
                color: 'white',
                fontWeight: 600,
                maxWidth: '600px',
                mx: 'auto',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
              }}
            >
              {currentPhoto.description}
            </Typography>
          )}
        </motion.div>
      )}
    </Box>
  );
};

export default Banner2;
