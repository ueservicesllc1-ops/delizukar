import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, Container, Typography, Grid, Card, CardContent, Avatar, Rating } from '@mui/material';
import { Star } from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useTitleConfig } from '../context/TitleConfigContext';
import { useTranslation } from 'react-i18next';

const TestimonialsSection = () => {
  const { t, i18n } = useTranslation();
  const { titleConfig, loading } = useTitleConfig();
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);


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
        
        // Determinar qué colección cargar según el idioma
        const collectionName = i18n.language === 'es' ? 'testimonials_es' : 'testimonials';
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
  }, [i18n.language]); // Dependencia en el idioma para que se recargue cuando cambie

  if (testimonialsLoading) {
    return (
      <Box sx={{ py: 8, backgroundColor: '#f8f9fa' }}>
        <Container maxWidth="lg">
          <Typography variant="h6" sx={{ textAlign: 'center', color: '#666' }}>
            {t('testimonials.loading', 'Cargando testimonios...')}
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
            {t('testimonials.noTestimonials', 'No hay testimonios activos para mostrar')}
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', color: '#999', mt: 1 }}>
            {t('testimonials.adminNote', 'Los testimonios deben estar marcados como activos en el admin')}
          </Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box className="testimonials-mobile" sx={{ py: 8, backgroundColor: '#f8f9fa' }}>
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Typography
            variant="h2"
            className="testimonials-title"
            sx={{
              textAlign: 'center',
              fontWeight: 800,
              color: '#EC8C8D',
              mb: 2,
              fontSize: { xs: '2rem', md: '3rem' },
              fontFamily: loading ? 'Playfair Display, serif' : `"${titleConfig.font}", serif !important`
            }}
          >
            {t('testimonials.title', 'Nuestros Clientes Felices')}
          </Typography>
          

          <Grid container spacing={4} justifyContent="center" sx={{ mt: 6 }}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={testimonial.id || index} sx={{ display: 'flex', justifyContent: 'center' }}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card
                    className="testimonial-card-mobile"
                    sx={{
                      p: 2,
                      width: '350px',
                      height: '300px',
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
                    <CardContent className="testimonial-content-mobile" sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      height: '100%',
                      justifyContent: 'space-between',
                      paddingTop: '16px !important',
                      paddingBottom: '16px !important'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
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
                            className="testimonial-name-mobile"
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
                            {t('testimonials.verifiedClient', 'Cliente Verificado')}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', mb: 0.5 }}>
                        <Rating
                          value={testimonial.rating || 5}
                          readOnly
                          sx={{ color: '#FFD700' }}
                        />
                      </Box>

                      <Typography
                        variant="body1"
                        className="testimonial-text-mobile"
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
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
};

export default TestimonialsSection;
