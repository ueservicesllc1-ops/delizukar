import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, TextField, Button, Grid, Alert } from '@mui/material';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp, doc, getDoc, collection as fsCollection, getDocs, setDoc } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import { translateBatch } from '../services/translateService';

const TEXTS = {
  es: {
    nombre: 'Nombre',
    email: 'Email',
    mensaje: 'Mensaje',
    enviar: 'Enviar Mensaje',
    enviando: 'Enviando...',
    exito: 'Tu mensaje ha sido enviado. Te responderemos pronto.',
  },
  en: {
    nombre: 'Name',
    email: 'Email',
    mensaje: 'Message',
    enviar: 'Send Message',
    enviando: 'Sending...',
    exito: 'Your message has been sent. We will get back to you soon.',
  },
  fr: {
    nombre: 'Nom',
    email: 'Email',
    mensaje: 'Message',
    enviar: 'Envoyer le message',
    enviando: 'Envoi...',
    exito: 'Votre message a été envoyé. Nous vous répondrons bientôt.',
  },
  pt: {
    nombre: 'Nome',
    email: 'Email',
    mensaje: 'Mensagem',
    enviar: 'Enviar mensagem',
    enviando: 'Enviando...',
    exito: 'Sua mensaje foi enviada. Entraremos em contato em breve.',
  }
};

const Contacto = () => {
  const { language } = useLanguage();
  const t = TEXTS[language] || TEXTS.es;

  const [pageData, setPageData] = useState({
    title: 'Contáctanos',
    content: 'Nos encantaría saber de ti. Envíanos un mensaje y te responderemos pronto.',
    titleFont: 'Playfair Display',
    contentFont: 'Roboto'
  });
  const [fontsReady, setFontsReady] = useState(false);
  const [rawData, setRawData] = useState(null);
  const [form, setForm] = useState({ nombre: '', email: '', mensaje: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Cargar datos de página y fuentes (igual que otras páginas)
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
        // Datos de la página
        const ref = doc(db, 'pages', 'contacto');
        const snap = await getDoc(ref);
        const data = snap.exists() ? snap.data() : {};
        setPageData(prev => ({
          ...prev,
          title: data.title_es || data.title || prev.title,
          content: data.content_es || data.content || prev.content,
          titleFont: data.titleFont || prev.titleFont,
          contentFont: data.contentFont || prev.contentFont
        }));
        setRawData(data);

        // Fuentes desde localStorage (dataURL) para evitar CORS
        try {
          const uploadedFonts = JSON.parse(localStorage.getItem('uploadedFonts') || '[]');
          uploadedFonts.forEach(f => injectFont(f.name, f.url));
        } catch {}

        // Fuentes desde Firestore
        const fontsCol = fsCollection(db, 'fonts');
        const fontsSnap = await getDocs(fontsCol);
        fontsSnap.forEach(d => {
          const f = d.data();
          injectFont(f.name, f.dataUrl || f.url);
        });

        setFontsReady(true);
      } catch (e) {
        setFontsReady(true);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const localizeContent = async () => {
      if (!rawData) return;
      const lang = language || 'es';
      if (lang === 'es') {
        setPageData(prev => ({
          ...prev,
          title: rawData.title_es || rawData.title || prev.title,
          content: rawData.content_es || rawData.content || prev.content
        }));
        return;
      }

      const localizedTitle = rawData[`title_${lang}`];
      const localizedContent = rawData[`content_${lang}`];

      if (localizedTitle || localizedContent) {
        setPageData(prev => ({
          ...prev,
          title: localizedTitle || rawData.title_es || rawData.title || prev.title,
          content: localizedContent || rawData.content_es || rawData.content || prev.content
        }));
        return;
      }

      try {
        const [translatedTitle, translatedContent] = await translateBatch([
          rawData.title_es || rawData.title || 'Contáctanos',
          rawData.content_es || rawData.content || ''
        ], lang, 'es');

        const resultTitle = translatedTitle || rawData.title_es || rawData.title || 'Contáctanos';
        const resultContent = translatedContent || rawData.content_es || rawData.content || '';

        setPageData(prev => ({
          ...prev,
          title: resultTitle,
          content: resultContent
        }));

        const updates = {};
        if (!rawData[`title_${lang}`]) {
          updates[`title_${lang}`] = resultTitle;
        }
        if (!rawData[`content_${lang}`]) {
          updates[`content_${lang}`] = resultContent;
        }
        if (Object.keys(updates).length > 0) {
          await setDoc(doc(db, 'pages', 'contacto'), updates, { merge: true });
          setRawData(prev => (prev ? { ...prev, ...updates } : prev));
        }
      } catch (error) {
        console.error('Error translating Contacto page:', error);
      }
    };

    localizeContent();
  }, [language, rawData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      // Guardar mensaje en Firestore
      await addDoc(collection(db, 'messages'), {
        name: form.nombre,
        email: form.email,
        message: form.mensaje,
        createdAt: serverTimestamp()
      });

      // Enviar email vía EmailJS si está configurado
      try {
        const emailjs = (await import('@emailjs/browser')).default;
        const SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
        const TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
        const PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

        if (SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY) {
          await emailjs.send(
            SERVICE_ID,
            TEMPLATE_ID,
            {
              from_name: form.nombre,
              from_email: form.email,
              message: form.mensaje
            },
            {
              publicKey: PUBLIC_KEY
            }
          );
        }
      } catch (err) {
        // Silencioso si EmailJS no está instalado/configurado
        console.warn('EmailJS no configurado:', err?.message || err);
      }

      setSent(true);
      setForm({ nombre: '', email: '', mensaje: '' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Box className="contacto-mobile" sx={{ py: 8, pt: { xs: 12, md: 20 }, opacity: fontsReady ? 1 : 0, transition: 'opacity 0.01s ease' }}>
      <Container maxWidth="lg">
        <Typography
          className="contacto-title-mobile"
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

        {pageData.content && (
          <Typography
            sx={{
              textAlign: 'center',
              maxWidth: '600px',
              mx: 'auto',
              mb: 4,
              color: '#666',
              fontFamily: pageData.contentFont ? `"${pageData.contentFont}", sans-serif` : 'Roboto, sans-serif'
            }}
          >
            {pageData.content}
          </Typography>
        )}

        {sent && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {t.exito}
          </Alert>
        )}

        <Box className="contacto-form-mobile" component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '600px', mx: 'auto', mt: 2 }}>
          <Grid container spacing={2} sx={{ width: '100%' }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t.nombre}
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t.email}
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, width: '100%' }}>
            <TextField
              label={t.mensaje}
              name="mensaje"
              value={form.mensaje}
              onChange={handleChange}
              multiline
              rows={4}
              required
              sx={{ 
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  fontSize: '1.4rem',
                  padding: '20px',
                  minHeight: '100px'
                },
                '& .MuiInputBase-input': {
                  fontSize: '1.2rem',
                  lineHeight: 1.8,
                  padding: '12px !important'
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1.1rem'
                }
              }}
            />
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={sending}
              sx={{
                backgroundColor: '#c8626d',
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                '&:hover': { backgroundColor: '#b5555a' }
              }}
            >
              {sending ? t.enviando : t.enviar}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Contacto;


