import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Link,
  IconButton,
  TextField,
  Button
} from '@mui/material';
import {
  Facebook,
  Instagram
} from '@mui/icons-material';
import { doc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useLanguage } from '../context/LanguageContext';

// Componente TikTok personalizado
const TikTokIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { language } = useLanguage();
  const text = {
    es: {
      quickLinks: 'Enlaces Rápidos', terms: 'Términos y Condiciones', termsService: 'Términos de Servicio',
      faq: 'Preguntas Frecuentes', allergy: 'Avisos de Alergias', shipping: 'Política de Envío', cookie: 'Instrucciones de Cuidado de Galletas',
      navTitle: 'Navegación', navHome: 'Inicio', navProducts: 'Productos', navContact: 'Contacto', navAbout: 'Nosotros',
      subscribe: 'Suscríbete a nuestros emails', emailPh: 'Correo electrónico', subscribing: 'Suscribiendo...', subscribeBtn: 'Suscribir',
      followUs: 'Síguenos en', payments: 'Métodos de pago', copyright: 'Todos los derechos reservados.', madeWith: 'Hecho con amor', developed: 'Desarrollado por Freedom Labs.'
    },
    en: {
      quickLinks: 'Quick Links', terms: 'Terms and Conditions', termsService: 'Terms of Service',
      faq: 'Frequently Asked Questions', allergy: 'Allergy Notices', shipping: 'Shipping Policy', cookie: 'Cookie Care Instructions',
      navTitle: 'Navigation', navHome: 'Home', navProducts: 'Products', navContact: 'Contact', navAbout: 'About Us',
      subscribe: 'Subscribe to our emails', emailPh: 'Email address', subscribing: 'Subscribing...', subscribeBtn: 'Subscribe',
      followUs: 'Follow us', payments: 'Payment methods', copyright: 'All rights reserved.', madeWith: 'Made with love', developed: 'Developed by Freedom Labs.'
    },
    fr: {
      quickLinks: 'Liens rapides', terms: 'Termes et conditions', termsService: 'Conditions d’utilisation',
      faq: 'Questions fréquentes', allergy: 'Avis d’allergies', shipping: 'Politique d’expédition', cookie: 'Instructions de soin des cookies',
      navTitle: 'Navigation', navHome: 'Accueil', navProducts: 'Produits', navContact: 'Contact', navAbout: 'À propos de nous',
      subscribe: 'Abonnez-vous à nos emails', emailPh: 'Adresse e-mail', subscribing: 'Abonnement...', subscribeBtn: 'S’abonner',
      followUs: 'Suivez-nous', payments: 'Moyens de paiement', copyright: 'Tous droits réservés.', madeWith: 'Fait avec amour', developed: 'Développé par Freedom Labs.'
    },
    pt: {
      quickLinks: 'Links Rápidos', terms: 'Termos e Condições', termsService: 'Termos de Serviço',
      faq: 'Perguntas Frequentes', allergy: 'Avisos de Alergias', shipping: 'Política de Envio', cookie: 'Instruções de Cuidado de Cookies',
      navTitle: 'Navegação', navHome: 'Início', navProducts: 'Produtos', navContact: 'Contato', navAbout: 'Sobre nós',
      subscribe: 'Assine nossos emails', emailPh: 'Email', subscribing: 'Assinando...', subscribeBtn: 'Assinar',
      followUs: 'Siga-nos', payments: 'Métodos de pagamento', copyright: 'Todos os direitos reservados.', madeWith: 'Feito com amor', developed: 'Desenvolvido por Freedom Labs.'
    }
  }[language] || {};
  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    instagram: '',
    tiktok: ''
  });
  const [email, setEmail] = useState('');
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  useEffect(() => {
    loadSocialLinks();
  }, []);

  const loadSocialLinks = async () => {
    try {
      const docRef = doc(db, 'config', 'socialMedia');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setSocialLinks({
          facebook: data.facebook ? (data.facebook.startsWith('http') ? data.facebook : `https://${data.facebook}`) : '',
          instagram: data.instagram ? (data.instagram.startsWith('http') ? data.instagram : `https://${data.instagram}`) : '',
          tiktok: data.tiktok ? (data.tiktok.startsWith('http') ? data.tiktok : `https://${data.tiktok}`) : ''
        });
      }
    } catch (error) {
      console.error('Error cargando enlaces de redes sociales:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!email.trim()) {
      setSubscriptionMessage('Ingresa tu correo');
      return;
    }

    if (!email.includes('@')) {
      setSubscriptionMessage('Ingresa un correo válido');
      return;
    }

    setSubscriptionLoading(true);
    setSubscriptionMessage('');

    try {
      const subscriptionsRef = collection(db, 'emailSubscriptions');
      const q = query(subscriptionsRef, where('email', '==', email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setSubscriptionMessage('Ya estás suscrito');
        setSubscriptionLoading(false);
        return;
      }

      await addDoc(subscriptionsRef, {
        email: email.trim().toLowerCase(),
        subscribedAt: new Date().toISOString(),
        status: 'active',
        source: 'footer'
      });

      setSubscriptionMessage('Suscripción exitosa');
      setEmail('');

      setTimeout(() => {
        setSubscriptionMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error suscribiendo email:', error);
      setSubscriptionMessage('Error al suscribirte');
    } finally {
      setSubscriptionLoading(false);
    }
  };

  return (
    <Box
      data-no-translate
      component="footer"
      className="bg-[#C8626D] text-white"
      sx={{ position: 'relative' }}
    >
      <Container maxWidth="lg" className="mx-auto px-4 py-12 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <motion.div
            className="flex flex-col items-center gap-3 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {text.quickLinks || 'Enlaces Rápidos'}
            </Typography>

            <Box className="flex flex-col gap-2">
              <Link href="/terms" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#EB8B8B' } }}>
                {text.terms || 'Términos y Condiciones'}
              </Link>
              <Link href="/terms-service" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#EB8B8B' } }}>
                {text.termsService || 'Términos de Servicio'}
              </Link>
              <Link href="/faq" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#EB8B8B' } }}>
                {text.faq || 'Preguntas Frecuentes'}
              </Link>
              <Link href="/allergy" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#EB8B8B' } }}>
                {text.allergy || 'Avisos de Alergias'}
              </Link>
              <Link href="/shipping" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#EB8B8B' } }}>
                {text.shipping || 'Política de Envío'}
              </Link>
              <Link href="/cookie-care" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#EB8B8B' } }}>
                {text.cookie || 'Instrucciones de Cuidado de Galletas'}
              </Link>
            </Box>
          </motion.div>

          <motion.div
            className="flex flex-col items-center gap-3 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {text.navTitle || 'Navegación'}
            </Typography>

            <Box className="flex flex-col gap-2">
              <Link href="/" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#EB8B8B' } }}>
                {text.navHome || 'Inicio'}
              </Link>
              <Link href="/productos" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#EB8B8B' } }}>
                {text.navProducts || 'Productos'}
              </Link>
              <Link href="/sweet-boxes" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#EB8B8B' } }}>
                {language === 'es' ? 'Sweet Box' : 'Sweet Box'}
              </Link>
              <Link href="/contacto" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#EB8B8B' } }}>
                {text.navContact || 'Contacto'}
              </Link>
              <Link href="/nosotros" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem', '&:hover': { color: '#EB8B8B' } }}>
                {text.navAbout || 'Nosotros'}
              </Link>
            </Box>
          </motion.div>

          <motion.div
            className="flex flex-col items-center gap-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {text.subscribe || 'Suscríbete a nuestros emails'}
            </Typography>

            <Box className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
              <TextField
                placeholder={text.emailPh || 'Correo electrónico'}
                variant="outlined"
                size="small"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={subscriptionLoading}
                sx={{
                  flexGrow: 1,
                  maxWidth: '220px',
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
                onClick={handleSubscribe}
                disabled={subscriptionLoading || !email.trim()}
                sx={{
                  backgroundColor: '#EB8B8B',
                  '&:hover': {
                    backgroundColor: '#C8626D'
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }
                }}
              >
                {subscriptionLoading ? (text.subscribing || 'Suscribiendo...') : (text.subscribeBtn || 'Suscribir')}
              </Button>
            </Box>

            {subscriptionMessage && (
              <Typography
                variant="body2"
                sx={{
                  color: subscriptionMessage.includes('exitos') ? '#4CAF50' : '#FF9800',
                  fontWeight: 600
                }}
              >
                {subscriptionMessage}
              </Typography>
            )}

            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {text.followUs || 'Síguenos en'}
            </Typography>

            <Box className="flex items-center justify-center gap-2">
              <IconButton
                href={socialLinks.facebook || '#'}
                target="_blank"
                rel="noopener noreferrer"
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
                href={socialLinks.instagram || '#'}
                target="_blank"
                rel="noopener noreferrer"
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
                href={socialLinks.tiktok || '#'}
                target="_blank"
                rel="noopener noreferrer"
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
                <TikTokIcon />
              </IconButton>
            </Box>

            <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
              {text.payments || 'Métodos de pago'}
            </Typography>
          </motion.div>
        </div>

        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
            © {currentYear} Delizukar. {text.copyright || 'Todos los derechos reservados.'}{' '}
            {text.madeWith || 'Hecho con amor'}
            <br />
            {text.developed || 'Desarrollado por Freedom Labs.'}
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Box
              component="img"
              src="/LOGO.png"
              alt="Delizukar Logo"
              sx={{
                height: 70,
                width: 'auto',
                filter: 'brightness(0) invert(1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  filter: 'brightness(0) invert(1) drop-shadow(0 0 10px rgba(255,255,255,0.5))'
                }
              }}
            />
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Footer;
