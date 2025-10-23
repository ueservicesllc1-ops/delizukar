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
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const MinProductsManager = ({ open, onClose }) => {
  const [minProducts, setMinProducts] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (open) {
      loadMinProducts();
    }
  }, [open]);

  const loadMinProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const docRef = doc(db, 'settings', 'minProducts');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMinProducts(data.value || 1);
        // También actualizar localStorage para acceso rápido
        localStorage.setItem('minProducts', (data.value || 1).toString());
      } else {
        // Si no existe, crear con valor por defecto
        const defaultValue = 1;
        await setDoc(docRef, { 
          value: defaultValue,
          createdAt: new Date().toISOString()
        });
        setMinProducts(defaultValue);
        localStorage.setItem('minProducts', defaultValue.toString());
      }
    } catch (err) {
      setError('Error al cargar la configuración: ' + err.message);
      console.error('Error loading min products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (minProducts < 1) {
      setError('El mínimo de productos debe ser al menos 1');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const docRef = doc(db, 'settings', 'minProducts');
      
      // Guardar en Firebase con timestamp
      await setDoc(docRef, { 
        value: minProducts,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin'
      });
      
      // Verificar que se guardó correctamente
      const verifyDoc = await getDoc(docRef);
      if (verifyDoc.exists() && verifyDoc.data().value === minProducts) {
        setSuccess('Configuración guardada exitosamente en Firebase');
        
        // Guardar en localStorage también para acceso rápido
        localStorage.setItem('minProducts', minProducts.toString());
        
        setTimeout(() => {
          setSuccess('');
          onClose();
        }, 2000);
      } else {
        throw new Error('No se pudo verificar el guardado');
      }
      
    } catch (err) {
      setError('Error al guardar en Firebase: ' + err.message);
      console.error('Error saving min products:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 2 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: '#c8626d',
            fontFamily: 'Playfair Display, serif'
          }}
        >
          Configuración de Mínimo de Productos
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#c8626d' }} />
          </Box>
        ) : (
          <Box sx={{ py: 2 }}>
            <Typography
              variant="body1"
              sx={{
                color: '#666',
                mb: 3,
                lineHeight: 1.6
              }}
            >
              Establece el número mínimo de productos que debe tener el carrito 
              para poder proceder con la compra.
            </Typography>

            <TextField
              fullWidth
              label="Mínimo de productos"
              type="number"
              value={minProducts}
              onChange={(e) => setMinProducts(parseInt(e.target.value) || 1)}
              inputProps={{ min: 1 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px'
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#c8626d'
                },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#c8626d'
                }
              }}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: '12px' }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mt: 2, borderRadius: '12px' }}>
                {success}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{
            borderColor: '#c8626d',
            color: '#c8626d',
            borderRadius: '25px',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            '&:hover': {
              backgroundColor: '#c8626d20',
              borderColor: '#c8626d'
            }
          }}
        >
          Cancelar
        </Button>
        
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || loading}
          sx={{
            backgroundColor: '#c8626d',
            color: 'white',
            borderRadius: '25px',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            '&:hover': {
              backgroundColor: '#b5555a'
            }
          }}
        >
          {saving ? (
            <>
              <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
              Guardando...
            </>
          ) : (
            'Guardar'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MinProductsManager;
