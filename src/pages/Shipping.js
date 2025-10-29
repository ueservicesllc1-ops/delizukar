import React, { useState, useEffect } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { db } from '../firebase/config';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

const Shipping = () => {
  const { t, i18n } = useTranslation();
  const [pageData, setPageData] = useState({
    title: t('shipping.title'),
    content: t('shipping.content'),
    titleFont: 'Playfair Display',
    contentFont: 'Roboto'
  });

  const [fontsReady, setFontsReady] = useState(false);
  const [firestoreData, setFirestoreData] = useState(null);

  useEffect(() => {
    loadPageData();
  }, []);

  // Actualizar traducciones cuando cambie el idioma
  useEffect(() => {
    // Si hay datos de Firestore con estructura multiidioma, usar esos
    if (firestoreData) {
      const lang = i18n.language === 'es' ? 'es' : 'en';
      const titleKey = `title_${lang}`;
      const contentKey = `content_${lang}`;
      
      if (firestoreData[titleKey] || firestoreData[contentKey]) {
        setPageData(prev => ({
          ...prev,
          title: firestoreData[titleKey] || firestoreData.title || t('shipping.title'),
          content: firestoreData[contentKey] || firestoreData.content || t('shipping.content'),
          titleFont: firestoreData.titleFont || prev.titleFont,
          contentFont: firestoreData.contentFont || prev.contentFont
        }));
      } else {
        // Si no hay estructura multiidioma, siempre usar traducciones del sistema
        setPageData(prev => ({
          ...prev,
          title: t('shipping.title'),
          content: t('shipping.content'),
          titleFont: firestoreData.titleFont || prev.titleFont,
          contentFont: firestoreData.contentFont || prev.contentFont
        }));
      }
    } else {
      // Si no hay datos de Firestore, usar traducciones del sistema
      setPageData(prev => ({
        ...prev,
        title: t('shipping.title'),
        content: t('shipping.content')
      }));
    }
  }, [i18n.language, t, firestoreData]);

  const loadPageData = async () => {
    try {
      const pageDoc = await getDoc(doc(db, 'pages', 'shipping'));
      
      if (pageDoc.exists()) {
        const data = pageDoc.data();
        setFirestoreData(data);
        console.log('Datos cargados desde Firestore:', data);
      } else {
        setFirestoreData(null);
        console.log('No se encontraron datos en Firestore, usando datos por defecto');
      }
      
      // Cargar fuentes desde Firestore
      await loadFontsFromFirestore();
      setFontsReady(true);
    } catch (error) {
      console.error('Error cargando datos desde Firestore:', error);
      setFirestoreData(null);
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
    <Box sx={{ py: 8, pt: 35, opacity: fontsReady ? 1 : 0, transition: 'opacity 200ms ease' }}>
      <Container maxWidth="lg">
        <Typography
          variant="h2"
          sx={{
            textAlign: 'center',
            fontWeight: 800,
            color: '#EC8C8D',
            mb: 2,
            mt: '-160px',
            fontSize: { xs: '2rem', md: '3rem' },
            fontFamily: pageData.titleFont ? `"${pageData.titleFont}", serif` : 'Playfair Display, serif'
          }}
        >
          {pageData.title ? pageData.title : t('shipping.title')}
        </Typography>
        
        {/* Contenido de la página */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Typography
            variant="h6"
            sx={{
              color: '#666',
              textAlign: 'center',
              fontStyle: 'normal',
              fontFamily: pageData.contentFont ? `"${pageData.contentFont}", sans-serif` : 'Roboto, sans-serif',
              lineHeight: 1.6,
              fontSize: { xs: '0.95rem', md: '1.05rem' },
              maxWidth: '800px',
              mx: 'auto',
              px: 2,
              whiteSpace: 'pre-line'
            }}
          >
            {pageData.content ? pageData.content : t('shipping.content')}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Shipping;
