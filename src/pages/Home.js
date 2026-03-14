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
import BoxSelectionPopup from '../components/BoxSelectionPopup';
import FeaturedProducts from '../components/FeaturedProducts';
import VideoReviewsCarousel from '../components/VideoReviewsCarousel';
import ComparisonTable from '../components/ComparisonTable';
import CookieBoxPromo from '../components/CookieBoxPromo';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, limit, doc, onSnapshot } from 'firebase/firestore';

const Home = () => {
  const { featuredProducts, products, productsLoading, addToCart } = useStore();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isBrittanyLoaded, setIsBrittanyLoaded] = useState(false);
  const [popupHeroOpen, setPopupHeroOpen] = useState(false);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [showBoxPopup, setShowBoxPopup] = useState(false);
  const [selectedBoxProduct, setSelectedBoxProduct] = useState(null);
  const [showPromo, setShowPromo] = useState(false);
  const [bannerUrl, setBannerUrl] = useState(null);
  const [banner2Url, setBanner2Url] = useState(null);
  const [dynamicBannerText, setDynamicBannerText] = useState(null);
  
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

  useEffect(() => {
    // Escuchar cambios en Banner 1
    const bannerPhotosRef = collection(db, 'bannerPhotos');
    const q1 = query(bannerPhotosRef, where('isActive', '==', true), orderBy('order', 'asc'), limit(1));
    
    const unsubscribe1 = onSnapshot(q1, (snap) => {
      if (!snap.empty) {
        setBannerUrl(snap.docs[0].data().imageUrl);
      } else {
        // Fallback: si no hay activas, buscar cualquiera
        const qFallback = query(bannerPhotosRef, limit(1));
        const unsubscribeFallback = onSnapshot(qFallback, (snapFallback) => {
          if (!snapFallback.empty) {
            setBannerUrl(snapFallback.docs[0].data().imageUrl);
          } else {
            setBannerUrl('none');
          }
        });
        return () => unsubscribeFallback();
      }
    });

    // Escuchar cambios en Banner 2
    const banner2PhotosRef = collection(db, 'banner2Photos');
    const q2 = query(banner2PhotosRef, where('isActive', '==', true), orderBy('order', 'asc'), limit(1));
    const unsubscribe2 = onSnapshot(q2, (snap) => {
      if (!snap.empty) {
        setBanner2Url(snap.docs[0].data().imageUrl);
      } else {
        setBanner2Url('none');
      }
    });

    // Escuchar cambios en Texto del Banner
    const settingsRef = doc(db, 'settings', 'bannerText');
    const unsubscribeText = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        setDynamicBannerText(snap.data());
      } else {
        setDynamicBannerText(null);
      }
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribeText();
    };
  }, []);

  const handleOpenDetail = (product) => {
    if (product.category === 'boxes') {
      setSelectedBoxProduct(product);
      setShowBoxPopup(true);
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
    // Trigger promo after hero closes
    setTimeout(() => {
      setShowPromo(true);
    }, 800);
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
      <CookieBoxPromo open={showPromo} onClose={() => setShowPromo(false)} />
      <Box sx={{ position: 'relative', width: '100%' }}>
        <Box
          component="img"
          src="/banersin.jpg"
          alt="Banner Delizukar"
          sx={{ width: '100%', display: 'block' }}
        />
        
        {/* Texto Flotante sobre el Banner */}
        {dynamicBannerText && (
          <Box
            sx={{
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80%',
              textAlign: 'center',
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            <Typography
              sx={{
                fontFamily: dynamicBannerText.fontFamily || 'BrittanySignature',
                fontSize: { 
                  xs: `${(dynamicBannerText.fontSize || 4.5) * 0.36}rem`, 
                  md: `${(dynamicBannerText.fontSize || 4.5) * 0.9}rem` 
                },
                color: '#c8626d',
                textShadow: '1px 1px 4px rgba(0,0,0,0.2)',
                lineHeight: 1.2
              }}
            >
              {dynamicBannerText[language] || dynamicBannerText.es}
            </Typography>
          </Box>
        )}
      </Box>
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
          {dynamicBannerText ? (dynamicBannerText[language] || dynamicBannerText.es) : copy.bannerMessage}
        </Box>
      </Box>
      <FeaturedProducts onOpenDetail={handleOpenDetail} />
      {banner2Url && banner2Url !== 'none' && (
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
            src={banner2Url}
            alt="Banner secundario"
            sx={{ width: '100%', display: 'block' }}
          />
        </Box>
      )}
      <Box sx={{ mt: { xs: 4, md: 6 }, textAlign: 'center' }}>
        <Typography
          sx={{
            fontFamily: 'BrittanySignature',
            fontSize: { xs: '2rem', md: '2.6rem' },
            color: '#c8626d'
          }}
        >
          {{
            es: 'Nuestros Clientes Felices',
            en: 'Our Happy Clients',
            fr: 'Nos clients heureux',
            pt: 'Nossos clientes felizes'
          }[language] || 'Nuestros Clientes Felices'}
        </Typography>
      </Box>
      <Box sx={{ mt: { xs: 4, md: 6 } }}>
        <TestimonialsSection />
      </Box>

      {/* Video Reviews Carousel Section */}
      <VideoReviewsCarousel />

      {/* Comparison Table Section */}
      <ComparisonTable />

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
                  {selectedProduct[`name_${language}`] || selectedProduct.name}
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
                {(selectedProduct[`description_${language}`] || selectedProduct.description) && (
                  <Typography variant="body2" sx={{ color: '#555', lineHeight: 1.6, mb: 3 }}>
                    {selectedProduct[`description_${language}`] || selectedProduct.description}
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
      
      <BoxSelectionPopup 
        open={showBoxPopup}
        onClose={() => setShowBoxPopup(false)}
        selectedBox={selectedBoxProduct}
      />
    </Box>
  );
};

export default Home;

