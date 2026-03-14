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
    aboutTitle: 'Acerca de nuestra cookie',
    aboutContent: 'Nuestras galletas son horneadas artesanalmente cada día con ingredientes de la más alta calidad. Inspiradas en el estilo de Nueva York, cada bocado ofrece una textura crujiente por fuera y suave por dentro.',
    differentTitle: 'Lo que nos hace diferentes',
    differentContent: 'No escatimamos en calidad. Usamos chocolate premium, mantequilla real y técnicas de horneado perfeccionadas durante años para asegurar que cada galleta sea una experiencia inolvidable.',
    ingredientsTitle: 'Ingredientes',
    ingredientsContent: 'Harina de trigo enriquecida, mantequilla premium, chips de chocolate belga, azúcar morena, huevos de granja, esencia de vainilla natural y una pizca de sal marina.'
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
        setData(docSnap.data());
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
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '15px' }
      }}
    >
      <DialogTitle sx={{ backgroundColor: '#c8626d', color: 'white' }}>
        <Typography variant="h6" fontWeight={700}>
          Gestionar Menú Desplegable (Mobile)
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#c8626d' }} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={700} color="#c8626d">
                Opción 1: Acerca de
              </Typography>
              <TextField
                fullWidth
                label="Título"
                name="aboutTitle"
                value={data.aboutTitle}
                onChange={handleChange}
                margin="dense"
              />
              <TextField
                fullWidth
                label="Contenido"
                name="aboutContent"
                value={data.aboutContent}
                onChange={handleChange}
                multiline
                rows={3}
                margin="dense"
              />
            </Grid>
            <Grid item xs={12}><Divider /></Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={700} color="#c8626d">
                Opción 2: Diferenciación
              </Typography>
              <TextField
                fullWidth
                label="Título"
                name="differentTitle"
                value={data.differentTitle}
                onChange={handleChange}
                margin="dense"
              />
              <TextField
                fullWidth
                label="Contenido"
                name="differentContent"
                value={data.differentContent}
                onChange={handleChange}
                multiline
                rows={3}
                margin="dense"
              />
            </Grid>
            <Grid item xs={12}><Divider /></Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={700} color="#c8626d">
                Opción 3: Ingredientes
              </Typography>
              <TextField
                fullWidth
                label="Título"
                name="ingredientsTitle"
                value={data.ingredientsTitle}
                onChange={handleChange}
                margin="dense"
              />
              <TextField
                fullWidth
                label="Contenido"
                name="ingredientsContent"
                value={data.ingredientsContent}
                onChange={handleChange}
                multiline
                rows={3}
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
