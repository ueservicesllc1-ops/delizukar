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

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      className="footer-mobile"
      sx={{
        backgroundColor: '#C8626D',
        color: 'white',
        pt: 8,
        pb: 4,
        position: 'relative'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} className="footer-content-mobile">
          {/* Quick links */}
          <Grid item xs={12} md={3} className="footer-section-mobile">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Typography
                variant="h6"
                className="footer-title-mobile"
                sx={{
                  fontWeight: 600,
                  color: 'white',
                  mb: 3,
                  fontSize: '1.1rem'
                }}
              >
                Quick links
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Link href="/terms" className="footer-link-mobile" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#eb8b8b' } }}>
                  Terms and Conditions
                </Link>
                <Link href="/terms-service" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#eb8b8b' } }}>
                  Terms of Service
                </Link>
                <Link href="/faq" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#eb8b8b' } }}>
                  FAQ's
                </Link>
                <Link href="/allergy" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#eb8b8b' } }}>
                  Allergy Notices
                </Link>
                <Link href="/shipping" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#eb8b8b' } }}>
                  Shipping Policy
                </Link>
                <Link href="/cookie-care" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#eb8b8b' } }}>
                  Cookie Care Instructions
                </Link>
              </Box>
            </motion.div>
          </Grid>

          {/* Navigation */}
          <Grid item xs={12} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: 'white',
                  mb: 3,
                  fontSize: '1.1rem'
                }}
              >
                Navigation
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Link href="/" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#eb8b8b' } }}>
                  Home
                </Link>
                <Link href="/order" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#eb8b8b' } }}>
                  Order Here
                </Link>
                <Link href="/contact" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#eb8b8b' } }}>
                  Contact
                </Link>
              </Box>
            </motion.div>
          </Grid>

          {/* Subscribe */}
          <Grid item xs={12} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: 'white',
                  mb: 3,
                  fontSize: '1.1rem'
                }}
              >
                Subscribe to our emails
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  placeholder="Email"
                  variant="outlined"
                  size="small"
                  sx={{
                    flexGrow: 1,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'rgba(255,255,255,0.3)'
                      },
                      '&:hover fieldset': {
                        borderColor: '#eb8b8b'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#eb8b8b'
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
              </Box>
            </motion.div>
          </Grid>

          {/* Social & Payment */}
          <Grid item xs={12} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: 'white',
                  mb: 3,
                  fontSize: '1.1rem'
                }}
              >
                Follow on
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <IconButton
                  href="#"
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '&:hover': {
                      backgroundColor: '#eb8b8b',
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
                      backgroundColor: '#eb8b8b',
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
                      backgroundColor: '#eb8b8b',
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
                  fontSize: '0.9rem'
                }}
              >
                Payment methods
              </Typography>
            </motion.div>
          </Grid>
        </Grid>

        {/* Copyright */}
        <Box className="footer-copyright-mobile" sx={{ textAlign: 'center', mt: 4 }}>
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
              © {currentYear} Delizukar. All rights reserved. 
              Made with ❤️
              <br />
              Powered by Freedom Labs.
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
          right: '60px'
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
