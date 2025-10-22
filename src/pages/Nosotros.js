import React, { useEffect, useState } from 'react';
import { Box, Container, Grid, Typography } from '@mui/material';
import { db } from '../firebase/config';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

const Nosotros = () => {
  const [pageData, setPageData] = useState({
    title: 'Our History',
    content: 'Write your story here. Share how DeliZuKar began...',
    titleFont: 'Playfair Display',
    contentFont: 'Roboto'
  });
  const [fontsReady, setFontsReady] = useState(false);

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
        const docRef = await getDoc(doc(db, 'pages', 'nosotros'));
        if (docRef.exists()) {
          setPageData(docRef.data());
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

  return (
    <Box sx={{ py: 8, pt: 35, opacity: fontsReady ? 1 : 0, transition: 'opacity 200ms ease' }}>
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
          {pageData.title}
        </Typography>

        <Grid container spacing={3} alignItems="stretch">
          {/* Left: Text box */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                height: '100%',
                borderRadius: 2,
                p: 3,
                bgcolor: '#fafafa',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
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
                {pageData.content}
              </Typography>
            </Box>
          </Grid>

          {/* Right: Photo box */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                width: { xs: '80%', md: '80%' },
                mx: 'auto',
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: '#f1f1f1',
                minHeight: { xs: 128, md: 192 },
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
                  alt="Our history" 
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
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Nosotros;


