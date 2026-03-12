import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CardMedia,
  Dialog,
  DialogContent,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Close, ShoppingBag } from '@mui/icons-material';
import Rating from '@mui/material/Rating';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import PopupHero from '../components/PopupHero';
import TestimonialsSection from '../components/TestimonialsSection';
import ProductImage from '../components/ProductImage';

const Home = () => {
  const { featuredProducts, products, productsLoading, addToCart } = useStore();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isBrittanyLoaded, setIsBrittanyLoaded] = useState(false);
  const [popupHeroOpen, setPopupHeroOpen] = useState(false);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const translations = {
    es: {
      bannerMessage: 'DeliZuKar: el Wi-Fi de tu corazón (siempre te conecta a la felicidad).',
      featuredTitle: 'Galletas Destacadas',
      viewDetails: 'Ver detalles',
      addToCart: 'Agregar al carrito',
      noFeatured: 'Aún no hay suficientes galletas destacadas para mostrar.'
    },
    en: {
      bannerMessage: 'DeliZuKar: your heart’s Wi-Fi (always connects you to happiness).',
      featuredTitle: 'Featured Cookies',
      viewDetails: 'View details',
      addToCart: 'Add to cart',
      noFeatured: 'Not enough featured cookies to display yet.'
    },
    fr: {
      bannerMessage: 'DeliZuKar : le Wi-Fi de ton cœur (toujours connecté au bonheur).',
      featuredTitle: 'Biscuits en vedette',
      viewDetails: 'Voir les détails',
      addToCart: 'Ajouter au panier',
      noFeatured: 'Pas encore assez de biscuits en vedette à afficher.'
    },
    pt: {
      bannerMessage: 'DeliZuKar: o Wi-Fi do seu coração (sempre conecta você à felicidade).',
      featuredTitle: 'Cookies em destaque',
      viewDetails: 'Ver detalhes',
      addToCart: 'Adicionar ao carrinho',
      noFeatured: 'Ainda não há cookies em destaque suficientes para mostrar.'
    }
  };

  const copy = translations[language] || translations.es;

  useEffect(() => {
    let isMounted = true;

    const loadFont = async () => {
      try {
        if (document?.fonts?.load) {
          await Promise.all([
            document.fonts.load("400 24px BrittanySignature"),
            document.fonts.load("1em BrittanySignature")
          ]);
        } else if (document?.fonts?.ready) {
          await document.fonts.ready;
        }
      } catch (error) {
        console.warn('No se pudo cargar BrittanySignature a través de document.fonts:', error);
      } finally {
        if (isMounted) {
          setIsBrittanyLoaded(true);
        }
      }
    };

    loadFont();

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredItems = useMemo(() => {
    if (productsLoading) return [];
    const availableFeatured = featuredProducts.length > 0
      ? featuredProducts
      : products.filter((product) => product.featured);
    const additionalItems = products.filter(
      (product) => !availableFeatured.some((featured) => featured.id === product.id)
    );
    return [...availableFeatured, ...additionalItems].slice(0, 4);
  }, [featuredProducts, products, productsLoading]);

  const handleOpenDetail = (product) => {
    if (product.category === 'boxes') {
      navigate(`/armar-caja/${product.id}`);
    } else {
      setSelectedProduct(product);
    }
  };

  const handleCloseDetail = () => {
    setSelectedProduct(null);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPopupHeroOpen(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleClosePopupHero = () => {
    setPopupHeroOpen(false);
  };

  return (
    <Box sx={{
      width: '100vw',
      position: 'relative',
      left: '50%',
      right: '50%',
      marginLeft: '-50vw',
      marginRight: '-50vw',
      marginTop: { xs: '16px', md: '72px', lg: '96px' }
    }}>
      <PopupHero open={popupHeroOpen} onClose={handleClosePopupHero} />
      <Box
        component="img"
        src="/banner.jpg"
        alt="Banner principal"
        sx={{ width: '100%', display: 'block' }}
      />
      <Box
        sx={{
          backgroundColor: '#c8626d',
          color: 'white',
          py: { xs: 1.4, md: 1.8 },
          display: 'flex',
          justifyContent: 'center',
          px: 2
        }}
      >
        <Box
          component="span"
          sx={{
            fontSize: { xs: '0.65rem', md: '1.3rem' },
            letterSpacing: { xs: '0.02em', md: '0.05em' },
            whiteSpace: 'nowrap'
          }}
        >
          {copy.bannerMessage}
        </Box>
      </Box>
      <Box sx={{ mt: { xs: 3, md: 4 }, textAlign: 'center', minHeight: '48px' }}>
        <span
          style={{
            fontFamily: 'BrittanySignature',
            fontSize: '2.4rem',
            color: '#c8626d',
            visibility: isBrittanyLoaded ? 'visible' : 'hidden'
          }}
        >
          {copy.featuredTitle}
        </span>
      </Box>
      {!productsLoading && featuredItems.length > 0 && (
        <Box sx={{ px: { xs: 2, md: 4 }, mt: { xs: 3, md: 5 }, pb: { xs: 4, md: 6 }, display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ width: '100%', maxWidth: { md: '900px', lg: '1100px' } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))'
              },
              gap: { xs: 2, md: 3, lg: 4 }
            }}
          >
            {featuredItems.map((item) => (
              <Card
                key={item.id}
                sx={{
                  borderRadius: '18px',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
                  height: '100%'
                }}
              >
                <Box sx={{ height: { xs: 160, md: 180 }, overflow: 'hidden' }}>
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#c8626d', fontFamily: 'Asap', fontSize: '1rem', textAlign: 'center' }}>
                    {item.name}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#4a4a4a' }}>
                    ${Number(item.price || 0).toFixed(2)}
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{ backgroundColor: '#c8626d', borderRadius: '20px', px: 3 }}
                    onClick={() => handleOpenDetail(item)}
                  >
                    {copy.viewDetails}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
          </Box>
        </Box>
      )}
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
            '&:hover': {
              backgroundColor: '#c8626d',
              color: '#fff',
              borderColor: '#c8626d'
            }
          }}
        >
          {language === 'es' && 'Ver todas las galletas'}
          {language === 'en' && 'View all cookies'}
          {language === 'fr' && 'Voir tous les biscuits'}
          {language === 'pt' && 'Ver todos os cookies'}
        </Button>
      </Box>
      <Box
        sx={{
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          mt: { xs: 4, md: 6 }
        }}
      >
        <Box
          component="img"
          src="/banner2.jpg"
          alt="Banner secundario"
          sx={{ width: '100%', display: 'block' }}
        />
       </Box>
      <Box sx={{ mt: { xs: 4, md: 6 }, textAlign: 'center' }}>
        <Typography
          sx={{
            fontFamily: 'BrittanySignature',
            fontSize: { xs: '2rem', md: '2.6rem' },
            color: '#c8626d'
          }}
        >
          {language === 'es' && 'Nuestros Clientes Felices'}
          {language === 'en' && 'Our Happy Clients'}
          {language === 'fr' && 'Nos clients heureux'}
          {language === 'pt' && 'Nossos clientes felizes'}
        </Typography>
      </Box>
      <Box sx={{ mt: { xs: 4, md: 6 } }}>
        <TestimonialsSection />
      </Box>

      <Dialog
        open={Boolean(selectedProduct)}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            backgroundColor: '#fafafa',
            border: '1px solid #e0e0e0',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            aria-label="Cerrar"
            onClick={handleCloseDetail}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1,
              backgroundColor: 'rgba(200, 98, 109, 0.1)',
              color: '#c8626d',
              '&:hover': {
                backgroundColor: 'rgba(200, 98, 109, 0.2)'
              }
            }}
          >
            <Close />
          </IconButton>
          {selectedProduct && (
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
              <Box sx={{ flexBasis: { md: '50%' }, flexShrink: 0, height: { xs: 240, md: 420 }, overflow: 'hidden' }}>
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
              <Box sx={{ flex: 1, p: { xs: 2.5, md: 4 } }}>
                <Typography sx={{ fontWeight: 700, mb: 1, color: '#333', fontFamily: 'Asap', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {selectedProduct.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  {selectedProduct.rating && (
                    <Rating value={Number(selectedProduct.rating)} precision={0.1} readOnly size="small" sx={{ color: '#FFD700' }} />
                  )}
                  {selectedProduct.reviews && (
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      ({selectedProduct.reviews})
                    </Typography>
                  )}
                </Box>
                <Typography sx={{ fontWeight: 700, color: '#c8626d', mb: 2, fontSize: '1.4rem' }}>
                  ${Number(selectedProduct.price || 0).toFixed(2)}
                </Typography>
                {selectedProduct.description && (
                  <Typography variant="body2" sx={{ color: '#555', lineHeight: 1.6, mb: 3 }}>
                    {selectedProduct.description}
                  </Typography>
                )}
                <Divider sx={{ mb: 3 }} />
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<ShoppingBag />}
                  sx={{
                    backgroundColor: '#c8626d',
                    textTransform: 'none',
                    fontWeight: 700,
                    py: 1.4,
                    '&:hover': {
                      backgroundColor: '#b25763'
                    }
                  }}
                  onClick={() => {
                    if (selectedProduct.category === 'boxes') {
                      navigate(`/armar-caja/${selectedProduct.id}`);
                    } else {
                      addToCart(selectedProduct);
                    }
                    handleCloseDetail();
                  }}
                >
                  {copy.addToCart}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Home;

