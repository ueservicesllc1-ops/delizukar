import React, { useState, useEffect } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { db } from '../firebase/config';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

const Terms = () => {
  const { t } = useTranslation();
  const [pageData, setPageData] = useState({
    title: 'Términos y Condiciones',
    content: 'Contenido de términos y condiciones estará disponible próximamente',
    titleFont: 'Playfair Display',
    contentFont: 'Roboto'
  });

  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      // Cargar datos de la página desde Firestore
      const pageDoc = await getDoc(doc(db, 'pages', 'terms'));
      
      if (pageDoc.exists()) {
        const data = pageDoc.data();
        setPageData(data);
        console.log('Datos cargados desde Firestore:', data);
      } else {
        console.log('No se encontraron datos en Firestore, usando datos por defecto');
      }
      
      // Siempre cargar fuentes desde Firestore
      await loadFontsFromFirestore();
      setFontsReady(true);
    } catch (error) {
      console.error('Error cargando datos desde Firestore:', error);
    }
  };

  const loadFontsFromFirestore = async () => {
    try {
      // Cargar todas las fuentes desde Firestore
      const fontsCollection = collection(db, 'fonts');
      const snapshot = await getDocs(fontsCollection);
      
      snapshot.forEach((doc) => {
        const fontData = doc.data();
        const fontName = fontData.name;
        const fontUrl = fontData.dataUrl || fontData.url; // preferir dataURL para evitar CORS
        
        // Verificar si la fuente ya está cargada
        const existingStyle = document.querySelector(`style[data-font="${fontName}"]`);
        if (!existingStyle) {
          console.log('🔤 Aplicando fuente:', fontName);
          
          // Crear @font-face directamente sin preload para evitar CORS
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
    <Box sx={{ py: 8, pt: '500px', opacity: fontsReady ? 1 : 0, transition: 'opacity 200ms ease' }}>
      <Container maxWidth="lg">

        <Typography
          variant="h2"
          sx={{
            textAlign: 'center',
            fontWeight: 800,
            color: '#EC8C8D',
            mb: 2,
            mt: '-350px',
            fontSize: { xs: '2rem', md: '3rem' },
            fontFamily: pageData.titleFont ? `"${pageData.titleFont}", serif` : 'Playfair Display, serif'
          }}
        >
          {pageData.title || t('terms.title')}
        </Typography>
        
        {/* Contenido de la página */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Box
            sx={{
              color: '#666',
              textAlign: 'left',
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
            dangerouslySetInnerHTML={{ __html: pageData.content || t('terms.content') }}
          />
        </Box>
      </Container>
    </Box>
  );
};

export default Terms;
