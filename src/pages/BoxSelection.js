import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, Container, Typography, Grid, Card, CardContent, 
  Button, IconButton, Badge, Divider, LinearProgress,
  Paper, useTheme, alpha, Tooltip, Zoom
} from '@mui/material';
import { 
  Add, Remove, ShoppingCart, ArrowBack, 
  Info, CheckCircle, HelpOutline, AutoAwesome
} from '@mui/icons-material';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import GiftMessageModal from '../components/GiftMessageModal';
import { PRODUCT_TRANSLATIONS } from './Products';
import ProductImage from '../components/ProductImage';
import { FavoriteBorder } from '@mui/icons-material';

const TEXTS = {
  es: {
    title: 'Arma tu Sweet Box',
    subtitle: 'Elige las galletas para completar tu caja de',
    cookies: 'galletas',
    remaining: 'Te faltan',
    ready: '¡Caja lista!',
    addToCart: 'Agregar caja al carrito',
    totalItems: 'Total seleccionado',
    back: 'Volver a productos',
    emptyBox: 'Tu caja está vacía',
    maxReached: 'Ya completaste tu caja',
    cookieLimit: 'Límite alcanzado',
    added: 'Caja agregada al carrito con éxito'
  },
  en: {
    title: 'Build your Sweet Box',
    subtitle: 'Choose the cookies to complete your box of',
    cookies: 'cookies',
    remaining: 'Remaining',
    ready: 'Box ready!',
    addToCart: 'Add box to cart',
    totalItems: 'Total selected',
    back: 'Back to products',
    emptyBox: 'Your box is empty',
    maxReached: 'Box is full',
    cookieLimit: 'Limit reached',
    added: 'Box added to cart successfully'
  }
};

