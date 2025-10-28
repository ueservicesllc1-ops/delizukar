import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Divider
} from '@mui/material';
import {
  Close,
  LocalOffer,
  Save,
  Delete,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { doc, getDocs, addDoc, updateDoc, deleteDoc, collection, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const VoucherManager = ({ open, onClose }) => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discountPercentage: '',
    isActive: true,
    createdAt: new Date(),
    usedBy: [] // Array de UIDs de usuarios que ya usaron este voucher
  });

  useEffect(() => {
    if (open) {
      loadVouchers();
    }
  }, [open]);

  const loadVouchers = async () => {
    setLoading(true);
    setError('');
    try {
      const vouchersRef = collection(db, 'vouchers');
      const q = query(vouchersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const vouchersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setVouchers(vouchersData);
    } catch (error) {
      console.error('Error cargando vouchers:', error);
      setError('Error al cargar los vouchers');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Validaciones
      if (!formData.code.trim()) {
        throw new Error('El código es requerido');
      }
      if (!formData.discountPercentage || formData.discountPercentage <= 0 || formData.discountPercentage > 100) {
        throw new Error('El porcentaje debe estar entre 1 y 100');
      }

      // Verificar si el código ya existe
      const existingVoucher = vouchers.find(v => v.code.toLowerCase() === formData.code.toLowerCase());
      if (existingVoucher && existingVoucher.id !== editingVoucher?.id) {
        throw new Error('Este código ya existe');
      }

      const voucherData = {
        code: formData.code.trim().toUpperCase(),
        discountPercentage: parseFloat(formData.discountPercentage),
        isActive: formData.isActive,
        createdAt: editingVoucher ? editingVoucher.createdAt : new Date(),
        usedBy: editingVoucher ? editingVoucher.usedBy : []
      };

      if (editingVoucher) {
        await updateDoc(doc(db, 'vouchers', editingVoucher.id), voucherData);
        setSuccess('Voucher actualizado correctamente');
      } else {
        await addDoc(collection(db, 'vouchers'), voucherData);
        setSuccess('Voucher creado correctamente');
      }

      await loadVouchers();
      handleCloseForm();
    } catch (error) {
      console.error('Error guardando voucher:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (voucherId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este voucher?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'vouchers', voucherId));
      setSuccess('Voucher eliminado correctamente');
      await loadVouchers();
    } catch (error) {
      console.error('Error eliminando voucher:', error);
      setError('Error al eliminar el voucher');
    }
  };

  const handleEdit = (voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      code: voucher.code,
      discountPercentage: voucher.discountPercentage.toString(),
      isActive: voucher.isActive,
      createdAt: voucher.createdAt,
      usedBy: voucher.usedBy || []
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingVoucher(null);
    setFormData({
      code: '',
      discountPercentage: '',
      isActive: true,
      createdAt: new Date(),
      usedBy: []
    });
    setError('');
    setSuccess('');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleVoucherStatus = async (voucher) => {
    try {
      await updateDoc(doc(db, 'vouchers', voucher.id), {
        isActive: !voucher.isActive
      });
      setSuccess(`Voucher ${!voucher.isActive ? 'activado' : 'desactivado'} correctamente`);
      await loadVouchers();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      setError('Error al actualizar el estado del voucher');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        zIndex: 9999999,
        '& .MuiDialog-paper': {
          zIndex: 9999999
        },
        '& .MuiBackdrop-root': {
          zIndex: 9999998
        }
      }}
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          zIndex: 9999999
        }
      }}
      BackdropProps={{
        sx: {
          zIndex: 9999998
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 2,
          background: 'linear-gradient(135deg, #c8626d 0%, #be8782 100%)',
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LocalOffer sx={{ fontSize: '2rem' }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Gestión de Vouchers de Descuento
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#c8626d', fontWeight: 600 }}>
              Vouchers Existentes
            </Typography>
            <Button
              variant="contained"
              startIcon={<LocalOffer />}
              onClick={() => setShowForm(true)}
              sx={{
                background: 'linear-gradient(135deg, #c8626d 0%, #be8782 100%)',
                color: 'white',
                borderRadius: '25px',
                px: 3,
                py: 1,
                fontWeight: 700,
                '&:hover': {
                  background: 'linear-gradient(135deg, #be8782 0%, #c8626d 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(139,69,19,0.3)'
                }
              }}
            >
              Crear Voucher
            </Button>
          </Box>

          {/* Formulario */}
          {showForm && (
            <Card sx={{ mb: 3, borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, color: '#c8626d', fontWeight: 600 }}>
                  {editingVoucher ? 'Editar Voucher' : 'Nuevo Voucher'}
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Código del Voucher"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value)}
                      placeholder="Ej: DESCUENTO20"
                      required
                      sx={{ mb: 2 }}
                      helperText="El código será convertido a mayúsculas automáticamente"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Porcentaje de Descuento"
                      type="number"
                      value={formData.discountPercentage}
                      onChange={(e) => handleInputChange('discountPercentage', e.target.value)}
                      placeholder="Ej: 20"
                      required
                      inputProps={{ min: 1, max: 100 }}
                      sx={{ mb: 2 }}
                      helperText="Porcentaje de descuento (1-100%)"
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    <strong>Información importante:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    • Solo usuarios logueados pueden usar vouchers
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    • Cada usuario puede usar un voucher solo una vez
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    • El descuento se aplica al total del pedido
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Lista de vouchers */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {vouchers.map((voucher) => (
                <Grid item xs={12} md={6} lg={4} key={voucher.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card sx={{ 
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      border: voucher.isActive ? '2px solid #4caf50' : '2px solid #f44336'
                    }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#c8626d' }}>
                            {voucher.code}
                          </Typography>
                          <Chip
                            label={voucher.isActive ? 'Activo' : 'Inactivo'}
                            color={voucher.isActive ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                        
                        <Typography variant="h4" sx={{ color: '#c8626d', fontWeight: 700, mb: 1 }}>
                          {voucher.discountPercentage}%
                        </Typography>
                        
                        <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                          Descuento del total del pedido
                        </Typography>
                        
                        <Divider sx={{ my: 1 }} />
                        
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          <strong>Usado por:</strong> {voucher.usedBy?.length || 0} usuario(s)
                        </Typography>
                        
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          <strong>Creado:</strong> {voucher.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </Typography>
                      </CardContent>
                      
                      <CardActions sx={{ p: 2, pt: 0 }}>
                        <Button
                          size="small"
                          startIcon={<Edit />}
                          onClick={() => handleEdit(voucher)}
                          sx={{ color: '#c8626d' }}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          startIcon={voucher.isActive ? <Cancel /> : <CheckCircle />}
                          onClick={() => toggleVoucherStatus(voucher)}
                          sx={{ color: voucher.isActive ? '#f44336' : '#4caf50' }}
                        >
                          {voucher.isActive ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button
                          size="small"
                          startIcon={<Delete />}
                          onClick={() => handleDelete(voucher.id)}
                          sx={{ color: '#f44336' }}
                        >
                          Eliminar
                        </Button>
                      </CardActions>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          )}

          {vouchers.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <LocalOffer sx={{ fontSize: '4rem', color: '#ccc', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                No hay vouchers creados
              </Typography>
              <Typography variant="body2" sx={{ color: '#999' }}>
                Crea tu primer voucher de descuento
              </Typography>
            </Box>
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 3, gap: 2 }}>
          {showForm && (
            <>
              <Button
                onClick={handleCloseForm}
                variant="outlined"
                sx={{
                  borderColor: '#c8626d',
                  color: '#c8626d',
                  '&:hover': {
                    borderColor: '#be8782',
                    backgroundColor: '#be878210'
                  }
                }}
              >
                Cancelar
              </Button>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  variant="contained"
                  startIcon={<Save />}
                  sx={{
                    background: 'linear-gradient(135deg, #c8626d 0%, #be8782 100%)',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    borderRadius: '25px',
                    fontWeight: 700,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #be8782 0%, #c8626d 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(139,69,19,0.3)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {saving ? 'Guardando...' : (editingVoucher ? 'Actualizar Voucher' : 'Crear Voucher')}
                </Button>
              </motion.div>
            </>
          )}
          
          {!showForm && (
            <Button
              onClick={onClose}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #c8626d 0%, #be8782 100%)',
                color: 'white',
                px: 4,
                py: 1.5,
                borderRadius: '25px',
                fontWeight: 700,
                '&:hover': {
                  background: 'linear-gradient(135deg, #be8782 0%, #c8626d 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(139,69,19,0.3)'
                }
              }}
            >
              Cerrar
            </Button>
          )}
        </DialogActions>
      </motion.div>
    </Dialog>
  );
};

export default VoucherManager;
