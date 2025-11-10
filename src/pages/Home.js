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
  Divider
} from '@mui/material';
import { Close, ShoppingBag } from '@mui/icons-material';
import Rating from '@mui/material/Rating';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
  const { featuredProducts, products, productsLoading, addToCart } = useStore();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isBrittanyLoaded, setIsBrittanyLoaded] = useState(false);
  const { language } = useLanguage();

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
    setSelectedProduct(product);
  };

  const handleCloseDetail = () => {
    setSelectedProduct(null);
  };

  return (
    <Box sx={{
      width: '100vw',
      position: 'relative',
      left: '50%',
      right: '50%',
      marginLeft: '-50vw',
      marginRight: '-50vw',
      marginTop: { xs: '16px', md: '24px' }
    }}>
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
          py: 1.2,
          display: 'flex',
          justifyContent: 'center',
          px: 2
        }}
      >
        <span style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{copy.bannerMessage}</span>
      </Box>
      <Box sx={{ mt: { xs: 3, md: 4 }, textAlign: 'center', minHeight: '48px' }}>
        <span
          style={{
            fontFamily: 'BrittanySignature',
            fontSize: '2.1rem',
            color: '#c8626d',
            visibility: isBrittanyLoaded ? 'visible' : 'hidden'
          }}
        >
          {copy.featuredTitle}
        </span>
      </Box>
      {!productsLoading && featuredItems.length > 0 && (
        <Box sx={{ px: { xs: 2, md: 6 }, mt: { xs: 3, md: 4 }, pb: { xs: 4, md: 6 } }}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: { xs: 2, md: 3 },
              justifyContent: 'center'
            }}
          >
            {featuredItems.map((item) => (
              <Card
                key={item.id}
                sx={{
                  borderRadius: '18px',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
                  flex: { xs: '0 1 calc(50% - 8px)', md: '0 1 calc(50% - 12px)' }
                }}
              >
                <CardMedia
                  component="img"
                  image={item.image}
                  alt={item.name}
                  sx={{ width: '100%', height: 180, objectFit: 'cover' }}
                />
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
      )}

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
              <Box sx={{ flexBasis: { md: '50%' }, flexShrink: 0 }}>
                <Box sx={{ height: '100%', minHeight: { xs: 240, md: 420 }, overflow: 'hidden' }}>
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </Box>
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
                    addToCart(selectedProduct);
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

