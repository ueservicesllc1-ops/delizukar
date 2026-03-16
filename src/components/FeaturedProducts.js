import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
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
  useMediaQuery,
  Chip
} from '@mui/material';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { useFeaturedProducts } from '../context/FeaturedProductsContext';
import { PRODUCT_TRANSLATIONS } from '../pages/Products';

const FeaturedProducts = ({ onOpenDetail }) => {
  const { featuredProducts: defaultFeaturedProducts, productsLoading, addToCart } = useStore();
  const { language } = useLanguage();
  const { featuredConfig: config, featuredProducts: ctxFeaturedProducts } = useFeaturedProducts();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fallback to default featured products if context is empty
  const displayProducts = (ctxFeaturedProducts && ctxFeaturedProducts.length > 0)
    ? ctxFeaturedProducts
    : defaultFeaturedProducts;

  const translations = {
    es: {
      featuredTitle: 'Galletas Destacadas',
      viewDetails: 'Ver detalles',
      viewAll: 'Ver todas las galletas',
      offMessage: 'de descuento aplicado al total'
    },
    en: {
      featuredTitle: 'Featured Cookies',
      viewDetails: 'View details',
      viewAll: 'View all cookies',
      offMessage: 'OFF - Price based on cookies'
    },
    fr: {
      featuredTitle: 'Biscuits en vedette',
      viewDetails: 'Voir les détails',
      viewAll: 'Voir tous les biscuits',
      offMessage: 'OFF - Prix selon les biscuits'
    },
    pt: {
      featuredTitle: 'Cookies em destaque',
      viewDetails: 'Ver detalhes',
      viewAll: 'Ver todos os cookies',
      offMessage: 'OFF - Preço de acordo com os cookies'
    }
  };

  const copy = translations[language] || translations.es;

  // Use the title from config if available, otherwise use translation
  const titleText = (language === 'es' ? config?.titleText : (config?.titleText_en || config?.titleText)) || copy.featuredTitle;
  const titleFont = config?.titleFont || 'BrittanySignature';

  if (productsLoading) return null;
  if (displayProducts.length === 0) return null;

  return (
    <Box sx={{ width: '100%', py: { xs: 4, md: 6 }, backgroundColor: 'transparent' }}>
      {/* Dynamic Title */}
      <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 5 }, minHeight: '48px' }}>
        <Typography
          sx={{
            fontFamily: titleFont,
            fontSize: { xs: '2rem', md: '2.4rem' },
            color: '#c8626d'
          }}
        >
          {titleText}
        </Typography>
      </Box>

      {/* Carousel */}
      <Box sx={{ px: { xs: 2, md: 4 }, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: { md: '900px', lg: '1100px' } }}>
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={isMobile ? 16 : 30}
            slidesPerView={isMobile ? 2 : 3}
            breakpoints={{
              0: { slidesPerView: 2, spaceBetween: 16 },
              600: { slidesPerView: 2, spaceBetween: 20 },
              900: { slidesPerView: 3, spaceBetween: 24 },
              1200: { slidesPerView: 4, spaceBetween: 30 }
            }}
            navigation={!isMobile}
            pagination={{ clickable: true, dynamicBullets: true }}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            style={{
              paddingBottom: '45px',
              '--swiper-navigation-color': '#c8626d',
              '--swiper-pagination-color': '#c8626d',
            }}
          >
            {displayProducts.filter(item => item.category !== 'boxes').map((item) => (
              <SwiperSlide key={item.id} style={{ height: 'auto' }}>
                <Card
                  sx={{
                    borderRadius: '18px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
                    height: '360px',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#fff'
                  }}
                >
                  <Box sx={{ height: { xs: 160, md: 180 }, overflow: 'hidden', position: 'relative' }}>
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                  </Box>
                  <CardContent sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: 1.5,
                    p: { xs: 1.5, md: 2 },
                    flexGrow: 1
                  }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700, 
                        color: '#c8626d', 
                        fontFamily: 'Asap', 
                        fontSize: { xs: '0.9rem', md: '1rem' }, 
                        textAlign: 'center',
                        lineHeight: 1.2
                      }}
                    >
                      {PRODUCT_TRANSLATIONS[language]?.[item.name]?.name || item[`name_${language}`] || item.name}
                    </Typography>
                    
                    {item.category === 'boxes' && (
                       <Typography 
                         variant="body2" 
                         sx={{ 
                           color: 'text.secondary', 
                           fontSize: '0.75rem', 
                           textAlign: 'center',
                           lineHeight: 1.3
                         }}
                       >
                         {PRODUCT_TRANSLATIONS[language]?.[item.name]?.description || item[`description_${language}`] || item.description}
                       </Typography>
                    )}

                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#4a4a4a', fontSize: { xs: '0.8rem', md: '0.9rem' }, textAlign: 'center' }}>
                      {item.category === 'boxes' ? (
                        `${item.discountPercentage}% ${copy.offMessage}`
                      ) : (
                        `$${Number(item.price || 0).toFixed(2)}`
                      )}
                    </Typography>

                    <Box sx={{ flexGrow: 1 }} />

                    <Button
                      variant="contained"
                      sx={{ 
                        backgroundColor: '#c8626d', 
                        borderRadius: '20px', 
                        px: { xs: 2, md: 3 },
                        py: { xs: 0.5, md: 1 },
                        fontSize: { xs: '0.75rem', md: '0.85rem' },
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: '#b25763'
                        }
                      }}
                      onClick={() => onOpenDetail ? onOpenDetail(item) : (window.location.href = `/productos?id=${item.id}`)}
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

      {/* View All Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 2, md: 3 } }}>
        <Button
          variant="outlined"
          href="/productos"
          sx={{
            borderColor: '#c8626d',
            color: '#c8626d',
            borderRadius: '24px',
            px: { xs: 3, md: 4 },
            py: { xs: 1, md: 1.2 },
            fontWeight: 600,
            textTransform: 'none',
            fontSize: { xs: '0.9rem', md: '1rem' },
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

export default FeaturedProducts;
