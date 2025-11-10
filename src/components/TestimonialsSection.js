import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, Container, Typography, Grid, Card, CardContent, Avatar, Rating } from '@mui/material';
import { Star } from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useTitleConfig } from '../context/TitleConfigContext';
import { useLanguage } from '../context/LanguageContext';
import { translateBatch } from '../services/translateService';

const TestimonialsSection = () => {
  const { language } = useLanguage();
  const { titleConfig, loading } = useTitleConfig();
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [translatedTexts, setTranslatedTexts] = useState({
    title: 'Nuestros Clientes Felices',
    loading: 'Cargando testimonios...',
    noTestimonials: 'No hay testimonios activos para mostrar',
    adminNote: 'Los testimonios deben estar marcados como activos en el admin',
    verifiedClient: 'Cliente Verificado'
  });


  // Traducir textos cuando cambia el idioma
  useEffect(() => {
    const translateTexts = async () => {
      if (language === 'es') {
        setTranslatedTexts({
          title: 'Nuestros Clientes Felices',
          loading: 'Cargando testimonios...',
          noTestimonials: 'No hay testimonios activos para mostrar',
          adminNote: 'Los testimonios deben estar marcados como activos en el admin',
          verifiedClient: 'Cliente Verificado'
        });
      } else {
        try {
          const textsToTranslate = [
            'Nuestros Clientes Felices',
            'Cargando testimonios...',
            'No hay testimonios activos para mostrar',
            'Los testimonios deben estar marcados como activos en el admin',
            'Cliente Verificado'
          ];
          const translated = await translateBatch(textsToTranslate, language, 'es');
          setTranslatedTexts({
            title: translated[0] || 'Nuestros Clientes Felices',
            loading: translated[1] || 'Cargando testimonios...',
            noTestimonials: translated[2] || 'No hay testimonios activos para mostrar',
            adminNote: translated[3] || 'Los testimonios deben estar marcados como activos en el admin',
            verifiedClient: translated[4] || 'Cliente Verificado'
          });
        } catch (error) {
          console.error('Error translating texts:', error);
        }
      }
    };
    translateTexts();
  }, [language]);

  // Efecto para aplicar la fuente cuando cambie
  useEffect(() => {
    if (!loading && titleConfig.font) {
      console.log('🔄 Aplicando fuente al título:', titleConfig.font);
      
      // Aplicar la fuente con un pequeño delay para asegurar que el elemento esté disponible
      setTimeout(() => {
        const titleElement = document.querySelector('.testimonials-title');
        if (titleElement) {
          titleElement.style.fontFamily = `"${titleConfig.font}", serif`;
          titleElement.style.fontWeight = '800';
          console.log('✅ Fuente aplicada directamente al elemento:', titleConfig.font);
        } else {
          console.log('⚠️ Elemento .testimonials-title no encontrado');
        }
      }, 100);
    }
  }, [titleConfig.font, loading]);

  // Cargar testimonios desde Firebase según el idioma
  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        console.log('🔄 Cargando testimonios desde Firebase...');
        
        // Determinar qué colección cargar según el idioma (sin i18n)
        let currentLang = 'es';
        try { currentLang = localStorage.getItem('selectedLanguage') || 'es'; } catch {}
        const collectionName = currentLang === 'es' ? 'testimonials_es' : 'testimonials';
        console.log('🌍 Cargando desde colección:', collectionName);
        
        const testimonialsRef = collection(db, collectionName);
        const snapshot = await getDocs(testimonialsRef);
        
        console.log('📊 Total testimonios encontrados:', snapshot.docs.length);
        
        const allTestimonials = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Filtrar testimonios activos
        const activeTestimonials = allTestimonials.filter(testimonial => 
          testimonial.isActive !== false
        );
        
        console.log('📊 Testimonios activos encontrados:', activeTestimonials.length);
        console.log('✅ Testimonios cargados desde Firebase:', activeTestimonials);
        setTestimonials(activeTestimonials);
      } catch (error) {
        console.error('❌ Error loading testimonials from Firebase:', error);
      } finally {
        setTestimonialsLoading(false);
      }
    };

    loadTestimonials();
  }, []);

  if (testimonialsLoading) {
    return (
      <Box sx={{ py: 8, backgroundColor: '#f8f9fa' }}>
        <Container maxWidth="lg">
          <Typography variant="h6" sx={{ textAlign: 'center', color: '#666' }}>
            {translatedTexts.loading}
          </Typography>
        </Container>
      </Box>
    );
  }

  if (testimonials.length === 0) {
    return (
      <Box sx={{ py: 8, backgroundColor: '#f8f9fa' }}>
        <Container maxWidth="lg">
          <Typography variant="h6" sx={{ textAlign: 'center', color: '#666' }}>
            {translatedTexts.noTestimonials}
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', color: '#999', mt: 1 }}>
            {translatedTexts.adminNote}
          </Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ py: { xs: 2, md: 4 } }}>
      <Container maxWidth="lg" className="px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id || index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex justify-center"
              >
                <Card
                  sx={{
                    p: 3,
                    width: '100%',
                    maxWidth: '360px',
                    minHeight: '300px',
                    borderRadius: '20px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    backgroundColor: 'white',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <CardContent
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      justifyContent: 'space-between',
                      p: 0
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar
                        src={testimonial.photoUrl}
                        alt={testimonial.name}
                        sx={{
                          width: 60,
                          height: 60,
                          mr: 2,
                          backgroundColor: '#EC8C8D'
                        }}
                      >
                        {testimonial.name ? testimonial.name.charAt(0).toUpperCase() : 'C'}
                      </Avatar>
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: '#EC8C8D',
                            mb: 0.5,
                            fontFamily: testimonial.titleFont ? `"${testimonial.titleFont}", sans-serif` : 'inherit'
                          }}
                        >
                          {testimonial.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: '#666' }}
                        >
                          {translatedTexts.verifiedClient}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', mb: 1 }}>
                      <Rating
                        value={testimonial.rating || 5}
                        readOnly
                        sx={{ color: '#FFD700' }}
                      />
                    </Box>

                    <Typography
                      variant="body1"
                      sx={{
                        color: '#666',
                        lineHeight: 1.6,
                        fontStyle: 'italic',
                        fontFamily: testimonial.commentFont ? `"${testimonial.commentFont}", sans-serif` : 'inherit'
                      }}
                    >
                      "{testimonial.comment}"
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Container>
    </Box>
  );
};

export default TestimonialsSection;
