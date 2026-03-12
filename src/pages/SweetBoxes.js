import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Box, Container, Typography, Grid, Card, CardContent, 
  CardActions, Button, Skeleton, useTheme, alpha 
} from '@mui/material';
import { ShoppingBag, AutoAwesome } from '@mui/icons-material';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import ProductImage from '../components/ProductImage';
import GiftMessageModal from '../components/GiftMessageModal';
import { PRODUCT_TRANSLATIONS } from './Products';
import { 
  Dialog, DialogTitle, DialogContent, 
  IconButton, Stack 
} from '@mui/material';
import { Close, Casino, AutoFixHigh, TouchApp } from '@mui/icons-material';
import toast from 'react-hot-toast';

const TEXTS = {
  en: {
    title: 'Our Sweet Boxes',
    subtitle: 'Choose the perfect size to share or gift the taste of Delizukar.',
    choose: 'Build my box',
    loading: 'Loading best sweets...',
    empty: 'No boxes found available at this moment.',
    selectionTitle: 'How do you want to build your box?',
    surprise: 'Surprise me',
    surpriseNote: 'We will choose the best mix for you.',
    chooseMyself: 'Choose myself',
    added: 'Box added to cart successfully'
  },
  es: {
    title: 'Nuestras Sweet Boxes',
    subtitle: 'Elige el tamaño perfecto para compartir o regalar el sabor de Delizukar.',
    choose: 'Armar mi caja',
    loading: 'Cargando mejores dulces...',
    empty: 'No se encontraron cajas disponibles en este momento.',
    selectionTitle: '¿Cómo quieres armar tu caja?',
    surprise: 'Sorpréndeme',
    surpriseNote: 'Nosotros elegiremos por ti.',
    chooseMyself: 'Elegir yo mismo',
    added: 'Caja agregada al carrito con éxito'
  }
};

