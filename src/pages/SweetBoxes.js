import React, { useMemo, useState, useEffect } from 'react';
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
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { PRODUCT_TRANSLATIONS } from './Products';
import BoxSelectionPopup from '../components/BoxSelectionPopup';
// import VideoReviewsCarousel from '../components/VideoReviewsCarousel';
import ComparisonTable from '../components/ComparisonTable';

const TEXTS = {
  en: {
    title: 'Our Sweet Boxes',
    subtitle: 'Choose the perfect size to share or gift the taste of Delizukar.',
    choose: 'View details',
    loading: 'Loading best sweets...',
    empty: 'No boxes found available at this moment.',
    discountInfo: '({percentage}% discount applied to the total)',
    priceNote: 'Final price based on selected cookies',
    aboutTitle: 'About our cookies',
    aboutContent: 'At Delizukar, we don\'t bake cookies to sit on a shelf. Every order is baked to order using top-quality ingredients. We then seal them to ensure they arrive at your doorstep as fresh as the moment they left the oven. Crispy on the outside, soft and gooey on the inside. That’s exactly how a real cookie should be.',
    differentTitle: 'What makes us different',
    differentContent: 'Because great cookies start with real ingredients. Real butter. Fresh eggs. Premium chocolate. No preservatives. No artificial flavors. Just artisanal cookies crafted to be enjoyed freshly baked.',
    ingredientsTitle: 'Ingredients',
    ingredientsContent: 'Flour, butter, eggs, white sugar, brown sugar, chocolate, vanilla, baking powder, and a pinch of salt. Ingredients may vary slightly depending on the flavor. Nothing else. No strange additives. Just thick, soft, and flavor-packed cookies. At Delizukar, we aren\'t just about cookies; we are about creating sweet moments.'
  },
  es: {
    title: 'Nuestras Sweet Boxes',
    subtitle: 'Elige el tamaño perfecto para compartir o regalar el sabor de Delizukar.',
    choose: 'Ver detalles',
    loading: 'Cargando mejores dulces...',
    empty: 'No se encontraron cajas disponibles en este momento.',
    discountInfo: '({percentage}% de descuento aplicado al total)',
    priceNote: 'Precio final según galletas seleccionadas',
    aboutTitle: 'Recién horneadas para ti',
    aboutContent: 'En Delizukar no hacemos cookies para almacenar. Cada pedido se hornea al momento con ingredientes de primera calidad. Luego las sellamos para que lleguen a tu puerta tan frescas como salieron del horno. Crujientes por fuera. Suaves y fundentes por dentro. Así debe ser una verdadera cookie.',
    differentTitle: '¿Por qué Delizukar?',
    differentContent: 'Porque las buenas cookies empiezan con ingredientes reales. Mantequilla de verdad. Huevos frescos. Chocolate premium. Sin conservantes. Sin sabores artificiales. Solo cookies artesanales hechas para disfrutarse recién horneadas.',
    ingredientsTitle: 'Ingredientes reales',
    ingredientsContent: 'Harina, mantequilla, huevos, azúcar blanca, azúcar moreno, chocolate, vainilla, polvo para hornear y una pizca de sal. Los ingredientes pueden variar ligeramente según el sabor. Nada más. Sin ingredientes extraños. Solo cookies gruesas, suaves y llenas de sabor. Delizukar no solo somos cookies, somos momentos dulces.'
  }
};

