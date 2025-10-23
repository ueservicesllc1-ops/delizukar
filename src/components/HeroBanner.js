import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import { Button, Box, Typography, Container } from '@mui/material';
import { ArrowForward, Star } from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const HeroBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [bannerPhotos, setBannerPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar fotos del banner desde Firebase
  useEffect(() => {
    const loadBannerPhotos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'bannerPhotos'));
        const photos = [];
        querySnapshot.forEach((doc) => {
          photos.push({ id: doc.id, ...doc.data() });
        });
        // Ordenar por el campo 'order'
        const sortedPhotos = photos.sort((a, b) => a.order - b.order);
        setBannerPhotos(sortedPhotos);
      } catch (error) {
        console.error('Error cargando fotos del banner:', error);
        // Si hay error, usar fotos por defecto
        setBannerPhotos([
          {
            id: 'default1',
            title: "Galletas Artesanales",
            subtitle: "Estilo Nueva York",
            description: "Descubre el sabor auténtico de las mejores galletas artesanales, horneadas con ingredientes premium y el amor de siempre.",
            imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
            color: "#8B4513"
          },
          {
            id: 'default2',
            title: "Chocolate Premium",
            subtitle: "Irresistible Tentación",
            description: "Nuestras galletas de chocolate están hechas con cacao belga de la más alta calidad. Una experiencia única para tu paladar.",
            imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
            color: "#D2691E"
          },
          {
            id: 'default3',
            title: "Veganas & Saludables",
            subtitle: "Deliciosas y Naturales",
            description: "Para quienes buscan opciones saludables sin comprometer el sabor. Galletas veganas que sorprenderán a todos.",
            imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
            color: "#228B22"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadBannerPhotos();
  }, []);

  // Si está cargando, mostrar un placeholder
  if (loading) {
    return (
      <Box
        sx={{
          position: 'relative',
          height: '80vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5'
        }}
      >
        <Typography variant="h6" sx={{ color: '#666' }}>
          Cargando banner...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box
        className="hero-mobile"
        sx={{
          position: 'relative',
          height: '80vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={true}
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        effect="fade"
        speed={1000}
        onSlideChange={(swiper) => setCurrentSlide(swiper.activeIndex)}
        style={{
          width: '100%',
          height: '100%',
          '--swiper-navigation-color': '#fff',
          '--swiper-pagination-color': '#fff',
          '--swiper-pagination-bullet-inactive-color': 'rgba(255,255,255,0.3)',
          '--swiper-pagination-bullet-inactive-opacity': '0.3'
        }}
      >
        {bannerPhotos.map((slide, index) => (
          <SwiperSlide key={slide.id}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: '80vh',
                backgroundImage: `url(${slide.imageUrl})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center bottom',
                backgroundRepeat: 'no-repeat',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >


              {/* Elementos decorativos */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '20%',
                  right: '10%',
                  zIndex: 1
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Star sx={{ fontSize: '3rem', color: 'rgba(255,255,255,0.3)' }} />
                </motion.div>
              </Box>
              
              <Box
                sx={{
                  position: 'absolute',
                  bottom: '20%',
                  left: '10%',
                  zIndex: 1
                }}
              >
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                >
                  <Star sx={{ fontSize: '2rem', color: 'rgba(255,255,255,0.2)' }} />
                </motion.div>
              </Box>
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Indicador de slide personalizado */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          gap: 1
        }}
      >
        {bannerPhotos.map((_, index) => (
          <motion.div
            key={index}
            className={`slide-indicator ${index === currentSlide ? 'active' : ''}`}
            style={{
              width: index === currentSlide ? '30px' : '10px',
              height: '10px',
              backgroundColor: index === currentSlide ? '#fff' : 'rgba(255,255,255,0.5)',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            whileHover={{ scale: 1.2 }}
          />
        ))}
      </Box>
    </Box>

          {/* Franja de color debajo del banner */}
          <Box
            sx={{
              width: '100%',
              height: '50px',
              backgroundColor: '#C8626D',
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
        <Typography
          variant="h6"
          sx={{
            color: 'white',
            fontWeight: 600,
            fontSize: { xs: '0.9rem', md: '1.1rem' },
            textAlign: 'center',
            fontFamily: 'Playfair Display, serif',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
          }}
        >
          DeliZuKar: your heart's Wi-Fi (always keeps you connected to happiness).
        </Typography>
          </Box>
    </>
  );
};

export default HeroBanner;
