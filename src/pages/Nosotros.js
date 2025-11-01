import React, { useEffect, useState } from 'react';
import { Box, Container, Grid, Typography } from '@mui/material';
import { db } from '../firebase/config';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import { translateBatch } from '../services/translateService';
// Solo Firestore (español)

const Nosotros = () => {
  const [pageData, setPageData] = useState({
    title: 'Nuestra Historia',
    content: 'Comparte aquí tu historia. Cómo comenzó DeliZuKar, tu pasión por las galletas estilo Nueva York, los ingredientes que amas y los valores detrás de tu marca.',
    titleFont: 'Playfair Display',
    contentFont: 'Roboto',
    imageUrl: ''
  });
  const [fontsReady, setFontsReady] = useState(false);
  const { language } = useLanguage();
  const [display, setDisplay] = useState({ title: 'Nuestra Historia', content: '' });

  useEffect(() => {
    const injectFont = (name, url) => {
      if (!name || !url) return;
      if (document.querySelector(`style[data-font="${name}"]`)) return;
      const style = document.createElement('style');
      style.setAttribute('data-font', name);
      style.textContent = `@font-face { font-family: '${name}'; src: url('${url}'); font-display: swap; }`;
      document.head.appendChild(style);
    };

    const load = async () => {
      try {
        const ref = doc(db, 'pages', 'nosotros');
        const pageSnap = await getDoc(ref);
        const raw = pageSnap.exists() ? pageSnap.data() : {};
        setPageData(prev => ({
          ...prev,
          title: raw.title_es || raw.title || 'Nuestra Historia',
          content: raw.content_es || raw.content || 'Comparte aquí tu historia. Cómo comenzó DeliZuKar, tu pasión por las galletas estilo Nueva York, los ingredientes que amas y los valores detrás de tu marca.',
          titleFont: raw.titleFont || prev.titleFont,
          contentFont: raw.contentFont || prev.contentFont,
          imageUrl: raw.imageUrl || prev.imageUrl
        }));
        // Establecer contenido mostrado según idioma actual (usar campos por idioma si existen)
        const initialLang = language || 'es';
        const titleByLang = raw[`title_${initialLang}`];
        const contentByLang = raw[`content_${initialLang}`];
        if (initialLang === 'es') {
          setDisplay({ title: raw.title_es || raw.title || 'Nuestra Historia', content: raw.content_es || raw.content || '' });
        } else if (titleByLang || contentByLang) {
          setDisplay({ title: titleByLang || raw.title || 'Nuestra Historia', content: contentByLang || raw.content || '' });
        } else {
          // Traducir desde ES a idioma destino
          try {
            const [trTitle, trContent] = await translateBatch([
              raw.title_es || raw.title || 'Nuestra Historia',
              raw.content_es || raw.content || ''
            ], initialLang, 'es');
            setDisplay({ title: trTitle || (raw.title_es || raw.title), content: trContent || (raw.content_es || raw.content) });
          } catch {
            setDisplay({ title: raw.title_es || raw.title || 'Nuestra Historia', content: raw.content_es || raw.content || '' });
          }
        }
        try {
          const uploadedFonts = JSON.parse(localStorage.getItem('uploadedFonts') || '[]');
          uploadedFonts.forEach(f => injectFont(f.name, f.url));
        } catch {}
        const fontsCol = collection(db, 'fonts');
        const snap = await getDocs(fontsCol);
        snap.forEach(d => {
          const f = d.data();
          const name = f.name;
          const url = f.dataUrl || f.url;
          injectFont(name, url);
        });
        setFontsReady(true);
      } catch (e) {
        setFontsReady(true);
      }
    };
    load();
  }, []);

  // Actualizar cuando cambie el idioma (usar campos por idioma si existen o traducir)
  useEffect(() => {
    const updateForLang = async () => {
      const lang = language || 'es';
      if (lang === 'es') {
        setDisplay({ title: pageData.title, content: pageData.content });
        return;
      }
      try {
        // Intentar traducir usando el servicio
        const [trTitle, trContent] = await translateBatch([
          pageData.title || 'Nuestra Historia',
          pageData.content || ''
        ], lang, 'es');
        setDisplay({ title: trTitle || pageData.title, content: trContent || pageData.content });
      } catch {
        setDisplay({ title: pageData.title, content: pageData.content });
      }
    };
    updateForLang();
  }, [language, pageData.title, pageData.content]);

  return (
    <Box className="nosotros-mobile" sx={{ pt: 20, pb: 8, opacity: fontsReady ? 1 : 0, transition: 'opacity 0.01s ease' }}>
      <style>
        {`
          @keyframes slowFloat {
            0%, 100% { 
              transform: translateY(0px) translateX(0px) scale(1); 
            }
            25% { 
              transform: translateY(-8px) translateX(5px) scale(1.02); 
            }
            50% { 
              transform: translateY(-10px) translateX(0px) scale(1.03); 
            }
            75% { 
              transform: translateY(-5px) translateX(-5px) scale(1.02); 
            }
          }
        `}
      </style>
      <Container maxWidth="lg">
        <Typography
          className="nosotros-title-mobile"
          variant="h2"
          sx={{
            textAlign: 'center',
            fontWeight: 800,
            color: '#EC8C8D',
            mb: 4,
            fontSize: { xs: '2rem', md: '3rem' },
            fontFamily: pageData.titleFont ? `"${pageData.titleFont}", serif` : 'Playfair Display, serif'
          }}
        >
          {display.title || 'Nuestra Historia'}
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          alignItems: 'stretch'
        }}>
          {/* Left: Text box */}
          <Box sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box
              sx={{
                height: '100%',
                borderRadius: 2,
                p: 3,
                bgcolor: '#fafafa',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                flex: 1
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: '#666',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-line',
                  fontFamily: pageData.contentFont ? `"${pageData.contentFont}", sans-serif` : 'Roboto, sans-serif',
                  fontSize: { xs: '0.95rem', md: '1.06rem' }
                }}
              >
                {display.content || 'Comparte aquí tu historia. Cómo comenzó DeliZuKar, tu pasión por las galletas estilo Nueva York, los ingredientes que amas y los valores detrás de tu marca.'}
              </Typography>
            </Box>
          </Box>

          {/* Right: Photo box */}
          <Box sx={{ 
            flex: 1,
            display: 'flex',
            justifyContent: 'center'
          }}>
            <Box
              sx={{
                width: '100%',
                maxWidth: '500px',
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: '#f1f1f1',
                minHeight: { xs: 200, md: 300 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                position: 'relative'
              }}
            >
              {pageData.imageUrl ? (
                <img 
                  src={pageData.imageUrl} 
                  alt="Nuestra historia" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    animation: 'slowFloat 8s ease-in-out infinite'
                  }} 
                />
              ) : (
                <Typography sx={{ color: '#999' }}>Photo goes here</Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Nosotros;


