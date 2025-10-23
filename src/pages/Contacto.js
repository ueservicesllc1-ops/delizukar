import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, TextField, Button, Grid, Alert } from '@mui/material';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp, doc, getDoc, collection as fsCollection, getDocs } from 'firebase/firestore';

const Contacto = () => {
  const [pageData, setPageData] = useState({
    title: 'Contact Us',
    content: "We'd love to hear from you. Send us a message and we'll get back to you.",
    titleFont: 'Playfair Display',
    contentFont: 'Roboto'
  });
  const [fontsReady, setFontsReady] = useState(false);
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
        const docRef = await getDoc(doc(db, 'pages', 'contacto'));
        if (docRef.exists()) {
          setPageData(docRef.data());
        }

        // Fuentes desde localStorage (dataURL) para evitar CORS
        try {
          const uploadedFonts = JSON.parse(localStorage.getItem('uploadedFonts') || '[]');
          uploadedFonts.forEach(f => injectFont(f.name, f.url));
        } catch {}

        // Fuentes desde Firestore
        const fontsCol = fsCollection(db, 'fonts');
        const snap = await getDocs(fontsCol);
        snap.forEach(d => {
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
    <Box className="contacto-mobile" sx={{ py: 8, pt: 25, opacity: fontsReady ? 1 : 0, transition: 'opacity 200ms ease' }}>
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


        {sent && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Your message has been sent. We'll reply shortly.
          </Alert>
        )}

        <Box className="contacto-form-mobile" component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '600px', mx: 'auto' }}>
          <Grid container spacing={2} sx={{ width: '100%', ml: '80px' }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <TextField
              label="Message"
              name="mensaje"
              value={form.mensaje}
              onChange={handleChange}
              multiline
              rows={4}
              required
              sx={{ 
                width: '90%',
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
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Contacto;


