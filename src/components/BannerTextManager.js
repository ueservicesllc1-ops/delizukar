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
  CircularProgress
} from '@mui/material';
import { Title } from '@mui/icons-material';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const BannerTextManager = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [texts, setTexts] = useState({
    es: '',
    en: '',
    pt: '',
    fr: ''
  });

  useEffect(() => {
    if (open) {
      fetchTexts();
    }
  }, [open]);

  const fetchTexts = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'settings', 'bannerText');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTexts(docSnap.data());
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
      await setDoc(doc(db, 'settings', 'bannerText'), texts);
      setSuccess('Textos guardados correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#c8626d', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Title />
        <Typography variant="h6" fontWeight={700}>Editar Texto del Banner</Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Este texto aparecerá <strong>únicamente</strong> en la barra rosa debajo del banner principal. Para el texto sobre la foto, usa "Texto Flotante".
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress color="inherit" /></Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Texto en Español"
              fullWidth
              value={texts.es}
              onChange={(e) => setTexts({ ...texts, es: e.target.value })}
            />
            <TextField
              label="Texto en Inglés"
              fullWidth
              value={texts.en}
              onChange={(e) => setTexts({ ...texts, en: e.target.value })}
            />
            <TextField
              label="Texto en Portugués"
              fullWidth
              value={texts.pt}
              onChange={(e) => setTexts({ ...texts, pt: e.target.value })}
            />
            <TextField
              label="Texto en Francés"
              fullWidth
              value={texts.fr}
              onChange={(e) => setTexts({ ...texts, fr: e.target.value })}
            />
          </Box>
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

export default BannerTextManager;
