import React, { useState, useEffect } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
// i18n no se usa aquí: priorizamos Firestore

const normalizeHtmlContent = (text) => {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed;
  }
  const paragraphs = trimmed.split(/\n\s*\n/);
  return paragraphs
    .map((paragraph) => {
      const safe = paragraph.replace(/\n/g, '<br/>');
      return `<p>${safe}</p>`;
    })
    .join('\n');
};

const FAQ = () => {
  const [pageData, setPageData] = useState({
    title: 'Preguntas Frecuentes',
    content: `
<p>📦 <strong>¿Cuánto tiempo tardan en enviar sus galletas?</strong><br/>
Todos los pedidos se envían los lunes y martes para garantizar frescura y calidad.</p>

<p>❄️ <strong>¿Se envían las galletas en un paquete refrigerado?</strong><br/>
Nuestras galletas no se envían con paquetes de hielo ni ningún tipo de empaque refrigerado. Están diseñadas para mantenerse frescas durante las condiciones normales de envío.</p>

<p>🌾 <strong>¿Ofrecen productos sin gluten?</strong><br/>
Aún no, pero estamos trabajando en una opción sin gluten y esperamos ofrecerla pronto.</p>

<p>🍪 <strong>¿Cuál es el número mínimo de galletas que puedo pedir?</strong><br/>
Nuestro pedido mínimo es de 6 galletas. Cada lote requiere tiempo y cuidado para elaborar, y esta política nos ayuda a mantener la eficiencia y asegurar la calidad para todos los pedidos.</p>

<p>🛒 <strong>¿Cómo puedo hacer un pedido?</strong><br/>
Puedes ordenar directamente desde nuestro sitio web: 👉 <a href="https://www.DeliZuKar.com" target="_blank" rel="noopener noreferrer">www.DeliZuKar.com</a></p>

<p>🗓️ <strong>¿Puedo programar mi pedido?</strong><br/>
No podemos programar fechas específicas de envío o entrega. Todos los pedidos se envían únicamente los lunes y martes.</p>
`,
    titleFont: 'Playfair Display',
    contentFont: 'Roboto'
  });

  const [fontsReady, setFontsReady] = useState(false);
  const [firestoreData, setFirestoreData] = useState(null);
  const { language } = useLanguage();

  useEffect(() => {
    loadPageData();
  }, []);

  useEffect(() => {
    if (!firestoreData) return;

    const lang = language || 'es';
    const fallbackTitle = firestoreData.title_es || firestoreData.title || pageData.title;
    const fallbackContent = firestoreData.content_es || firestoreData.content || pageData.content;

    const localizedTitle = firestoreData[`title_${lang}`] || fallbackTitle;
    const localizedContent = firestoreData[`content_${lang}`] || fallbackContent;

    setPageData(prev => ({
      ...prev,
      title: localizedTitle,
      content: normalizeHtmlContent(localizedContent),
      titleFont: firestoreData.titleFont || prev.titleFont,
      contentFont: firestoreData.contentFont || prev.contentFont
    }));
  }, [firestoreData, language]);

  const loadPageData = async () => {
    try {
      const pageRef = doc(db, 'pages', 'faq');
      const pageDoc = await getDoc(pageRef);
      
      if (pageDoc.exists()) {
        const data = pageDoc.data();
        setFirestoreData(data);
        console.log('Datos cargados desde Firestore:', data);

        // Migración: si faltan title_es/content_es, guardarlos con defaults en español
        const updates = {};
        if (!data.title_es) updates.title_es = 'Preguntas Frecuentes';
        if (!data.content_es) updates.content_es = `
<p>📦 <strong>¿Cuánto tiempo tardan en enviar sus galletas?</strong><br/>
Todos los pedidos se envían los lunes y martes para garantizar frescura y calidad.</p>

<p>❄️ <strong>¿Se envían las galletas en un paquete refrigerado?</strong><br/>
Nuestras galletas no se envían con paquetes de hielo ni ningún tipo de empaque refrigerado. Están diseñadas para mantenerse frescas durante las condiciones normales de envío.</p>

<p>🌾 <strong>¿Ofrecen productos sin gluten?</strong><br/>
Aún no, pero estamos trabajando en una opción sin gluten y esperamos ofrecerla pronto.</p>

<p>🍪 <strong>¿Cuál es el número mínimo de galletas que puedo pedir?</strong><br/>
Nuestro pedido mínimo es de 6 galletas. Cada lote requiere tiempo y cuidado para elaborar, y esta política nos ayuda a mantener la eficiencia y asegurar la calidad para todos los pedidos.</p>

<p>🛒 <strong>¿Cómo puedo hacer un pedido?</strong><br/>
Puedes ordenar directamente desde nuestro sitio web: 👉 <a href="https://www.DeliZuKar.com" target="_blank" rel="noopener noreferrer">www.DeliZuKar.com</a></p>

<p>🗓️ <strong>¿Puedo programar mi pedido?</strong><br/>
No podemos programar fechas específicas de envío o entrega. Todos los pedidos se envían únicamente los lunes y martes.</p>
`;
        if (Object.keys(updates).length) {
          updates.updatedAt = new Date().toISOString();
          await setDoc(pageRef, updates, { merge: true });
        }
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
    <Box className="faq-page-mobile" sx={{ 
      py: 8, 
      pt: { xs: 10, sm: 35, md: 35 }, 
      opacity: fontsReady ? 1 : 0, 
      transition: 'opacity 200ms ease' 
    }}>
      <Container maxWidth="lg">
        <Typography
          variant="h2"
          className="faq-title"
          sx={{
            textAlign: 'center',
            fontWeight: 800,
            color: '#EC8C8D',
            mb: 2,
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
            dangerouslySetInnerHTML={{ __html: pageData.content || '' }}
          />
        </Box>
      </Container>
    </Box>
  );
};

export default FAQ;
