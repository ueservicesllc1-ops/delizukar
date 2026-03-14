import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Box, Typography, Container, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { db } from '../firebase/config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { ArrowForwardIos, ArrowBackIos } from '@mui/icons-material';
import { useLanguage } from '../context/LanguageContext';

const TEXTS = {
  es: {
    stats: 'Más de 10,000+ galletas hechas',
    happy: '& más de 2,500+ clientes felices & no solo confiamos en nuestra palabra....'
  },
  en: {
    stats: 'Over 10,000+ Cookies Made',
    happy: '& over 2,500+ happy customers & don\'t just take our word for it....'
  }
};

const VideoReviewsCarousel = () => {
  const [videos, setVideos] = useState([
    { id: 'ex1', title: 'Example Review 1', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-eating-a-chocolate-cookie-34509-large.mp4' },
    { id: 'ex2', title: 'Example Review 2', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-putting-a-tray-of-cookies-in-the-oven-34505-large.mp4' },
    { id: 'ex3', title: 'Example Review 3', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-chocolate-chip-cookie-34510-large.mp4' }
  ]);
  const scrollRef = useRef(null);
  const { language } = useLanguage();

  const t = useMemo(() => TEXTS[language] || TEXTS.es, [language]);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const q = query(collection(db, 'reviewVideos'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const videoList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setVideos(videoList);
        }
      } catch (err) {
        console.error('Error fetching review videos:', err);
      }
    };
    fetchVideos();
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (videos.length === 0) return null;

  return (
    <Box sx={{ 
      backgroundColor: '#c8626d', 
      py: 10, 
      width: '100%',
      mt: 0
    }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 6, textAlign: 'center', color: 'white' }}>
          <Typography variant="h3" sx={{ 
            fontWeight: 800,
            fontSize: { xs: '2rem', md: '3.5rem' },
            mb: 1,
            letterSpacing: '-1px'
          }}>
            {t.stats}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 500 }}>
            {t.happy}
          </Typography>
        </Box>

        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={() => scroll('left')}
            sx={{ 
              position: 'absolute', 
              left: -30, 
              zIndex: 2, 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' },
              display: { xs: 'none', lg: 'flex' }
            }}
          >
            <ArrowBackIos fontSize="small" />
          </IconButton>

          <Box
            ref={scrollRef}
            sx={{
              display: 'flex',
              overflowX: 'auto',
              gap: 2,
              pb: 4,
              px: { xs: 2, md: 0 },
              scrollSnapType: 'x mandatory',
              '&::-webkit-scrollbar': { display: 'none' },
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
              justifyContent: { md: 'center' }
            }}
          >
            {videos.map((video) => (
              <motion.div
                key={video.id}
                whileHover={{ y: -10 }}
                style={{
                  scrollSnapAlign: 'start',
                  flex: '0 0 auto',
                  width: '240px',
                  height: '420px',
                  borderRadius: '30px',
                  overflow: 'hidden',
                  backgroundColor: '#000',
                  position: 'relative',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                }}
              >
                <video
                  src={video.videoUrl}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              </motion.div>
            ))}
          </Box>

          <IconButton 
            onClick={() => scroll('right')}
            sx={{ 
              position: 'absolute', 
              right: -30, 
              zIndex: 2, 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' },
              display: { xs: 'none', lg: 'flex' }
            }}
          >
            <ArrowForwardIos fontSize="small" />
          </IconButton>
        </Box>
      </Container>
    </Box>
  );
};

export default VideoReviewsCarousel;
