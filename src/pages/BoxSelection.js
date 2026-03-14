import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, Container, Typography, Grid, Card, CardContent, 
  Button, IconButton, Badge, Divider, LinearProgress,
  Paper, useTheme, alpha, Tooltip, Zoom, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { 
  Add, Remove, ShoppingCart, ArrowBack, 
  Info, CheckCircle, HelpOutline, AutoAwesome, ExpandMore
} from '@mui/icons-material';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import GiftMessageModal from '../components/GiftMessageModal';
import ProductImage from '../components/ProductImage';
// import VideoReviewsCarousel from '../components/VideoReviewsCarousel';
import ComparisonTable from '../components/ComparisonTable';
import { FavoriteBorder } from '@mui/icons-material';
import { PRODUCT_TRANSLATIONS } from './Products';

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
    added: 'Caja agregada al carrito con éxito',
    aboutTitle: 'Recién horneadas para ti',
    aboutContent: 'En Delizukar no hacemos cookies para almacenar. Cada pedido se hornea al momento con ingredientes de primera calidad. Luego las sellamos para que lleguen a tu puerta tan frescas como salieron del horno. Crujientes por fuera. Suaves y fundentes por dentro. Así debe ser una verdadera cookie.',
    differentTitle: '¿Por qué Delizukar?',
    differentContent: 'Porque las buenas cookies empiezan con ingredientes reales. Mantequilla de verdad. Huevos frescos. Chocolate premium. Sin conservantes. Sin sabores artificiales. Solo cookies artesanales hechas para disfrutarse recién horneadas.',
    ingredientsTitle: 'Ingredientes reales',
    ingredientsContent: 'Harina, mantequilla, huevos, azúcar blanca, azúcar moreno, chocolate, vainilla, polvo para hornear y una pizca de sal. Los ingredientes pueden variar ligeramente según el sabor. Nada más. Sin ingredientes extraños. Solo cookies gruesas, suaves y llenas de sabor. Delizukar no solo somos cookies, somos momentos dulces.'
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
    added: 'Box added to cart successfully',
    aboutTitle: 'About our cookies',
    aboutContent: 'At Delizukar, we don\'t bake cookies to sit on a shelf. Every order is baked to order using top-quality ingredients. We then seal them to ensure they arrive at your doorstep as fresh as the moment they left the oven. Crispy on the outside, soft and gooey on the inside. That’s exactly how a real cookie should be.',
    differentTitle: 'What makes us different',
    differentContent: 'Because great cookies start with real ingredients. Real butter. Fresh eggs. Premium chocolate. No preservatives. No artificial flavors. Just artisanal cookies crafted to be enjoyed freshly baked.',
    ingredientsTitle: 'Ingredients',
    ingredientsContent: 'Flour, butter, eggs, white sugar, brown sugar, chocolate, vanilla, baking powder, and a pinch of salt. Ingredients may vary slightly depending on the flavor. Nothing else. No strange additives. Just thick, soft, and flavor-packed cookies. At Delizukar, we aren\'t just about cookies; we are about creating sweet moments.'
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
  const [accordionData, setAccordionData] = useState(null);

  useEffect(() => {
    const fetchAccordionData = async () => {
      try {
        const docRef = doc(db, 'settings', 'accordionMenu');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAccordionData(docSnap.data());
        }
      } catch (err) {
        console.error('Error fetching accordion data:', err);
      }
    };
    fetchAccordionData();
  }, []);

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
  
  // Calcular el precio actual basado en las galletas seleccionadas y el descuento de la caja
  const currentPrice = useMemo(() => {
    if (!boxProduct) return 0;
    
    // Sumar el precio de todas las galletas seleccionadas
    const subtotal = Object.entries(selectedCookies).reduce((acc, [cookieId, qty]) => {
      const cookie = availableCookies.find(c => c.id === cookieId);
      return acc + (cookie ? (cookie.price * qty) : 0);
    }, 0);

    // Aplicar el porcentaje de descuento de la caja
    const discount = boxProduct.discountPercentage || 0;
    const finalPrice = subtotal * (1 - discount / 100);
    
    return parseFloat(finalPrice.toFixed(2));
  }, [selectedCookies, availableCookies, boxProduct]);

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
      price: currentPrice, // Usamos el precio calculado
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
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Selecciona tus galletas favoritas
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {boxProduct.discountPercentage > 0 && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#c8626d', 
                        fontWeight: 700,
                        backgroundColor: '#c8626d15',
                        px: 1,
                        py: 0.2,
                        borderRadius: '4px'
                      }}
                    >
                      -{boxProduct.discountPercentage}% Descuento Box
                    </Typography>
                  )}
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#c8626d' }}>
                    Total: ${currentPrice}
                  </Typography>
                </Box>
              </Box>
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

        {/* Acordeón Informativo - Todas las versiones */}
        {accordionData && (
          <Box sx={{ mt: 8, mb: 4, maxWidth: '800px', mx: 'auto', px: 2 }}>
            <Accordion elevation={0} sx={{ 
              backgroundColor: 'transparent',
              '&:before': { display: 'none' },
              borderBottom: '1px solid #eee',
              borderRadius: '0 !important',
              '&.Mui-expanded': { margin: 0 }
            }}>
              <AccordionSummary 
                expandIcon={<ExpandMore sx={{ color: '#7C2815' }} />}
                sx={{ px: 0 }}
              >
                <Typography sx={{ fontWeight: 600, color: '#7C2815', fontSize: '1.2rem' }}>
                  {accordionData?.[`aboutTitle_${language}`] || accordionData?.aboutTitle || translatedTexts.aboutTitle}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pb: 4 }}>
                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.8 }}>
                  {accordionData?.[`aboutContent_${language}`] || accordionData?.aboutContent || translatedTexts.aboutContent}
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={0} sx={{ 
              backgroundColor: 'transparent',
              '&:before': { display: 'none' },
              borderBottom: '1px solid #eee',
              borderRadius: '0 !important',
              '&.Mui-expanded': { margin: 0 }
            }}>
              <AccordionSummary 
                expandIcon={<ExpandMore sx={{ color: '#7C2815' }} />}
                sx={{ px: 0 }}
              >
                <Typography sx={{ fontWeight: 600, color: '#7C2815', fontSize: '1.2rem' }}>
                  {accordionData?.[`differentTitle_${language}`] || accordionData?.differentTitle || translatedTexts.differentTitle}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pb: 4 }}>
                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.8 }}>
                  {accordionData?.[`differentContent_${language}`] || accordionData?.differentContent || translatedTexts.differentContent}
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={0} sx={{ 
              backgroundColor: 'transparent',
              '&:before': { display: 'none' },
              borderBottom: '1px solid #eee',
              borderRadius: '0 !important',
              '&.Mui-expanded': { margin: 0 }
            }}>
              <AccordionSummary 
                expandIcon={<ExpandMore sx={{ color: '#7C2815' }} />}
                sx={{ px: 0 }}
              >
                <Typography sx={{ fontWeight: 600, color: '#7C2815', fontSize: '1.2rem' }}>
                  {accordionData?.[`ingredientsTitle_${language}`] || accordionData?.ingredientsTitle || translatedTexts.ingredientsTitle}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pb: 4 }}>
                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.8 }}>
                  {accordionData?.[`ingredientsContent_${language}`] || accordionData?.ingredientsContent || translatedTexts.ingredientsContent}
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}
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
      
      {/* Video Reviews and Comparison Table */}
      {/* <VideoReviewsCarousel /> */}
      <ComparisonTable />
    </Box>
  );
};

export default BoxSelection;
