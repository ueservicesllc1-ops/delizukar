import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, Container, Typography, Grid, Card, CardContent, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Rating, IconButton } from '@mui/material';
import { ArrowForward, Star, LocalShipping, Security, Support, ChevronLeft, ChevronRight } from '@mui/icons-material';
import HeroBanner from '../components/HeroBanner';
import ProductCards from '../components/ProductCards';
import Banner2 from '../components/Banner2';
import TestimonialsSection from '../components/TestimonialsSection';
import PopupHero from '../components/PopupHero';
import { useTitleConfig } from '../context/TitleConfigContext';
import { useFeaturedProducts } from '../context/FeaturedProductsContext';
import { useStore } from '../context/StoreContext';
import AfterpayMessaging from '../components/AfterpayMessaging';
import { useTranslation } from 'react-i18next';
import { responsiveComponents } from '../utils/responsiveDesign';

const Home = () => {
  const { t } = useTranslation();
  const { titleConfig, loading } = useTitleConfig();
  const { featuredConfig, featuredProducts, loading: featuredLoading } = useFeaturedProducts();
  const { addToCart } = useStore();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetailOpen, setProductDetailOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [popupOpen, setPopupOpen] = useState(false);

  // Funciones para el carrusel del popup
  const getProductImages = () => {
    if (!selectedProduct) return [];
    
    // Usar el array 'images' si existe, sino usar solo 'image'
    if (selectedProduct.images && Array.isArray(selectedProduct.images)) {
      return selectedProduct.images;
    } else if (selectedProduct.image) {
      return [selectedProduct.image];
    }
    
    return [];
  };

  const nextImage = () => {
    const images = getProductImages();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    const images = getProductImages();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Resetear índice cuando se abre un producto diferente
  React.useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedProduct]);

  // Mostrar popup al cargar la página
  useEffect(() => {
    const timer = setTimeout(() => {
      setPopupOpen(true);
    }, 2000); // Mostrar después de 2 segundos

    return () => clearTimeout(timer);
  }, []);

  // Debug: verificar si el popup se está abriendo
  useEffect(() => {
    console.log('Popup state:', popupOpen);
  }, [popupOpen]);

  return (
    <Box className="home-mobile" sx={{
      // Sistema responsivo universal
      padding: responsiveComponents.container.padding,
      maxWidth: '100%',
      margin: '0 auto',
      marginTop: responsiveComponents.banner.marginTop
    }}>
      {/* Hero Banner */}
      <Box sx={{
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)',
        marginTop: 0,
        marginBottom: 0,
        '@media (min-width: 769px) and (max-width: 1024px) and (orientation: landscape)': {
          marginTop: '0px'
        }
      }}>
        <HeroBanner />
      </Box>

      {/* Franja rosa separada */}
      <Box
        className="hero-color-strip-mobile"
        sx={{
          width: '100%',
          height: '50px',
          backgroundColor: '#C8626D',
          position: 'relative',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: { xs: '-60px', sm: '-60px', md: '-60px', lg: '-60px', xl: '-60px' },
          cursor: 'default !important',
          pointerEvents: 'none !important',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          '& *': {
            cursor: 'default !important',
            pointerEvents: 'none !important'
          },
          '&::before': {
            cursor: 'default !important',
            pointerEvents: 'none !important'
          },
          '&::after': {
            cursor: 'default !important',
            pointerEvents: 'none !important'
          },
          '@media (min-width: 768px) and (max-width: 1200px) and (orientation: landscape)': {
            marginTop: '0px'
          }
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
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
            cursor: 'default !important',
            pointerEvents: 'none !important',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
        >
          DeliZuKar: your heart's Wi-Fi (always keeps you connected to happiness).
        </Typography>
      </Box>

      {/* Featured Products */}
      <Box sx={{ 
        py: 2, 
        pt: 6, 
        backgroundColor: '#fafafa',
        '@media (min-width: 768px) and (max-width: 1200px) and (orientation: landscape)': {
          marginTop: '100px'
        }
      }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography
                variant="h2"
                className="featured-products-title"
                sx={{
                  fontSize: { xs: '2rem', md: '3rem' },
                  fontWeight: 800,
                  color: '#EC8C8D',
                  mb: 2,
                  fontFamily: featuredLoading ? 'Playfair Display, serif' : `"${featuredConfig.titleFont}", serif !important`,
                  position: 'relative',
                  zIndex: 10,
                  '&::before': { display: 'none' },
                  '&::after': { display: 'none' }
                }}
              >
                {featuredLoading ? 'Galletas Destacadas' : featuredConfig.titleText}
              </Typography>
            </Box>

            {featuredProducts.length > 0 ? (
              <Grid container spacing={4} justifyContent="center">
                {featuredProducts.map((product, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={product.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      whileHover={{ y: -10 }}
                    >
                      <Card
                        sx={{
                          height: '100%',
                          borderRadius: '20px',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
                            transform: 'translateY(-5px)'
                          }
                        }}
                      >
                        <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Box sx={{ position: 'relative', mb: 0.5, display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <Box
                              component="img"
                              src={product.image}
                              alt={product.name}
                              sx={{
                                width: '180px',
                                height: '160px',
                                objectFit: 'cover',
                                borderRadius: '15px',
                                margin: '0 auto'
                              }}
                            />
                            {/* Chips en la esquina superior izquierda */}
                            <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {product.featured && <Chip label={t('product.featured', 'Featured')} size="small" color="primary" sx={{ fontSize: '0.7rem', height: '24px' }} />}
                              {product.bestSeller && <Chip label={t('product.bestSeller', 'Best Seller')} size="small" color="success" sx={{ fontSize: '0.7rem', height: '24px' }} />}
                              {product.isNew && <Chip label={t('product.new', 'New')} size="small" color="warning" sx={{ fontSize: '0.7rem', height: '24px' }} />}
                            </Box>
                          </Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: '#EC8C8D',
                              mb: 0.25,
                              fontFamily: '"Asap", sans-serif',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}
                          >
                            {product.name}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography
                              variant="h5"
                              sx={{
                                fontWeight: 800,
                                color: '#c8626d'
                              }}
                            >
                              ${product.price}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Rating 
                                value={product.rating || 5} 
                                readOnly 
                                size="small"
                                sx={{ 
                                  '& .MuiRating-icon': { 
                                    fontSize: '1rem',
                                    color: '#FFD700'
                                  } 
                                }} 
                              />
                            </Box>
                          </Box>
                          <Button
                            variant="contained"
                            fullWidth
                            size="small"
                            onClick={() => {
                              setSelectedProduct(product);
                              setProductDetailOpen(true);
                            }}
                            sx={{
                              backgroundColor: '#C8626D',
                              '&:hover': { backgroundColor: '#B5555A' },
                              borderRadius: '10px',
                              py: 0.5,
                              px: 1,
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              minHeight: '32px'
                            }}
                          >
                            {t('home.viewDetails', 'View Details')}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <ProductCards showAll={false} />
            )}

            {/* Botón para ver más productos */}
            <Box sx={{ textAlign: 'center', mt: 6 }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outlined"
                  size="large"
                  href="/productos"
                  sx={{
                    borderColor: '#c8626d',
                    color: '#c8626d',
                    px: 4,
                    py: 1.5,
                    borderRadius: '25px',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    '&:hover': {
                      backgroundColor: '#c8626d',
                      color: 'white',
                      borderColor: '#c8626d',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(139, 69, 19, 0.3)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {t('home.viewAllCookies', 'View All Cookies')}
                </Button>
              </motion.div>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Banner 2 - Carga desde Firebase */}
      <Banner2 />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Product Detail Dialog */}
      <Dialog
        className="product-detail-mobile"
        open={productDetailOpen}
        onClose={() => setProductDetailOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: '20px',
            maxHeight: '90vh',
            backgroundColor: '#fafafa',
            border: '1px solid #e0e0e0',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        {selectedProduct && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ 
                  fontWeight: 700, 
                  color: '#c8626d',
                  fontFamily: '"Asap", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {selectedProduct.name}
                </Typography>
                <Button
                  onClick={() => setProductDetailOpen(false)}
                  sx={{ 
                    color: '#c8626d',
                    backgroundColor: 'rgba(200, 98, 109, 0.1)',
                    borderRadius: '50%',
                    minWidth: '40px',
                    width: '40px',
                    height: '40px',
                    '&:hover': {
                      backgroundColor: 'rgba(200, 98, 109, 0.2)'
                    }
                  }}
                >
                  ✕
                </Button>
              </Box>
            </DialogTitle>
            
            <DialogContent sx={{ p: 0 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: '500px' }}>
                {/* Lado Izquierdo - Imagen */}
                <Box sx={{ flex: 1, p: 3 }}>
                  <Box sx={{ width: '100%' }}>
                    {/* Imagen principal */}
                    <Box
                      component="img"
                      src={getProductImages()[currentImageIndex]}
                      alt={selectedProduct.name}
                      sx={{
                        width: '100%',
                        height: '400px',
                        objectFit: 'contain',
                        borderRadius: '15px',
                        backgroundColor: '#f8f9fa',
                        mb: 2
                      }}
                    />
                    
                    {/* Miniaturas de las imágenes */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1, 
                      justifyContent: 'center',
                      flexWrap: 'wrap'
                    }}>
                      {getProductImages().map((image, index) => (
                        <Box
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          sx={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: index === currentImageIndex ? '3px solid #C8626D' : '2px solid #ddd',
                            transition: 'all 0.3s',
                            backgroundColor: 'white',
                            '&:hover': {
                              borderColor: '#C8626D',
                              transform: 'scale(1.05)'
                            }
                          }}
                        >
                          <Box
                            component="img"
                            src={image}
                            alt={`Vista ${index + 1}`}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
                
                {/* Lado Derecho - Información */}
                <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#c8626d', mb: 2 }}>
                    ${selectedProduct.price}
                  </Typography>
                  
                  {/* Afterpay Messaging */}
                  {selectedProduct.price >= 1 && selectedProduct.price <= 4000 && (
                    <AfterpayMessaging amount={selectedProduct.price} />
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                    {selectedProduct.featured && <Chip label={t('product.featured', 'Featured')} color="primary" />}
                    {selectedProduct.bestSeller && <Chip label={t('product.bestSeller', 'Best Seller')} color="success" />}
                    {selectedProduct.isNew && <Chip label={t('product.new', 'New')} color="warning" />}
                  </Box>
                  
                  {selectedProduct.rating && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Rating value={selectedProduct.rating} readOnly sx={{ mr: 1 }} />
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        ({selectedProduct.reviews} {t('cart.reviews', 'reviews')})
                      </Typography>
                    </Box>
                  )}
                  
                  <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6, mb: 3, flex: 1 }}>
                    {selectedProduct.name && selectedProduct.name.toLowerCase().includes('ferrero') 
                      ? t('product.ferreroDescription', 'NY-style cookie with Ferrero Rocher...')
                      : t('product.defaultDescription', 'Delicious {name} with premium ingredients...', { name: selectedProduct.name })
                    }
                  </Typography>
                  
                  {selectedProduct.inventory !== undefined && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                        {t('product.stockAvailable', 'Stock available')}: {selectedProduct.inventory} {t('product.units', 'units')}
                      </Typography>
                      <Chip
                        label={
                          selectedProduct.inventory === 0 ? t('product.outOfStock', 'Out of Stock') :
                          selectedProduct.inventory < 10 ? t('product.lowStock', 'Low Stock') :
                          selectedProduct.inventory < 50 ? t('product.mediumStock', 'Medium Stock') : t('product.inStock', 'In Stock')
                        }
                        color={
                          selectedProduct.inventory === 0 ? 'error' :
                          selectedProduct.inventory < 10 ? 'warning' :
                          selectedProduct.inventory < 50 ? 'default' : 'success'
                        }
                      />
                    </Box>
                  )}
                </Box>
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 3 }}>
              <Button
                onClick={() => setProductDetailOpen(false)}
                sx={{ color: '#c8626d' }}
              >
                Close
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  // Agregar al carrito usando el contexto
                  addToCart(selectedProduct);
                  
                  // Cerrar el popup
                  setProductDetailOpen(false);
                }}
                sx={{
                  backgroundColor: '#C8626D',
                  '&:hover': { backgroundColor: '#B5555A' },
                  borderRadius: '25px',
                  px: 3,
                  py: 1.5,
                  fontWeight: 600
                }}
              >
                {t('product.addToCart', 'Add to Cart')}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Popup Hero */}
      <PopupHero
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
      />

    </Box>
  );
};

export default Home;