const BoxSelection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { language } = useLanguage();
  const { products, addToCart } = useStore();
  
  const [selectedCookies, setSelectedCookies] = useState({});
  const [loading, setLoading] = useState(true);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [pendingBox, setPendingBox] = useState(null);

  const translatedTexts = useMemo(() => TEXTS[language] || TEXTS.es, [language]);

  // Encontrar el producto de la caja
  const boxProduct = useMemo(() => 
    products.find(p => p.id === id), 
  [products, id]);

  // Determinar capacidad de la caja (extraer del nombre si no está en metadata)
  const boxCapacity = useMemo(() => {
    if (!boxProduct) return 0;
    const match = boxProduct.name.match(/(\d+)/);
    return match ? parseInt(match[0]) : 0;
  }, [boxProduct]);

  // Filtrar solo galletas individuales (no otras cajas o accesorios)
  const availableCookies = useMemo(() => 
    products.filter(p => 
      p.category !== 'boxes' && 
      p.category !== 'regalo' && 
      p.active !== false
    ), 
  [products]);

  const totalSelected = Object.values(selectedCookies).reduce((a, b) => a + b, 0);
  const isComplete = totalSelected === boxCapacity;

  useEffect(() => {
    if (products.length > 0) {
      setLoading(false);
      if (!boxProduct) {
        toast.error('Caja no encontrada');
        navigate('/productos');
      }
    }
  }, [products, boxProduct, navigate]);

  const handleAdd = (cookieId) => {
    if (totalSelected >= boxCapacity) {
      toast.error(translatedTexts.maxReached);
      return;
    }
    setSelectedCookies(prev => ({
      ...prev,
      [cookieId]: (prev[cookieId] || 0) + 1
    }));
  };

  const handleRemove = (cookieId) => {
    if (!selectedCookies[cookieId]) return;
    setSelectedCookies(prev => {
      const newVal = prev[cookieId] - 1;
      const updated = { ...prev };
      if (newVal <= 0) delete updated[cookieId];
      else updated[cookieId] = newVal;
      return updated;
    });
  };

  const handleSaveToCart = () => {
    if (!isComplete) {
      toast.error(`${translatedTexts.remaining} ${boxCapacity - totalSelected} ${translatedTexts.cookies}`);
      return;
    }

    // Crear un item de carrito especial con los detalles de las galletas
    const cookiesDetails = Object.entries(selectedCookies).map(([cookieId, qty]) => {
      const cookie = availableCookies.find(c => c.id === cookieId);
      return {
        id: cookieId,
        name: cookie.name,
        quantity: qty
      };
    });

    const customBox = {
      ...boxProduct,
      id: `${boxProduct.id}-${Date.now()}`, // Usamos un ID único para el carrito
      baseId: boxProduct.id, // Guardamos el ID original por si acaso
      selectedCookies: cookiesDetails,
      // Metadata para mostrar en el carrito
      description_extra: cookiesDetails.map(c => {
        const translatedName = PRODUCT_TRANSLATIONS[language]?.[c.name]?.name || c.name;
        return `${c.quantity}x ${translatedName}`;
      }).join(', ')
    };

    setPendingBox(customBox);
    setShowGiftModal(true);
  };

  const handleGiftConfirm = (giftData) => {
    if (pendingBox) {
      addToCart(pendingBox);
      
      // Añadir el producto de regalo con los detalles como metadata
      const giftItem = {
        ...giftData.product,
        id: `${giftData.product.id}-${Date.now()}`,
        giftDetails: giftData.details,
        description_extra: `Para: ${giftData.details.to} - De: ${giftData.details.from} - Mensaje: ${giftData.details.message}`
      };
      
      addToCart(giftItem);
      
      toast.success(translatedTexts.added);
      setShowGiftModal(false);
      navigate('/carrito');
    }
  };

  const handleGiftSkip = () => {
    if (pendingBox) {
      addToCart(pendingBox);
      toast.success(translatedTexts.added);
      setShowGiftModal(false);
      navigate('/carrito');
    }
  };

  if (loading || !boxProduct) return <Box sx={{ p: 5, textAlign: 'center' }}><LinearProgress /></Box>;

  return (
    <Box sx={{ pb: 8, pt: { xs: 12, md: 24 }, backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {/* Header Seccion */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Button 
            startIcon={<ArrowBack />} 
            onClick={() => navigate('/productos')}
            sx={{ mb: 3, color: 'text.secondary' }}
          >
            {translatedTexts.back}
          </Button>

          <Box sx={{ mb: 5, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ 
              fontFamily: 'BrittanySignature', 
              color: '#c8626d',
              fontSize: { xs: '2.5rem', md: '4rem' },
              mb: 1
            }}>
              {translatedTexts.title}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {translatedTexts.subtitle} <strong>{boxCapacity}</strong> {translatedTexts.cookies}
            </Typography>
          </Box>
        </motion.div>

        {/* Barra de Progreso Sticky */}
        <Paper elevation={3} sx={{ 
          position: 'sticky', 
          top: { xs: 70, md: 130 }, 
          zIndex: 10, 
          p: 2, 
          mb: 4, 
          borderRadius: 4,
          backgroundColor: alpha('#fff', 0.9),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${isComplete ? theme.palette.success.light : theme.palette.divider}`
        }}>
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1" fontWeight="bold">
                  {isComplete ? translatedTexts.ready : `${translatedTexts.totalItems}: ${totalSelected} / ${boxCapacity}`}
                </Typography>
                <Box color={isComplete ? 'success.main' : 'text.secondary'}>
                  {isComplete && <CheckCircle sx={{ verticalAlign: 'middle' }} />}
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(totalSelected / boxCapacity) * 100} 
                color={isComplete ? "success" : "primary"}
                sx={{ height: 12, borderRadius: 6 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                disabled={!isComplete}
                startIcon={<ShoppingCart />}
                onClick={handleSaveToCart}
                sx={{ 
                  borderRadius: '30px',
                  py: 1.5,
                  backgroundColor: isComplete ? '#c8626d' : 'grey.400',
                  '&:hover': { backgroundColor: '#b25763' }
                }}
              >
                {translatedTexts.addToCart}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Grid de Galletas para elegir */}
        <Grid container spacing={3} className="products-grid-mobile" sx={{ 
          display: 'grid',
          gridTemplateColumns: { 
            xs: 'repeat(2, 1fr)', 
            sm: 'repeat(3, 1fr)', 
            md: 'repeat(4, 1fr)' 
          },
          gap: 2,
          mt: 2
        }}>
          {availableCookies.map((cookie, index) => (
            <Box key={cookie.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="product-card-mobile"
                  sx={{ 
                    width: '100%',
                    maxWidth: '100%',
                    height: '320px',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    border: selectedCookies[cookie.id] ? `2px solid #c8626d` : 'none',
                    '&:hover': {
                      boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
                      transform: 'translateY(-5px)'
                    }
                  }}>
                  <Box className="product-image-container" sx={{ position: 'relative', overflow: 'hidden' }}>
                    <ProductImage
                      src={cookie.image}
                      alt={cookie.name}
                      height={180}
                      sx={{
                        transition: 'transform 0.3s ease',
                        transform: 'translateY(0px)',
                        '&:hover': {
                          transform: 'translateY(0px) scale(1.05)'
                        }
                      }}
                    />
                    {selectedCookies[cookie.id] > 0 && (
                      <Badge 
                        badgeContent={selectedCookies[cookie.id]} 
                        color="primary"
                        sx={{ 
                          position: 'absolute', 
                          top: 20, 
                          right: 20,
                          '& .MuiBadge-badge': { 
                            fontSize: '1rem', 
                            height: 25, 
                            minWidth: 25, 
                            borderRadius: '50%',
                            backgroundColor: '#c8626d'
                          } 
                        }}
                      />
                    )}
                  </Box>

                  <CardContent sx={{ flexGrow: 0, p: 1.5, transform: 'translateY(-10px)', textAlign: 'center' }}>
                    <Typography 
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        mb: 0.5,
                        color: '#333',
                        fontSize: '1rem',
                        transform: 'translateY(5px)',
                        fontFamily: '"Asap", sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: '40px'
                      }}
                    >
                      {PRODUCT_TRANSLATIONS[language]?.[cookie.name]?.name || cookie[`name_${language}`] || cookie.name}
                    </Typography>
                  </CardContent>

                  <Box sx={{ p: 1, pt: 0, mt: 'auto', transform: 'translateY(-10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleRemove(cookie.id)}
                      disabled={!selectedCookies[cookie.id]}
                      sx={{ backgroundColor: '#f0f0f0' }}
                    >
                      <Remove fontSize="small" />
                    </IconButton>
                    
                    <Typography variant="h6" sx={{ minWidth: 25, fontWeight: 700, textAlign: 'center' }}>
                      {selectedCookies[cookie.id] || 0}
                    </Typography>
                    
                    <IconButton 
                      size="small" 
                      onClick={() => handleAdd(cookie.id)}
                      disabled={isComplete}
                      sx={{ 
                        backgroundColor: isComplete ? '#f0f0f0' : '#c8626d20',
                        color: isComplete ? 'grey.400' : '#c8626d'
                      }}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </Box>
                </Card>
              </motion.div>
            </Box>
          ))}
        </Grid>
      </Container>

      {/* Quick Summary Mobile (Bottom Bar) */}
      <Box sx={{ 
        display: { xs: 'block', md: 'none' }, 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 100,
        backgroundColor: '#fff',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
        p: 2
      }}>
        <Button
          variant="contained"
          fullWidth
          disabled={!isComplete}
          onClick={handleSaveToCart}
          sx={{ borderRadius: 25, py: 1.5, backgroundColor: '#c8626d' }}
        >
          {isComplete ? translatedTexts.addToCart : `${translatedTexts.remaining} ${boxCapacity - totalSelected}`}
        </Button>
      </Box>
      <GiftMessageModal 
        open={showGiftModal} 
        onClose={() => setShowGiftModal(false)}
        onConfirm={handleGiftConfirm}
        onSkip={handleGiftSkip}
      />
    </Box>
  );
};

export default BoxSelection;
