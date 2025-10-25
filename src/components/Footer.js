import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  TextField,
  Button
} from '@mui/material';
import {
  Facebook,
  Instagram,
  Twitter
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { responsiveComponents } from '../utils/responsiveDesign';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      className="footer-mobile"
      sx={{
        backgroundColor: '#C8626D',
        color: 'white',
        pt: 0,
        pb: 0,
        position: 'relative'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 3, sm: 4, md: 5, lg: 6, xl: 8 }} className="footer-content-mobile" justifyContent="center" sx={{
          // Sistema responsivo universal
          padding: responsiveComponents.footer.padding
        }}>
          {/* Sección 1: Enlaces Rápidos */}
          <Grid item xs={12} sm={6} md={4} lg={3} className="footer-section-mobile">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              sx={{ 
                // Sistema responsivo universal
                padding: { xs: '3px 20px', sm: '4px 25px', md: '5px 30px', lg: '6px 35px', xl: '8px 40px' }
              }}
            >
              <Typography
                variant="h6"
                className="footer-title-mobile"
                sx={{
                  fontWeight: 600,
                  color: 'white',
                  mb: 1,
                  fontSize: '1.1rem',
                  textAlign: 'center'
                }}
              >
                Enlaces Rápidos
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                <Link href="/terms" className="footer-link-mobile" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#EB8B8B' } }}>
                  Términos y Condiciones
                </Link>
                <Link href="/terms-service" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#EB8B8B' } }}>
                  Términos de Servicio
                </Link>
                <Link href="/faq" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#EB8B8B' } }}>
                  Preguntas Frecuentes
                </Link>
                <Link href="/allergy" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#EB8B8B' } }}>
                  Avisos de Alergias
                </Link>
                <Link href="/shipping" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#EB8B8B' } }}>
                  Política de Envío
                </Link>
                <Link href="/cookie-care" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#EB8B8B' } }}>
                  Instrucciones de Cuidado de Galletas
                </Link>
              </Box>
            </motion.div>
          </Grid>

          {/* Sección 2: Navegación */}
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              sx={{ 
                // Sistema responsivo universal
                padding: { xs: '3px 20px', sm: '4px 25px', md: '5px 30px', lg: '6px 35px', xl: '8px 40px' }
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: 'white',
                  mb: 1,
                  fontSize: '1.1rem',
                  textAlign: 'center'
                }}
              >
                Navegación
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                <Link href="/" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#EB8B8B' } }}>
                  Inicio
                </Link>
                <Link href="/productos" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#EB8B8B' } }}>
                  Productos
                </Link>
                <Link href="/contacto" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#EB8B8B' } }}>
                  Contacto
                </Link>
                <Link href="/nosotros" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#EB8B8B' } }}>
                  Nosotros
                </Link>
              </Box>
            </motion.div>
          </Grid>

          {/* Sección 3: Redes Sociales y Suscripción */}
          <Grid item xs={12} sm={12} md={4} lg={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              sx={{ 
                // Sistema responsivo universal
                padding: { xs: '3px 20px', sm: '4px 25px', md: '5px 30px', lg: '6px 35px', xl: '8px 40px' }
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: 'white',
                  mb: 1,
                  fontSize: '1.1rem',
                  textAlign: 'center'
                }}
              >
                Suscríbete a nuestros emails
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 1, justifyContent: 'center' }}>
                <TextField
                  placeholder="Correo electrónico"
                  variant="outlined"
                  size="small"
                  sx={{
                    flexGrow: 1,
                    maxWidth: '200px',
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'rgba(255,255,255,0.3)'
                      },
                      '&:hover fieldset': {
                        borderColor: '#EB8B8B'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#EB8B8B'
                      }
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                      '&::placeholder': {
                        color: '#ccc',
                        opacity: 1
                      }
                    }
                  }}
                />
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: '#EB8B8B',
                    '&:hover': {
                      backgroundColor: '#C8626D'
                    }
                  }}
                >
                  Suscribir
                </Button>
              </Box>

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: 'white',
                  mb: 2,
                  fontSize: '1.1rem',
                  textAlign: 'center'
                }}
              >
                Síguenos en
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 1, justifyContent: 'center' }}>
                <IconButton
                  href="#"
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '&:hover': {
                      backgroundColor: '#EB8B8B',
                      color: 'white'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Facebook />
                </IconButton>
                <IconButton
                  href="#"
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '&:hover': {
                      backgroundColor: '#EB8B8B',
                      color: 'white'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Instagram />
                </IconButton>
                <IconButton
                  href="#"
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '&:hover': {
                      backgroundColor: '#EB8B8B',
                      color: 'white'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Twitter />
                </IconButton>
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: 'white',
                  fontSize: '0.9rem',
                  textAlign: 'center'
                }}
              >
                Métodos de pago
              </Typography>
            </motion.div>
          </Grid>
        </Grid>

        {/* Copyright */}
        <Box className="footer-copyright-mobile" sx={{ textAlign: 'center', mt: 0 }}>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'white',
                fontSize: '0.9rem'
              }}
            >
              © {currentYear} Delizukar. {t('footer.rights', 'All rights reserved')}. 
              {t('footer.madeWith', 'Made with')} love
              <br />
              {t('footer.poweredBy', 'Powered by Freedom Labs')}.
            </Typography>
          </motion.div>
        </Box>
      </Container>

      {/* Logo en esquina superior derecha */}
      <motion.div
        className="footer-logo-mobile"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{
          position: 'absolute',
          top: '40px',
          right: '120px'
        }}
      >
        <Box
          component="img"
          src="/LOGO.png"
          alt="Delizukar Logo"
          sx={{
            height: 78, // 30% más grande (60 * 1.3 = 78)
            width: 'auto',
            filter: 'brightness(0) invert(1)', // Hace el logo blanco
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.05)', // Solo escala, sin translateY
              filter: 'brightness(0) invert(1) drop-shadow(0 0 10px rgba(255,255,255,0.5))' // Efecto de brillo al hover
            }
          }}
        />
      </motion.div>
    </Box>
  );
};

export default Footer;
