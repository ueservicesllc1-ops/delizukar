import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Divider
} from '@mui/material';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AccordionMenuManager = ({ open, onClose }) => {
  const [data, setData] = useState({
    aboutTitle: 'Recién horneadas para ti',
    aboutContent: 'En Delizukar no hacemos cookies para almacenar. Cada pedido se hornea al momento con ingredientes de primera calidad. Luego las sellamos para que lleguen a tu puerta tan frescas como salieron del horno. Crujientes por fuera. Suaves y fundentes por dentro. Así debe ser una verdadera cookie.',
    aboutTitle_en: 'About our cookies',
    aboutContent_en: 'At Delizukar, we don\'t bake cookies to sit on a shelf. Every order is baked to order using top-quality ingredients. We then seal them to ensure they arrive at your doorstep as fresh as the moment they left the oven. Crispy on the outside, soft and gooey on the inside. That’s exactly how a real cookie should be.',
    
    differentTitle: '¿Por qué Delizukar?',
    differentContent: 'Porque las buenas cookies empiezan con ingredientes reales. Mantequilla de verdad. Huevos frescos. Chocolate premium. Sin conservantes. Sin sabores artificiales. Solo cookies artesanales hechas para disfrutarse recién horneadas.',
    differentTitle_en: 'What makes us different',
    differentContent_en: 'Because great cookies start with real ingredients. Real butter. Fresh eggs. Premium chocolate. No preservatives. No artificial flavors. Just artisanal cookies crafted to be enjoyed freshly baked.',
    
    ingredientsTitle: 'Ingredientes reales',
    ingredientsContent: 'Harina, mantequilla, huevos, azúcar blanca, azúcar moreno, chocolate, vainilla, polvo para hornear y una pizca de sal. Los ingredientes pueden variar ligeramente según el sabor. Nada más. Sin ingredientes extraños. Solo cookies gruesas, suaves y llenas de sabor. Delizukar no solo somos cookies, somos momentos dulces.',
    ingredientsTitle_en: 'Ingredients',
    ingredientsContent_en: 'Flour, butter, eggs, white sugar, brown sugar, chocolate, vanilla, baking powder, and a pinch of salt. Ingredients may vary slightly depending on the flavor. Nothing else. No strange additives. Just thick, soft, and flavor-packed cookies. At Delizukar, we aren\'t just about cookies; we are about creating sweet moments.'
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const docRef = doc(db, 'settings', 'accordionMenu');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setData(prev => ({ ...prev, ...docSnap.data() }));
      } else {
        // Si no existe, guardar valores por defecto
        await setDoc(docRef, { 
          ...data,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      setError('Error al cargar la configuración: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const docRef = doc(db, 'settings', 'accordionMenu');
      await setDoc(docRef, { 
        ...data,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin'
      });
      
      setSuccess('Configuración guardada exitosamente');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 2000);
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '15px' }
      }}
    >
      <DialogTitle sx={{ backgroundColor: '#c8626d', color: 'white' }}>
        <Typography variant="h6" fontWeight={700}>
          Gestionar Menú Desplegable Bilingüe (Mobile & Web)
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#c8626d' }} />
          </Box>
        ) : (
          <Grid container spacing={4}>
            {/* OPCIÓN 1: ACERCA DE */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={700} color="#c8626d" gutterBottom>
                OPCIÓN 1: ACERCA DE (ESPAÑOL)
              </Typography>
              <TextField
                fullWidth
                label="Título (ES)"
                name="aboutTitle"
                value={data.aboutTitle}
                onChange={handleChange}
                margin="dense"
              />
              <TextField
                fullWidth
                label="Contenido (ES)"
                name="aboutContent"
                value={data.aboutContent}
                onChange={handleChange}
                multiline
                rows={4}
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={700} color="#666" gutterBottom>
                OPTION 1: ABOUT (ENGLISH)
              </Typography>
              <TextField
                fullWidth
                label="Title (EN)"
                name="aboutTitle_en"
                value={data.aboutTitle_en || ''}
                onChange={handleChange}
                margin="dense"
              />
              <TextField
                fullWidth
                label="Content (EN)"
                name="aboutContent_en"
                value={data.aboutContent_en || ''}
                onChange={handleChange}
                multiline
                rows={4}
                margin="dense"
              />
            </Grid>
            
            <Grid item xs={12}><Divider /></Grid>
            
            {/* OPCIÓN 2: DIFERENCIACIÓN */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={700} color="#c8626d" gutterBottom>
                OPCIÓN 2: DIFERENCIACIÓN (ESPAÑOL)
              </Typography>
              <TextField
                fullWidth
                label="Título (ES)"
                name="differentTitle"
                value={data.differentTitle}
                onChange={handleChange}
                margin="dense"
              />
              <TextField
                fullWidth
                label="Contenido (ES)"
                name="differentContent"
                value={data.differentContent}
                onChange={handleChange}
                multiline
                rows={4}
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={700} color="#666" gutterBottom>
                OPTION 2: DIFFERENTIATION (ENGLISH)
              </Typography>
              <TextField
                fullWidth
                label="Title (EN)"
                name="differentTitle_en"
                value={data.differentTitle_en || ''}
                onChange={handleChange}
                margin="dense"
              />
              <TextField
                fullWidth
                label="Content (EN)"
                name="differentContent_en"
                value={data.differentContent_en || ''}
                onChange={handleChange}
                multiline
                rows={4}
                margin="dense"
              />
            </Grid>
            
            <Grid item xs={12}><Divider /></Grid>

            {/* OPCIÓN 3: INGREDIENTES */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={700} color="#c8626d" gutterBottom>
                OPCIÓN 3: INGREDIENTES (ESPAÑOL)
              </Typography>
              <TextField
                fullWidth
                label="Título (ES)"
                name="ingredientsTitle"
                value={data.ingredientsTitle}
                onChange={handleChange}
                margin="dense"
              />
              <TextField
                fullWidth
                label="Contenido (ES)"
                name="ingredientsContent"
                value={data.ingredientsContent}
                onChange={handleChange}
                multiline
                rows={4}
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={700} color="#666" gutterBottom>
                OPTION 3: INGREDIENTS (ENGLISH)
              </Typography>
              <TextField
                fullWidth
                label="Title (EN)"
                name="ingredientsTitle_en"
                value={data.ingredientsTitle_en || ''}
                onChange={handleChange}
                margin="dense"
              />
              <TextField
                fullWidth
                label="Content (EN)"
                name="ingredientsContent_en"
                value={data.ingredientsContent_en || ''}
                onChange={handleChange}
                multiline
                rows={4}
                margin="dense"
              />
            </Grid>
          </Grid>
        )}

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={saving}
          sx={{ backgroundColor: '#c8626d', '&:hover': { backgroundColor: '#b5555a' } }}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccordionMenuManager;
