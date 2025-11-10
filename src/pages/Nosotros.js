import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Container, Grid, Typography } from '@mui/material';
import { db } from '../firebase/config';
import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import { translateBatch } from '../services/translateService';
// Solo Firestore (español)

const MAX_TRANSLATE_LENGTH = 450;

const chunkText = (text, maxLength = MAX_TRANSLATE_LENGTH) => {
  const segments = [];

  if (!text) return segments;

  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return segments;

  const paragraphs = normalized.split(/\n\n+/);

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) return;

    const pieces = [];

    if (trimmedParagraph.length <= maxLength) {
      pieces.push(trimmedParagraph);
    } else {
      const sentences = trimmedParagraph.match(/[^.!?]+[.!?]?/g) || [trimmedParagraph];
      let current = '';

      sentences.forEach((sentence) => {
        const s = sentence.trim();
        if (!s) return;
        if ((current + ' ' + s).trim().length > maxLength && current.length > 0) {
          pieces.push(current.trim());
          current = s;
        } else {
          current = `${current} ${s}`.trim();
        }
      });

      if (current.length > 0) {
        pieces.push(current.trim());
      }
    }

    pieces.forEach((piece, index) => {
      segments.push({
        text: piece,
        paragraphEnd: index === pieces.length - 1 && paragraphIndex < paragraphs.length - 1
      });
    });
  });

  return segments;
};

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
  const [rawData, setRawData] = useState(null);
  const translationCacheRef = useRef({});
  const savingRef = useRef({});
  const pageDocRef = useRef(doc(db, 'pages', 'nosotros'));

  const getDefaultTitle = useCallback((raw) => raw?.title_es || raw?.title || 'Nuestra Historia', []);
  const getDefaultContent = useCallback((raw) => raw?.content_es || raw?.content || '', []);

  const updateDisplayForLanguage = useCallback(async (lang, raw) => {
    if (!raw) return;

    if (lang === 'es') {
      setDisplay({ title: getDefaultTitle(raw), content: getDefaultContent(raw) });
      return;
    }

    const localizedTitle = raw[`title_${lang}`];
    const localizedContent = raw[`content_${lang}`];

    if (localizedTitle || localizedContent) {
      setDisplay({
        title: localizedTitle || getDefaultTitle(raw),
        content: localizedContent || getDefaultContent(raw)
      });
      return;
    }

    if (translationCacheRef.current[lang]) {
      setDisplay(translationCacheRef.current[lang]);
      return;
    }

    try {
      const fallbackTitle = getDefaultTitle(raw);
      const fallbackContent = getDefaultContent(raw);
      const segments = chunkText(fallbackContent);

      let translatedTitle = fallbackTitle;
      try {
        const [titleResponse] = await translateBatch([fallbackTitle], lang, 'es');
        translatedTitle = titleResponse || fallbackTitle;
      } catch (error) {
        console.error('Nosotros title translation error:', error);
      }

      const translatedSegments = [];
      for (const segment of segments) {
        try {
          const [translatedSegment] = await translateBatch([segment.text], lang, 'es');
          translatedSegments.push(translatedSegment || segment.text);
        } catch (error) {
          console.error('Nosotros segment translation error:', error);
          translatedSegments.push(segment.text);
        }
      }

      let rebuiltContent = '';
      segments.forEach((segment, index) => {
        const translatedSegment = translatedSegments[index] || segment.text;
        rebuiltContent += translatedSegment;
        if (segment.paragraphEnd) {
          rebuiltContent += '\n\n';
        } else if (index < segments.length - 1) {
          rebuiltContent += ' ';
        }
      });

      const result = {
        title: translatedTitle,
        content: rebuiltContent.trim() || fallbackContent
      };

      translationCacheRef.current = { ...translationCacheRef.current, [lang]: result };
      setDisplay(result);

      // Persist only if we translated successfully and fields are missing
      const dataToSave = {};
      if (!raw[`title_${lang}`]) {
        dataToSave[`title_${lang}`] = result.title;
      }
      if (!raw[`content_${lang}`]) {
        dataToSave[`content_${lang}`] = result.content;
      }

      if (Object.keys(dataToSave).length > 0 && !savingRef.current[lang]) {
        savingRef.current[lang] = true;
        try {
          await setDoc(pageDocRef.current, dataToSave, { merge: true });
          setRawData((prev) => (prev ? { ...prev, ...dataToSave } : prev));
        } catch (error) {
          console.error('Error updating Firestore with translated Nosotros content:', error);
        } finally {
          savingRef.current[lang] = false;
        }
      }
    } catch (error) {
      setDisplay({ title: getDefaultTitle(raw), content: getDefaultContent(raw) });
    }
  }, [getDefaultContent, getDefaultTitle]);

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
        const ref = pageDocRef.current;
        const pageSnap = await getDoc(ref);
        const raw = pageSnap.exists() ? pageSnap.data() : {};
        setPageData(prev => ({
          ...prev,
          title: raw.title_es || raw.title || prev.title,
          content: raw.content_es || raw.content || prev.content,
          titleFont: raw.titleFont || prev.titleFont,
          contentFont: raw.contentFont || prev.contentFont,
          imageUrl: raw.imageUrl || prev.imageUrl
        }));
        setRawData(raw);
        updateDisplayForLanguage(language || 'es', raw);
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

  // Actualizar al cambiar idioma
  useEffect(() => {
    if (!rawData) return;
    updateDisplayForLanguage(language || 'es', rawData);
  }, [language, rawData, updateDisplayForLanguage]);

  return (
    <Box className="nosotros-mobile" sx={{ pt: { xs: 12, md: 16 }, pb: 8, opacity: fontsReady ? 1 : 0, transition: 'opacity 0.01s ease' }}>
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