const SweetBoxes = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { language } = useLanguage();
  const { products, productsLoading, addToCart } = useStore();
  
  const [showModePopup, setShowModePopup] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedBox, setSelectedBox] = useState(null);
  const [pendingBox, setPendingBox] = useState(null);
  
  const t = useMemo(() => TEXTS[language] || TEXTS.es, [language]);

  // Filtrar solo productos de la categoría 'boxes'
  const boxProducts = useMemo(() => 
    products.filter(p => p.category === 'boxes' && p.active !== false),
  [products]);
  
  const handleBoxClick = (product) => {
    setSelectedBox(product);
    setShowModePopup(true);
  };

  const handleManual = () => {
    setShowModePopup(false);
    navigate(`/armar-caja/${selectedBox.id}`);
  };

  const handleSurprise = () => {
    setShowModePopup(false);
    
    // Crear el item de caja sorpresa
    const surpriseBox = {
      ...selectedBox,
      id: `${selectedBox.id}-${Date.now()}`,
      baseId: selectedBox.id,
      description_extra: language === 'es' ? 'Selección Sorpresa (Delizukar elige por ti)' : 'Surprise Selection (Delizukar chooses for you)'
    };
    
    setPendingBox(surpriseBox);
    setShowGiftModal(true);
  };

  const handleGiftConfirm = (giftData) => {
    if (pendingBox) {
      addToCart(pendingBox);
      
      const giftItem = {
        ...giftData.product,
        id: `${giftData.product.id}-${Date.now()}`,
        giftDetails: giftData.details,
        description_extra: `Para: ${giftData.details.to} - De: ${giftData.details.from} - Mensaje: ${giftData.details.message}`
      };
      
      addToCart(giftItem);
      toast.success(t.added);
      setShowGiftModal(false);
      navigate('/carrito');
    }
  };

  const handleGiftSkip = () => {
    if (pendingBox) {
      addToCart(pendingBox);
      toast.success(t.added);
      setShowGiftModal(false);
      navigate('/carrito');
    }
  };

  return (
    <Box sx={{ 
      py: { xs: 8, md: 12 }, 
      pt: { xs: 12, md: 24 }, 
      backgroundColor: '#fafafa', 
      minHeight: '100vh' 
    }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: { xs: 6, md: 10 }, textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              sx={{
                fontFamily: 'BrittanySignature',
                fontSize: { xs: '3rem', md: '5rem' },
                color: '#c8626d',
                mb: 1
              }}
            >
              Sweet Boxes
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'text.secondary', 
                maxWidth: '600px', 
                mx: 'auto',
                fontWeight: 400,
                lineHeight: 1.6
              }}
            >
              {t.subtitle}
            </Typography>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ height: '2px', width: '80px', bgcolor: '#c8626d', borderRadius: '2px' }} />
            </Box>
          </motion.div>
        </Box>

        {/* Grid de productos ajustado para ser exactamente igual a la página de productos */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(3, 1fr)' 
          },
          gap: 3,
          maxWidth: '1000px',
          mx: 'auto'
        }}>
          {productsLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Box key={index}>
                <Card sx={{ borderRadius: '16px', overflow: 'hidden', height: '320px' }}>
                  <Skeleton variant="rectangular" height={200} />
                  <CardContent sx={{ p: 2 }}>
                    <Skeleton variant="text" height={20} width="80%" />
                    <Skeleton variant="text" height={15} width="40%" />
                  </CardContent>
                </Card>
              </Box>
            ))
          ) : boxProducts.length > 0 ? (
            boxProducts.map((product, index) => (
              <Box key={product.id}>
                 <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -8 }}
                >
                  <Card
                    onClick={() => handleBoxClick(product)}
                    sx={{
                      height: '320px', // Altura fija para que sean pequeñas
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '1px solid rgba(200, 98, 109, 0.1)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 12px 30px rgba(200, 98, 109, 0.12)',
                        borderColor: '#c8626d'
                      }
                    }}
                  >
                    <Box sx={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        height="100%"
                        width="100%"
                        sx={{ objectFit: 'cover' }}
                      />
                      <Box sx={{ 
                        position: 'absolute', 
                        top: 10, 
                        right: 10, 
                        bgcolor: 'rgba(255,255,255,0.9)', 
                        color: '#c8626d', 
                        px: 1.2, 
                        py: 0.3, 
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        backdropFilter: 'blur(4px)'
                      }}>
                        ${product.price}
                      </Box>
                    </Box>

                    <CardContent sx={{ p: 2, flexGrow: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          mb: 1,
                          color: '#333',
                          fontFamily: '"Asap", sans-serif',
                          fontSize: '0.9rem',
                          lineHeight: 1.2
                        }}
                      >
                        {PRODUCT_TRANSLATIONS[language]?.[product.name]?.name || product[`name_${language}`] || product.name}
                      </Typography>
                      <Button
                        variant="contained"
                        fullWidth
                        size="small"
                        sx={{
                          backgroundColor: '#c8626d',
                          color: 'white',
                          py: 0.8,
                          borderRadius: '10px',
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          mt: 'auto',
                          '&:hover': { backgroundColor: '#b25763' }
                        }}
                      >
                        {t.choose}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>
            ))
          ) : (
            <Box sx={{ textAlign: 'center', py: 10, width: '100%', gridColumn: '1 / -1' }}>
              <Typography variant="h6" color="text.secondary">
                {t.empty}
              </Typography>
            </Box>
          )}
        </Box>
      </Container>

      {/* Popup de Selección de Modo */}
      <Dialog 
        open={showModePopup} 
        onClose={() => setShowModePopup(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '24px', p: 1 }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 800, pt: 3 }}>
          {t.selectionTitle}
          <IconButton
            onClick={() => setShowModePopup(false)}
            sx={{ position: 'absolute', right: 16, top: 16, color: 'grey.500' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pb: 4 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Botón Sorpréndeme */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<AutoFixHigh />}
              onClick={handleSurprise}
              sx={{
                py: 2,
                borderRadius: '20px',
                backgroundColor: '#c8626d',
                display: 'flex',
                flexDirection: 'column',
                height: 'auto',
                gap: 0.5,
                '&:hover': { backgroundColor: '#b25763' }
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, textTransform: 'none' }}>
                {t.surprise}
              </Typography>
              <Typography variant="caption" sx={{ textTransform: 'none', opacity: 0.9, fontWeight: 400 }}>
                {t.surpriseNote}
              </Typography>
            </Button>

            <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
              <Typography variant="caption" sx={{ px: 2, color: 'text.secondary', fontWeight: 600 }}>
                O
              </Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
            </Box>

            {/* Botón Elegir Yo Mismo */}
            <Button
              variant="outlined"
              fullWidth
              size="large"
              startIcon={<TouchApp />}
              onClick={handleManual}
              sx={{
                py: 2,
                borderRadius: '20px',
                borderColor: '#c8626d',
                color: '#c8626d',
                fontWeight: 800,
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#b25763',
                  backgroundColor: alpha('#c8626d', 0.05)
                }
              }}
            >
              {t.chooseMyself}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Modal de Mensaje de Regalo para flujo sorpresa */}
      <GiftMessageModal 
        open={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        onConfirm={handleGiftConfirm}
        onSkip={handleGiftSkip}
      />
    </Box>
  );
};

export default SweetBoxes;
