import React, { useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { PRODUCT_TRANSLATIONS } from '../pages/Products';

const RandomCookiesCarousel = ({ onOpenDetail }) => {
  const { products, productsLoading } = useStore();
  const { language } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Filtrar galletas activas y mezclarlas aleatoriamente
  const randomCookies = useMemo(() => {
    if (!products || products.length === 0) return [];
    const active = products.filter((p) => p.active !== false);
    const cookiesOnly = active.filter((p) => p.category !== 'boxes');
    const source = cookiesOnly.length >= 3 ? cookiesOnly : active;
    // Fisher-Yates / Random shuffle
    return [...source].sort(() => Math.random() - 0.5);
  }, [products]);

  const copy = {
    es: {
      title: 'Nuestras Galletas',
      viewDetails: 'Ver detalles',
      viewAll: 'Ver todas las galletas'
    },
    en: {
      title: 'Our Cookies',
      viewDetails: 'View details',
      viewAll: 'View all cookies'
    }
  }[language] || {
    title: 'Nuestras Galletas',
    viewDetails: 'Ver detalles',
    viewAll: 'Ver todas las galletas'
  };

  if (productsLoading || randomCookies.length === 0) {
    return null;
  }

  return (
    <Box sx={{ width: '100%', py: { xs: 4, md: 6 }, backgroundColor: 'transparent' }}>
      {/* Título en tipografía elegante de la marca */}
      <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
        <Typography
          sx={{
            fontFamily: 'BrittanySignature',
            fontSize: { xs: '2.2rem', md: '2.9rem' },
            color: '#c8626d',
            lineHeight: 1.15
          }}
        >
          {copy.title}
        </Typography>
      </Box>

      {/* Carrusel Swiper continuo y rotatorio */}
      <Box sx={{ px: { xs: 2, md: 4 }, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: { md: '900px', lg: '1100px' } }}>
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            loop={randomCookies.length >= 4}
            autoplay={{
              delay: 2400,
              disableOnInteraction: false,
              pauseOnMouseEnter: true
            }}
            speed={700}
            spaceBetween={isMobile ? 14 : 24}
            slidesPerView={isMobile ? 2 : 3}
            breakpoints={{
              0: { slidesPerView: 2, spaceBetween: 14 },
              600: { slidesPerView: 2, spaceBetween: 18 },
              900: { slidesPerView: 3, spaceBetween: 24 },
              1200: { slidesPerView: 4, spaceBetween: 28 }
            }}
            navigation={!isMobile}
            pagination={{ clickable: true, dynamicBullets: true }}
            style={{
              paddingBottom: '42px',
              '--swiper-navigation-color': '#c8626d',
              '--swiper-pagination-color': '#c8626d'
            }}
          >
            {randomCookies.map((item) => (
              <SwiperSlide key={item.id} style={{ height: 'auto' }}>
                <Card
                  sx={{
                    borderRadius: '18px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.07)',
                    height: '350px',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#fff',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 28px rgba(200,98,109,0.18)'
                    }
                  }}
                >
                  <Box sx={{ height: { xs: 155, md: 175 }, overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </Box>

                  <CardContent
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1.2,
                      p: { xs: 1.5, md: 2 },
                      flexGrow: 1
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: '#c8626d',
                        fontFamily: 'Asap, sans-serif',
                        fontSize: { xs: '0.88rem', md: '0.98rem' },
                        textAlign: 'center',
                        lineHeight: 1.2,
                        minHeight: '2.4em',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {PRODUCT_TRANSLATIONS[language]?.[item.name]?.name || item[`name_${language}`] || item.name}
                    </Typography>

                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 700,
                        color: '#4a4a4a',
                        fontSize: { xs: '0.85rem', md: '0.95rem' },
                        textAlign: 'center'
                      }}
                    >
                      ${Number(item.price || 0).toFixed(2)}
                    </Typography>

                    <Box sx={{ flexGrow: 1 }} />

                    <Button
                      variant="contained"
                      sx={{
                        backgroundColor: '#c8626d',
                        borderRadius: '20px',
                        px: { xs: 2, md: 3 },
                        py: { xs: 0.5, md: 0.8 },
                        fontSize: { xs: '0.74rem', md: '0.82rem' },
                        fontWeight: 700,
                        textTransform: 'none',
                        boxShadow: '0 3px 10px rgba(200,98,109,0.25)',
                        '&:hover': {
                          backgroundColor: '#b25763'
                        }
                      }}
                      onClick={() =>
                        onOpenDetail ? onOpenDetail(item) : (window.location.href = `/productos?id=${item.id}`)
                      }
                    >
                      {copy.viewDetails}
                    </Button>
                  </CardContent>
                </Card>
              </SwiperSlide>
            ))}
          </Swiper>
        </Box>
      </Box>

      {/* Botón Ver todas las galletas */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 1, md: 2 } }}>
        <Button
          variant="outlined"
          href="/productos"
          sx={{
            borderColor: '#c8626d',
            color: '#c8626d',
            borderRadius: '24px',
            px: { xs: 3, md: 4 },
            py: { xs: 0.8, md: 1 },
            fontWeight: 700,
            textTransform: 'none',
            fontSize: { xs: '0.88rem', md: '0.95rem' },
            '&:hover': {
              backgroundColor: '#c8626d',
              color: '#fff',
              borderColor: '#c8626d'
            }
          }}
        >
          {copy.viewAll}
        </Button>
      </Box>
    </Box>
  );
};

export default RandomCookiesCarousel;
