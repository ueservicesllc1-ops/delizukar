import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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
  useMediaQuery,
  Rating
} from '@mui/material';
import { Close, ShoppingBag } from '@mui/icons-material';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import PopupHero from '../components/PopupHero';
import TestimonialsSection from '../components/TestimonialsSection';
import ProductImage from '../components/ProductImage';
import BoxSelectionPopup from '../components/BoxSelectionPopup';
import FeaturedProducts from '../components/FeaturedProducts';
import ComparisonTable from '../components/ComparisonTable';
import CookieBoxPromo from '../components/CookieBoxPromo';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, limit, doc, onSnapshot } from 'firebase/firestore';

const Home = () => {
  const { products, productsLoading, addToCart } = useStore();
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
  const [heroText, setHeroText] = useState(null);
  
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const translations = {
    es: {
      bannerMessage: 'DeliZuKar: el Wi-Fi de tu corazón (siempre te conecta a la felicidad).',
      featuredTitle: 'Galletas Destacadas',
      viewDetails: 'Ver detalles',
      addToCart: 'Agregar al carrito',
      noFeatured: 'Aún no hay suficientes galletas destacadas para mostrar.',
      cookieWeightChip: 'Entre 180g y 200g de puro antojo en cada galleta'
    },
    en: {
      bannerMessage: 'DeliZuKar: your heart’s Wi-Fi (always connects you to happiness).',
      featuredTitle: 'Featured Cookies',
      viewDetails: 'View details',
      addToCart: 'Add to cart',
      noFeatured: 'Not enough featured cookies to display yet.',
      cookieWeightChip: 'Between 180g and 200g of pure craving in every cookie'
    }
  };

  const copy = translations[language] || translations.es;

  // Carga de fuente
  useEffect(() => {
    let isMounted = true;
    const loadFont = async () => {
      try {
        if (document?.fonts?.load) {
          await Promise.all([
            document.fonts.load("400 24px BrittanySignature"),
            document.fonts.load("1em BrittanySignature")
          ]);
        }
      } catch (error) {
        console.warn('Error font load:', error);
      } finally {
        if (isMounted) setIsBrittanyLoaded(true);
      }
    };
    loadFont();
    return () => { isMounted = false; };
  }, []);

  // Firebase listeners
  useEffect(() => {
    const bannerPhotosRef = collection(db, 'bannerPhotos');
    const q1 = query(bannerPhotosRef, where('isActive', '==', true), orderBy('order', 'asc'), limit(1));
    const unsubscribe1 = onSnapshot(q1, (snap) => {
      if (!snap.empty) setBannerUrl(snap.docs[0].data().imageUrl);
      else setBannerUrl('none');
    });

    const banner2PhotosRef = collection(db, 'banner2Photos');
    const q2 = query(banner2PhotosRef, where('isActive', '==', true), orderBy('order', 'asc'), limit(1));
    const unsubscribe2 = onSnapshot(q2, (snap) => {
      if (!snap.empty) setBanner2Url(snap.docs[0].data().imageUrl);
      else setBanner2Url('none');
    });

    const settingsRef = doc(db, 'settings', 'bannerText');
    const unsubscribeText = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) setDynamicBannerText(snap.data());
    });

    const heroTextRef = doc(db, 'settings', 'heroText');
    const unsubscribeHeroText = onSnapshot(heroTextRef, (snap) => {
      if (snap.exists()) setHeroText(snap.data());
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribeText();
      unsubscribeHeroText();
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

  const handleCloseDetail = () => setSelectedProduct(null);

  useEffect(() => {
    const timer = setTimeout(() => setPopupHeroOpen(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleClosePopupHero = () => {
    setPopupHeroOpen(false);
    setTimeout(() => setShowPromo(true), 800);
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
      
      {/* Banner Section */}
      <Box sx={{ position: 'relative', width: '100%' }}>
        <Box
          component="img"
          src="/banersin.jpg"
          alt="Banner Delizukar"
          sx={{ width: '100%', display: 'block' }}
        />
        
        {/* Chip de peso fijo solicitado con micro-animación */}
        <Box
          component={motion.div}
          animate={{ 
            y: [0, -8, 0],
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          sx={{
            position: 'absolute',
            left: { md: '5%', lg: '8%' },
            top: { md: '18%', lg: '25%' }, 
            display: { xs: 'none', md: 'block' },
            zIndex: 15
          }}
        >
          <Box
            sx={{
              backgroundColor: '#c8626d',
              color: 'white',
              fontWeight: 800,
              fontSize: { xs: '0.4rem', sm: '0.65rem', md: '0.52rem', lg: '0.7rem' },
              px: { xs: 1.0, sm: 1.8, md: 1.4, lg: 1.6 },
              py: { xs: 0.7, sm: 0.9, md: 0.6, lg: 0.7 },
              borderRadius: '999px',
              border: '1px solid white',
              boxShadow: '0 6px 20px rgba(200, 98, 109, 0.4)',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              lineHeight: 1.2,
              maxWidth: { xs: '70px', md: 'none' },
              whiteSpace: { xs: 'normal', md: 'nowrap' }
            }}
          >
            {copy.cookieWeightChip}
          </Box>
        </Box>
        
        {/* Texto Flotante sobre el Banner */}
        {heroText && (
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
                fontFamily: heroText.fontFamily || 'BrittanySignature',
                fontSize: { 
                  xs: `${(heroText.fontSize || 4.5) * 0.36}rem`, 
                  md: `${(heroText.fontSize || 4.5) * 0.9}rem` 
                },
                color: '#c8626d',
                textShadow: '1px 1px 4px rgba(0,0,0,0.2)',
                lineHeight: 1.2
              }}
            >
              {heroText[language] || heroText.es}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Barra Rosa */}
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
        <Typography
          sx={{
            fontSize: { xs: '0.65rem', md: '1.3rem' },
            letterSpacing: { xs: '0.02em', md: '0.05em' },
            textAlign: 'center',
            fontWeight: 500
          }}
        >
          {dynamicBannerText ? (dynamicBannerText[language] || dynamicBannerText.es) : copy.bannerMessage}
        </Typography>
      </Box>

      {/* Productos */}
      <FeaturedProducts onOpenDetail={handleOpenDetail} />

      {/* Segundo Banner */}
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

      {/* Clientes Felices */}
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
            en: 'Our Happy Clients'
          }[language] || 'Nuestros Clientes Felices'}
        </Typography>
      </Box>

      <Box sx={{ mt: { xs: 4, md: 6 } }}>
        <TestimonialsSection />
      </Box>

      <ComparisonTable />

      {/* Modal Detalle */}
      <Dialog
        open={Boolean(selectedProduct)}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            backgroundColor: '#fafafa',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={handleCloseDetail}
            sx={{
              position: 'absolute', top: 8, right: 8, zIndex: 1,
              backgroundColor: 'rgba(200, 98, 109, 0.1)', color: '#c8626d'
            }}
          >
            <Close />
          </IconButton>
          {selectedProduct && (
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
              <Box sx={{ flexBasis: { md: '50%' }, height: { xs: 240, md: 420 }, overflow: 'hidden' }}>
                <ProductImage src={selectedProduct.image} alt={selectedProduct.name} />
              </Box>
              <Box sx={{ flex: 1, p: { xs: 2.5, md: 4 } }}>
                <Typography sx={{ fontWeight: 700, mb: 1, color: '#333', textTransform: 'uppercase' }}>
                  {selectedProduct[`name_${language}`] || selectedProduct.name}
                </Typography>
                <Typography sx={{ fontWeight: 700, color: '#c8626d', mb: 2, fontSize: '1.4rem' }}>
                  ${Number(selectedProduct.price || 0).toFixed(2)}
                </Typography>
                <Button
                  variant="contained" fullWidth startIcon={<ShoppingBag />}
                  sx={{ backgroundColor: '#c8626d', textTransform: 'none', fontWeight: 700, py: 1.4 }}
                  onClick={() => { addToCart(selectedProduct); handleCloseDetail(); }}
                >
                  {language === 'es' ? 'Agregar al carrito' : 'Add to cart'}
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
