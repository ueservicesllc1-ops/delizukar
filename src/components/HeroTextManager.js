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
  Slider
} from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const HeroTextManager = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [data, setData] = useState({
    es: '',
    en: '',
    pt: '',
    fr: '',
    fontSize: 4.5,
    fontFamily: 'BrittanySignature'
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'settings', 'heroText');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setData(docSnap.data());
      }
    } catch (err) {
      setError('Error al cargar textos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await setDoc(doc(db, 'settings', 'heroText'), data);
      setSuccess('Textos guardados correctamente');
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#c8626d', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoAwesome />
        <Typography variant="h6" fontWeight={700}>Editar Texto Flotante (Sobre Banner)</Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Este texto aparece directamente sobre la foto del banner principal.
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress color="inherit" /></Box>
        ) : (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Texto en Español"
                fullWidth
                value={data.es}
                onChange={(e) => setData({ ...data, es: e.target.value })}
                margin="dense"
              />
              <TextField
                label="Texto en Inglés"
                fullWidth
                value={data.en}
                onChange={(e) => setData({ ...data, en: e.target.value })}
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Texto en Portugués"
                fullWidth
                value={data.pt}
                onChange={(e) => setData({ ...data, pt: e.target.value })}
                margin="dense"
              />
              <TextField
                label="Texto en Francés"
                fullWidth
                value={data.fr}
                onChange={(e) => setData({ ...data, fr: e.target.value })}
                margin="dense"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ px: 2, mt: 2 }}>
                <Typography gutterBottom>Tamaño de Fuente (Rem)</Typography>
                <Slider
                  value={data.fontSize || 4.5}
                  min={1}
                  max={10}
                  step={0.1}
                  onChange={(e, val) => setData({ ...data, fontSize: val })}
                  valueLabelDisplay="auto"
                  sx={{ color: '#c8626d' }}
                />
              </Box>
            </Grid>
          </Grid>
        )}

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={saving || loading}
          sx={{ backgroundColor: '#c8626d', '&:hover': { backgroundColor: '#b5555a' } }}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HeroTextManager;