const SweetBoxes = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { language } = useLanguage();
  const { products, productsLoading } = useStore();
  
  const t = useMemo(() => TEXTS[language] || TEXTS.es, [language]);

  const [showModePopup, setShowModePopup] = useState(false);
  const [selectedBox, setSelectedBox] = useState(null);
  const [pageData, setPageData] = useState({
    title: t.title,
    subtitle: t.subtitle,
    titleFont: 'BrittanySignature',
    contentFont: 'inherit'
  });
  const [rawData, setRawData] = useState(null);
  const [accordionData, setAccordionData] = useState({
    aboutTitle: 'Acerca de nuestra cookie',
    aboutContent: 'Nuestras galletas son horneadas artesanalmente cada día con ingredientes de la más alta calidad. Inspiradas en el estilo de Nueva York, cada bocado ofrece una textura crujiente por fuera y suave por dentro.',
    differentTitle: 'Lo que nos hace diferentes',
    differentContent: 'No escatimamos en calidad. Usamos chocolate premium, mantequilla real y técnicas de horneado perfeccionadas durante años para asegurar que cada galleta sea una experiencia inolvidable.',
    ingredientsTitle: 'Ingredientes',
    ingredientsContent: 'Harina de trigo enriquecida, mantequilla premium, chips de chocolate belga, azúcar morena, huevos de granja, esencia de vanilla natural y una pizca de sal marina.'
  });

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

    const fetchPageData = async () => {
      try {
        const docRef = doc(db, 'pages', 'sweet-boxes');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPageData(prev => ({
            ...prev,
            title: language === 'es' ? (data.title_es || data.title || t.title) : (data.title_en || t.title),
            subtitle: language === 'es' ? (data.content_es || data.content || t.subtitle) : (data.content_en || t.subtitle),
            titleFont: data.titleFont || prev.titleFont,
            contentFont: data.contentFont || prev.contentFont
          }));
          setRawData(data);
        }
      } catch (err) {
        console.error('Error fetching page data:', err);
      }
    };
    fetchPageData();
  }, [language, t.title, t.subtitle]);

  // Efecto para traducción automática si falta información
  useEffect(() => {
    const localizeContent = async () => {
      if (!rawData) return;
      const lang = language || 'es';
      
      // Si ya tenemos los datos en el idioma correcto, no hacemos nada
      const localizedTitle = lang === 'es' ? (rawData.title_es || rawData.title) : rawData.title_en;
      const localizedContent = lang === 'es' ? (rawData.content_es || rawData.content) : rawData.content_en;

      if (localizedTitle && localizedContent) {
        setPageData(prev => ({
          ...prev,
          title: localizedTitle,
          subtitle: localizedContent
        }));
        return;
      }

      // Si falta traducción, intentamos auto-traducir
      try {
        const { translateBatch } = await import('../services/translateService');
        const sourceTitle = rawData.title_es || rawData.title || t.title;
        const sourceSubtitle = rawData.content_es || rawData.content || t.subtitle;

        const [translatedTitle, translatedSubtitle] = await translateBatch(
          [sourceTitle, sourceSubtitle],
          lang,
          'es'
        );

        const resultTitle = translatedTitle || sourceTitle;
        const resultSubtitle = translatedSubtitle || sourceSubtitle;

        setPageData(prev => ({
          ...prev,
          title: resultTitle,
          subtitle: resultSubtitle
        }));

        // Persistir la traducción automáticamente para futuras visitas
        const updates = {};
        if (lang === 'en') {
          if (!rawData.title_en) updates.title_en = resultTitle;
          if (!rawData.content_en) updates.content_en = resultSubtitle;
        } else if (lang === 'es') {
          if (!rawData.title_es) updates.title_es = resultTitle;
          if (!rawData.content_es) updates.content_es = resultSubtitle;
        }

        if (Object.keys(updates).length > 0) {
          const { setDoc } = await import('firebase/firestore');
          await setDoc(doc(db, 'pages', 'sweet-boxes'), updates, { merge: true });
          setRawData(prev => ({ ...prev, ...updates }));
        }
      } catch (error) {
        console.error('Error auto-translating Sweet Boxes page:', error);
      }
    };

    localizeContent();
  }, [language, rawData, t.title, t.subtitle]);
  // Filtrar solo productos de la categoría 'boxes'
  const boxProducts = useMemo(() => 
    products.filter(p => p.category === 'boxes' && p.active !== false),
  [products]);
  
  const handleBoxClick = (product) => {
    setSelectedBox(product);
    setShowModePopup(true);
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
                fontFamily: pageData?.titleFont || 'BrittanySignature',
                fontSize: { xs: '3rem', md: '5rem' },
                color: '#c8626d',
                mb: 1
              }}
            >
              {pageData?.title}
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'text.secondary', 
                maxWidth: '600px', 
                mx: 'auto',
                fontWeight: 400,
                lineHeight: 1.6,
                fontFamily: pageData?.contentFont || 'inherit'
              }}
            >
              {pageData?.subtitle}
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
                      height: '360px', // Reducción a 360px para diseño más compacto
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
                    <Box sx={{ position: 'relative', height: 180, overflow: 'hidden' }}>
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        height="100%"
                        width="100%"
                        sx={{ objectFit: 'cover' }}
                      />
                      {product.discountPercentage > 0 && (
                        <Box sx={{ 
                          position: 'absolute', 
                          top: 10, 
                          right: 10, 
                          bgcolor: '#c8626d', 
                          color: 'white', 
                          px: 1.2, 
                          py: 0.3, 
                          borderRadius: '10px',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          backdropFilter: 'blur(4px)',
                          boxShadow: '0 2px 10px rgba(200, 98, 109, 0.3)'
                        }}>
                          -{product.discountPercentage}%
                        </Box>
                      )}
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
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.75rem',
                          mb: 1.5,
                          lineHeight: 1.4,
                          minHeight: '3em' // Asegura altura constante
                        }}
                      >
                        {PRODUCT_TRANSLATIONS[language]?.[product.name]?.description || product[`description_${language}`] || product.description}
                      </Typography>
                      {product.category === 'boxes' && product.discountPercentage > 0 && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#c8626d',
                            fontWeight: 600,
                            display: 'block',
                            mb: 1
                          }}
                        >
                          {t.discountInfo.replace('{percentage}', product.discountPercentage)}
                        </Typography>
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          display: 'block',
                          mb: 1,
                          fontSize: '0.7rem'
                        }}
                      >
                        {t.priceNote}
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
                  {language === 'es' ? 'Recién horneadas para ti' : (accordionData?.aboutTitle_en || t.aboutTitle || accordionData?.aboutTitle)}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pb: 4 }}>
                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.8 }}>
                  {language === 'es' ? (t.aboutContent || accordionData?.aboutContent) : (accordionData?.aboutContent_en || t.aboutContent || accordionData?.aboutContent)}
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
                  {language === 'es' ? (t.differentTitle || accordionData?.differentTitle) : (accordionData?.differentTitle_en || t.differentTitle || accordionData?.differentTitle)}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pb: 4 }}>
                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.8 }}>
                  {language === 'es' ? (t.differentContent || accordionData?.differentContent) : (accordionData?.differentContent_en || t.differentContent || accordionData?.differentContent)}
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
                  {language === 'es' ? (t.ingredientsTitle || accordionData?.ingredientsTitle) : (accordionData?.ingredientsTitle_en || t.ingredientsTitle || accordionData?.ingredientsTitle)}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pb: 4 }}>
                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.8 }}>
                  {language === 'es' ? (t.ingredientsContent || accordionData?.ingredientsContent) : (accordionData?.ingredientsContent_en || t.ingredientsContent || accordionData?.ingredientsContent)}
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}
      </Container>

      <BoxSelectionPopup 
        open={showModePopup} 
        onClose={() => setShowModePopup(false)}
        selectedBox={selectedBox}
      />

      {/* Video Reviews and Comparison Table */}
      {/* <VideoReviewsCarousel /> */}
      <ComparisonTable />
    </Box>
  );
};

export default SweetBoxes;
