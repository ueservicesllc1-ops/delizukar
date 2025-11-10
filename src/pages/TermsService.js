import React, { useState, useEffect } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { db } from '../firebase/config';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import { translateText } from '../services/translateService';

const TermsService = () => {
  
  const { language } = useLanguage();
  const [rawPageData, setRawPageData] = useState(null);
  const [autoTranslations, setAutoTranslations] = useState({});
  const [pageData, setPageData] = useState({
    title: 'Términos de Servicio',
    content: 'Contenido de términos de servicio estará disponible próximamente',
    titleFont: 'Playfair Display',
    contentFont: 'Roboto'
  });

  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    loadPageData();
  }, []);

  useEffect(() => {
    if (rawPageData) {
      const localized = (baseKey, fallback) => {
        const autoKey = `${baseKey}_${language}`;
        const baseValue =
          rawPageData?.[`${baseKey}_en`] ||
          rawPageData?.[baseKey] ||
          fallback;

        return (
          rawPageData?.[`${baseKey}_${language}`] ||
          (language === 'es' ? rawPageData?.[`${baseKey}_es`] : undefined) ||
          (language === 'en' ? rawPageData?.[`${baseKey}_en`] : undefined) ||
          autoTranslations[autoKey] ||
          baseValue
        );
      };

      setPageData(prev => ({
        ...prev,
        title: localized('title', prev.title),
        content: localized('content', prev.content),
        titleFont: rawPageData.titleFont || prev.titleFont,
        contentFont: rawPageData.contentFont || prev.contentFont
      }));

      const ensureAutoTranslation = async (key) => {
        const autoKey = `${key}_${language}`;
        if (!language) return;
        if (rawPageData?.[`${key}_${language}`] || autoTranslations[autoKey]) {
          return;
        }

        const baseValue =
          rawPageData?.[`${key}_en`] ||
          rawPageData?.[key];

        if (!baseValue) return;
        if (language === 'en') return;
        if (language === 'es' && rawPageData?.[`${key}_es`]) return;

        try {
          const translated = await translateText(baseValue, language, 'en');
          if (translated && typeof translated === 'string') {
            setAutoTranslations(prev => ({
              ...prev,
              [autoKey]: translated
            }));
          }
        } catch (error) {
          console.error(`Error translating ${key} to ${language}:`, error);
        }
      };

      ensureAutoTranslation('title');
      ensureAutoTranslation('content');
    }
  }, [rawPageData, language, autoTranslations]);

  // Eliminado: sistema de traducción automático

  const loadPageData = async () => {
    try {
      const ref = doc(db, 'pages', 'terms-service');
      const snap = await getDoc(ref);
      const data = snap.exists() ? snap.data() : {};
      setRawPageData(data || {});
      
      // Cargar fuentes desde Firestore
      await loadFontsFromFirestore();
      setFontsReady(true);
    } catch (error) {
      console.error('Error cargando datos desde Firestore:', error);
    }
  };

  const loadFontsFromFirestore = async () => {
    try {
      const fontsCollection = collection(db, 'fonts');
      const snapshot = await getDocs(fontsCollection);
      
      snapshot.forEach((doc) => {
        const fontData = doc.data();
        const fontName = fontData.name;
        const fontUrl = fontData.dataUrl || fontData.url;
        
        const existingStyle = document.querySelector(`style[data-font="${fontName}"]`);
        if (!existingStyle) {
          console.log('🔤 Aplicando fuente:', fontName);
          
          const fontFace = `
            @font-face {
              font-family: '${fontName}';
              src: url('${fontUrl}');
              font-display: swap;
              font-weight: normal;
              font-style: normal;
            }
          `;
          
          const style = document.createElement('style');
          style.setAttribute('data-font', fontName);
          style.textContent = fontFace;
          document.head.appendChild(style);
          
          console.log('✅ Fuente aplicada:', fontName);
        }
      });
      
      console.log('🎉 Todas las fuentes aplicadas');
      setFontsReady(true);
    } catch (error) {
      console.error('Error cargando fuentes desde Firestore:', error);
    }
  };

  return (
    <Box className="terms-service-page-mobile" sx={{ py: 8, pt: { xs: 10, md: 14 }, opacity: fontsReady ? 1 : 0, transition: 'opacity 0.01s ease' }}>
      <Container maxWidth="lg">
        <Typography
          variant="h2"
          className="terms-service-title"
          sx={{
            textAlign: 'center',
            fontWeight: 800,
            color: '#EC8C8D',
            mb: 3,
            fontSize: { xs: '2rem', md: '3rem' },
            fontFamily: pageData.titleFont ? `"${pageData.titleFont}", serif` : 'Playfair Display, serif'
          }}
        >
          {pageData.title}
        </Typography>
        
        {/* Contenido de la página */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Box
            sx={{
              color: '#666',
              textAlign: 'justify',
              fontStyle: 'normal',
              fontFamily: pageData.contentFont ? `"${pageData.contentFont}", sans-serif` : 'Roboto, sans-serif',
              lineHeight: 1.6,
              fontSize: { xs: '0.95rem', md: '1.05rem' },
              maxWidth: '800px',
              mx: 'auto',
              px: 2,
              '& p': {
                margin: '0 0 16px 0',
                '&:last-child': {
                  marginBottom: 0
                }
              },
              '& h2, & h3': {
                margin: '24px 0 16px 0',
                fontWeight: 700,
                color: '#333'
              },
              '& hr': {
                margin: '24px 0',
                border: 'none',
                borderTop: '1px solid #e0e0e0'
              },
              '& strong': {
                fontWeight: 700
              },
              '& em': {
                fontStyle: 'italic'
              },
              '& ul, & ol': {
                margin: '16px 0',
                paddingLeft: '24px'
              },
              '& li': {
                margin: '8px 0'
              }
            }}
            dangerouslySetInnerHTML={{ __html: pageData.content }}
          />
        </Box>
      </Container>
    </Box>
  );
};

export default TermsService;
