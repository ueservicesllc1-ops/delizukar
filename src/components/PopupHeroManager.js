import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Snackbar
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Save,
  Close,
  LocalOffer,
  Star,
  Visibility,
  Settings,
  AutoAwesome,
  FlashOn
} from '@mui/icons-material';
import { collection, addDoc, updateDoc, deleteDoc, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import PopupHero from './PopupHero';

const PopupHeroManager = ({ open, onClose }) => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [popupPreviewOpen, setPopupPreviewOpen] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Estados del formulario
  const [formData, setFormData] = useState({
    title: '¡Ofertas Especiales!',
    description: 'Descubre nuestras deliciosas galletas artesanales horneadas con ingredientes premium y mucho amor',
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    originalPrice: '15.99',
    discountPrice: '12.99',
    discountPercent: '19',
    discountText: '¡APROVECHA ESTA OFERTA!',
    discountConditions: 'A usuarios registrados en su primera compra',
    discountCode: 'BIENVENIDO20',
    buttonText: '¡Aceptar la Oferta!',
    actionUrl: '/productos',
    isActive: true
  });

  // Cargar ofertas existentes
  useEffect(() => {
    if (open) {
      loadOffers();
    }
  }, [open]);

  const loadOffers = async () => {
    setLoading(true);
    try {
      // Cargar solo la oferta principal
      const mainOfferRef = doc(db, 'popupOffers', 'mainOffer');
      const mainOfferSnap = await getDocs(collection(db, 'popupOffers'));
      
      if (mainOfferSnap.docs.length > 0) {
        const mainOffer = mainOfferSnap.docs.find(doc => doc.id === 'mainOffer');
        if (mainOffer) {
          setOffers([{
            id: mainOffer.id,
            ...mainOffer.data()
          }]);
        } else {
          setOffers([]);
        }
      } else {
        setOffers([]);
      }
    } catch (error) {
      setError('Error cargando ofertas: ' + error.message);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer.id);
    setFormData({
      title: offer.title || '',
      description: offer.description || '',
      image: offer.image || '',
      originalPrice: offer.originalPrice || '',
      discountPrice: offer.discountPrice || '',
      discountPercent: offer.discountPercent || '',
      discountText: offer.discountText || '¡APROVECHA ESTA OFERTA!',
      discountConditions: offer.discountConditions || 'A usuarios registrados en su primera compra',
      discountCode: offer.discountCode || 'BIENVENIDO20',
      buttonText: offer.buttonText || '',
      actionUrl: offer.actionUrl || '',
      isActive: offer.isActive !== false
    });
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingOffer(null);
    setFormData({
      title: '¡Ofertas Especiales!',
      description: 'Descubre nuestras deliciosas galletas artesanales horneadas con ingredientes premium y mucho amor',
      image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      originalPrice: '15.99',
      discountPrice: '12.99',
      discountPercent: '19',
      discountText: '¡APROVECHA ESTA OFERTA!',
      discountConditions: 'A usuarios registrados en su primera compra',
      discountCode: 'BIENVENIDO20',
      buttonText: '¡Aceptar la Oferta!',
      actionUrl: '/productos',
      isActive: true
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const offerData = {
        ...formData,
        originalPrice: parseFloat(formData.originalPrice) || 0,
        discountPrice: parseFloat(formData.discountPrice) || 0,
        discountPercent: parseFloat(formData.discountPercent) || 0,
        discountText: formData.discountText || '¡APROVECHA ESTA OFERTA!',
        discountConditions: formData.discountConditions || 'A usuarios registrados en su primera compra',
        discountCode: formData.discountCode || 'BIENVENIDO20',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Siempre usar el mismo documento para la oferta principal
      const mainOfferRef = doc(db, 'popupOffers', 'mainOffer');
      
      try {
        // Intentar actualizar el documento principal
        await updateDoc(mainOfferRef, offerData);
        setSnackbarMessage('¡Oferta actualizada correctamente!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (error) {
        // Si no existe, crearlo
        if (error.code === 'not-found') {
          await setDoc(mainOfferRef, offerData);
          setSnackbarMessage('¡Oferta creada correctamente!');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
      } else {
          throw error;
        }
      }

      setShowForm(false);
      setEditingOffer(null);
      loadOffers();
    } catch (error) {
      setSnackbarMessage('Error al guardar la oferta: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (offerId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta oferta?')) {
      try {
        await deleteDoc(doc(db, 'popupOffers', offerId));
        setSuccess('Oferta eliminada correctamente');
        loadOffers();
      } catch (error) {
        setError('Error eliminando oferta: ' + error.message);
      }
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingOffer(null);
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          height: '800px',
          width: '1200px'
        }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: '#8B4513', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <LocalOffer />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Gestor de Popup Hero
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0, height: '100%' }}>
        <Box sx={{ height: '100%', display: 'flex' }}>
          {/* Panel Izquierdo - Controles de Edición */}
          <Box sx={{ 
            width: '45%', 
            borderRight: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column'
          }}>
        <Box sx={{ 
              p: 2, 
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#f8f9fa'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#8B4513' }}>
                Configuración del Popup
              </Typography>
            </Box>
            
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#8B4513' }}>
                      Configuración General
                    </Typography>
                    
                    <TextField
                      fullWidth
                      label="Título Principal"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Ej: ¡Ofertas Especiales!"
                      sx={{ mb: 2 }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Descripción"
                      multiline
                      rows={3}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Descripción de la oferta..."
                      sx={{ mb: 2 }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Texto del Botón"
                      value={formData.buttonText}
                      onChange={(e) => handleInputChange('buttonText', e.target.value)}
                      placeholder="Ej: ¡Aceptar la Oferta!"
                      sx={{ mb: 2 }}
                    />
                    
                    <TextField
                      fullWidth
                      label="URL de Acción"
                      value={formData.actionUrl}
                      onChange={(e) => handleInputChange('actionUrl', e.target.value)}
                      placeholder="Ej: /productos"
                      sx={{ mb: 2 }}
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isActive}
                          onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        />
                      }
                      label="Popup Activo"
                    />
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#8B4513' }}>
                      Configuración de Imagen
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="URL de Imagen"
                          value={formData.image}
                          onChange={(e) => handleInputChange('image', e.target.value)}
                          placeholder="URL de la imagen..."
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Porcentaje de Descuento"
                          type="number"
                          value={formData.discountPercent}
                          onChange={(e) => handleInputChange('discountPercent', e.target.value)}
                          placeholder="19"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Texto del Descuento"
                          value={formData.discountText}
                          onChange={(e) => handleInputChange('discountText', e.target.value)}
                          placeholder="¡APROVECHA ESTA OFERTA!"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Condiciones del Descuento"
                          value={formData.discountConditions}
                          onChange={(e) => handleInputChange('discountConditions', e.target.value)}
                          placeholder="A usuarios registrados en su primera compra"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Código de Descuento"
                          value={formData.discountCode}
                          onChange={(e) => handleInputChange('discountCode', e.target.value)}
                          placeholder="BIENVENIDO20"
                sx={{
                            '& .MuiInputBase-input': {
                              textTransform: 'uppercase',
                              fontFamily: 'monospace',
                              fontWeight: 'bold',
                              letterSpacing: '0.1em'
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#8B4513' }}>
                        Ofertas Existentes
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleAddNew}
                        size="small"
                        sx={{
                          backgroundColor: '#8B4513',
                          '&:hover': { backgroundColor: '#A0522D' }
                        }}
                      >
                        Nueva Oferta
                      </Button>
                    </Box>
                    
                    {loading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress />
                      </Box>
                    ) : (
                      <List sx={{ maxHeight: '200px', overflow: 'auto' }}>
                        {offers.map((offer) => (
                          <ListItem key={offer.id} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1, py: 1 }}>
                            <ListItemText
                              primary={offer.title}
                              secondary={`${offer.description} - ${offer.isActive ? 'Activo' : 'Inactivo'}`}
                            />
                            <ListItemSecondaryAction>
                              <IconButton onClick={() => handleEdit(offer)} size="small">
                                <Edit />
                              </IconButton>
                              <IconButton onClick={() => handleDelete(offer.id)} size="small">
                                <Delete />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Box>

          {/* Panel Derecho - Vista Previa */}
          <Box sx={{ 
            width: '55%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ 
              p: 2, 
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#f8f9fa',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#8B4513' }}>
                Vista Previa en Tiempo Real
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setPreviewOpen(true)}
                sx={{
                  borderColor: '#8B4513',
                  color: '#8B4513',
                  '&:hover': { backgroundColor: '#8B451320' }
                }}
              >
                Pantalla Completa
              </Button>
            </Box>
            
                  <Box sx={{ 
              flex: 1, 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
              backgroundColor: '#f5f5f5',
                    position: 'relative',
                    overflow: 'hidden',
              p: 2
                  }}>
              {/* Popup Hero Fijo - Exactamente igual al original */}
                    <Box sx={{
                      width: '100%',
                maxWidth: '1200px',
                height: 'auto',
                maxHeight: '70vh',
                borderRadius: '32px',
                overflow: 'hidden',
                boxShadow: '0 32px 100px rgba(0,0,0,0.25)',
                backgroundColor: 'transparent',
                      position: 'relative',
                backdropFilter: 'blur(20px)',
                transform: 'scale(0.9)',
                transformOrigin: 'center'
              }}>
                {/* Fondo blanco elegante con efectos */}
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(45deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.01) 100%)',
                    backdropFilter: 'blur(1px)'
                  }
                }} />

                {/* Partículas de fondo flotantes */}
                <motion.div
                  animate={{
                    rotate: 360,
                    scale: [1, 1.3, 1],
                    y: [-20, 20, -20]
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    position: 'absolute',
                    top: '10%',
                    left: '10%',
                    width: 60,
                    height: 60,
                    background: 'radial-gradient(circle, rgba(255,107,107,0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                    zIndex: 1
                  }}
                />

                <motion.div
                  animate={{
                    rotate: -360,
                    scale: [1, 1.2, 1],
                    x: [-15, 15, -15]
                  }}
                  transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    position: 'absolute',
                    top: '20%',
                    right: '15%',
                    width: 40,
                    height: 40,
                    background: 'radial-gradient(circle, rgba(76,175,80,0.08) 0%, transparent 70%)',
                    borderRadius: '50%',
                    zIndex: 1
                  }}
                />

                <motion.div
                  animate={{
                    rotate: 180,
                    scale: [1, 1.4, 1],
                    y: [10, -10, 10]
                  }}
                  transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    position: 'absolute',
                    bottom: '20%',
                    left: '20%',
                    width: 50,
                    height: 50,
                    background: 'radial-gradient(circle, rgba(156,39,176,0.06) 0%, transparent 70%)',
                    borderRadius: '50%',
                    zIndex: 1
                  }}
                />

                {/* Header rosa con efectos */}
                      <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '140px',
                        background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)',
                  zIndex: 3,
                  boxShadow: '0 4px 20px rgba(255,107,107,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {/* Partículas flotantes */}
                  <motion.div
                    animate={{
                      rotate: 360,
                      scale: [1, 1.2, 1],
                      y: [-10, 10, -10]
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{
                      position: 'absolute',
                      top: '20px',
                      left: '20px',
                      width: 15,
                      height: 15,
                      background: 'rgba(255,255,255,0.3)',
                      borderRadius: '50%',
                      backdropFilter: 'blur(5px)'
                    }}
                  />
                  
                  <motion.div
                    animate={{
                      rotate: -360,
                      scale: [1, 1.3, 1],
                      y: [10, -10, 10]
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{
                      position: 'absolute',
                      top: '40px',
                      right: '30px',
                      width: 20,
                      height: 20,
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: '50%',
                      backdropFilter: 'blur(5px)'
                    }}
                  />

                  <motion.div
                    animate={{
                      rotate: 180,
                      scale: [1, 1.1, 1],
                      x: [-5, 5, -5]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{
                      position: 'absolute',
                      top: '60px',
                      left: '50px',
                      width: 12,
                      height: 12,
                      background: 'rgba(255,255,255,0.4)',
                      borderRadius: '50%',
                      backdropFilter: 'blur(5px)'
                    }}
                  />

                  <motion.div
                    animate={{
                      rotate: -180,
                      scale: [1, 1.4, 1],
                      x: [5, -5, 5]
                    }}
                    transition={{
                      duration: 7,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{
                      position: 'absolute',
                      top: '30px',
                      right: '60px',
                      width: 18,
                      height: 18,
                      background: 'rgba(255,255,255,0.25)',
                      borderRadius: '50%',
                      backdropFilter: 'blur(5px)'
                    }}
                  />

                  <motion.div
                    animate={{
                      rotate: 90,
                      scale: [1, 1.2, 1],
                      y: [-8, 8, -8]
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{
                      position: 'absolute',
                      bottom: '30px',
                      left: '80px',
                      width: 14,
                      height: 14,
                      background: 'rgba(255,255,255,0.35)',
                      borderRadius: '50%',
                      backdropFilter: 'blur(5px)'
                    }}
                  />

                  <motion.div
                    animate={{
                      rotate: -90,
                      scale: [1, 1.3, 1],
                      y: [8, -8, 8]
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{
                      position: 'absolute',
                      bottom: '20px',
                      right: '40px',
                      width: 16,
                      height: 16,
                      background: 'rgba(255,255,255,0.3)',
                      borderRadius: '50%',
                      backdropFilter: 'blur(5px)'
                    }}
                  />

                  {/* Logo centrado con efecto dorado sutil */}
                  <motion.img
                    src="/LOGO.png"
                    alt="DeliZuKar Logo"
                    style={{
                      height: '90px',
                      width: 'auto',
                      filter: 'sepia(1) saturate(1.5) hue-rotate(40deg) brightness(1.1) drop-shadow(0 2px 8px rgba(255,215,0,0.2))',
                        position: 'relative',
                      zIndex: 2
                    }}
                    animate={{
                      y: [-2, 2, -2]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                      </Box>
                      
                      {/* Contenido principal */}
                <Box sx={{ p: 0, position: 'relative', zIndex: 2, pt: '140px' }}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', md: 'row' },
                    minHeight: '350px'
                  }}>
                    {/* LADO IZQUIERDO - CONTENIDO */}
                    <Box sx={{
                      flex: 1, 
                      padding: '30px 25px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      position: 'relative',
                      minHeight: '100%',
                      overflow: 'auto'
                    }}>
                        {/* Título principal */}
                      <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                      >
                        <Typography
                          variant="h4"
                          sx={{
                            color: '#1a1a1a',
                          fontWeight: 800, 
                            mb: 1.5,
                            fontFamily: 'Playfair Display, serif',
                            textShadow: '0 2px 10px rgba(0,0,0,0.1)',
                            background: 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontSize: '1.8rem'
                          }}
                        >
                          ¡Bienvenido a DeliZuKar!
                        </Typography>
                      </motion.div>
                        
                        {/* Subtítulo */}
                      <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                          color: '#ff6b6b', 
                          fontWeight: 700,
                            mb: 2,
                            fontFamily: 'Playfair Display, serif',
                            textShadow: '0 1px 5px rgba(255,107,107,0.2)',
                            fontSize: '1.2rem'
                          }}
                        >
                          {formData.title || '¡Ofertas Especiales!'}
                        </Typography>
                      </motion.div>
                        
                        {/* Descripción */}
                      <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                          color: '#666', 
                            mb: 2,
                            lineHeight: 1.6,
                            fontSize: '0.95rem',
                            fontWeight: 500
                          }}
                        >
                          {formData.description || 'Descubre nuestras deliciosas galletas artesanales horneadas con ingredientes premium y mucho amor'}
                        </Typography>
                      </motion.div>


                      {/* Descuento Grande con Efectos */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1.0 }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                          <motion.div
                            whileHover={{ 
                              scale: 1.1, 
                              rotate: [0, -2, 2, 0],
                              y: -5
                            }}
                            whileTap={{ scale: 0.95 }}
                            animate={{
                              y: [-3, 3, -3],
                              rotate: [0, 1, -1, 0],
                              scale: [1, 1.05, 1]
                            }}
                            transition={{
                              duration: 4,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            style={{
                              background: 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)',
                              borderRadius: '15px',
                              padding: '10px 20px',
                              boxShadow: '0 6px 24px rgba(255,107,107,0.4)',
                              border: '2px solid #ff6b6b',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                          >
                            {/* Efecto de brillo */}
                            <motion.div
                              animate={{
                                x: ['-100%', '100%']
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear"
                              }}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                                zIndex: 1
                              }}
                            />
                            
                            <Typography
                              variant="h4"
                              sx={{
                            color: 'white',
                                fontWeight: 900,
                                fontSize: '1.3rem',
                                textAlign: 'center',
                                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                                position: 'relative',
                                zIndex: 2,
                                fontFamily: 'Playfair Display, serif'
                              }}
                            >
                              {formData.discountPercent || '20'}% DESCUENTO
                            </Typography>
                            
                            <Typography
                              variant="body1"
                              sx={{
                                color: 'rgba(255,255,255,0.9)',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                textAlign: 'center',
                                textShadow: '0 1px 5px rgba(0,0,0,0.3)',
                                position: 'relative',
                                zIndex: 2,
                                mt: 0.3
                              }}
                            >
                              {formData.discountText || '¡APROVECHA ESTA OFERTA!'}
                            </Typography>
                            
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'rgba(255,255,255,0.8)',
                                fontWeight: 500,
                                fontSize: '0.7rem',
                                textAlign: 'center',
                                textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                position: 'relative',
                                zIndex: 2,
                                mt: 0.5,
                                fontStyle: 'italic'
                              }}
                            >
                              *{formData.discountConditions || 'A usuarios registrados en su primera compra'}
                        </Typography>
                        
                            {formData.discountCode && (
                          <Box sx={{
                                mt: 0.8, 
                                p: 0.5, 
                                backgroundColor: 'rgba(255,255,255,0.1)', 
                            borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.2)'
                              }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'rgba(255,255,255,0.9)',
                                    fontWeight: 600,
                                    fontSize: '0.7rem',
                                    textAlign: 'center',
                                    textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                    position: 'relative',
                                    zIndex: 2,
                                    fontFamily: 'monospace',
                                    letterSpacing: '0.1em'
                                  }}
                                >
                                  Código: {formData.discountCode}
                                </Typography>
                          </Box>
                            )}
                          </motion.div>
                        </Box>
                      </motion.div>

                      {/* Botón principal con efectos espectaculares */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1.2 }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <motion.div
                            whileHover={{ 
                              scale: 1.05, 
                              y: -5,
                              rotate: [0, -1, 1, 0]
                            }}
                            whileTap={{ scale: 0.95 }}
                            animate={{
                              y: [-2, 2, -2],
                              boxShadow: [
                                '0 8px 32px rgba(255,107,107,0.3)',
                                '0 12px 40px rgba(255,107,107,0.4)',
                                '0 8px 32px rgba(255,107,107,0.3)'
                              ]
                            }}
                            transition={{
                              duration: 4,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          >
                            <Button
                              variant="contained"
                              size="medium"
                              startIcon={<motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              >
                                <FlashOn />
                              </motion.div>}
                              sx={{
                          background: 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)',
                          color: 'white',
                          fontWeight: 800,
                                fontSize: '0.9rem',
                                px: 3,
                                py: 1,
                                borderRadius: '50px',
                                textTransform: 'none',
                          border: '2px solid #ff6b6b',
                                boxShadow: '0 8px 32px rgba(255,107,107,0.3)',
                                position: 'relative',
                                overflow: 'hidden',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #ff5252 0%, #ff1744 100%)',
                                  border: '2px solid #ff5252'
                                },
                                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: '-100%',
                                  width: '100%',
                                  height: '100%',
                                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                  transition: 'left 0.5s'
                                },
                                '&:hover::before': {
                                  left: '100%'
                                }
                              }}
                            >
                              {formData.buttonText || '¡Aceptar la Oferta!'}
                            </Button>
                          </motion.div>
                        </Box>
                      </motion.div>
                          </Box>

                    {/* LADO DERECHO - CONTENEDOR DE FOTO */}
                          <Box sx={{
                      flex: 1, 
                      padding: '0',
                            display: 'flex',
                      alignItems: 'stretch',
                      justifyContent: 'stretch',
                      position: 'relative',
                      overflow: 'hidden',
                      backgroundColor: '#f8f9fa',
                      minHeight: '100%'
                    }}>
                      {/* Contenedor máscara - ventana fija que ocupa todo el espacio */}
                          <Box sx={{
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        overflow: 'hidden',
                        background: '#000',
                            display: 'flex',
                            alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {/* Imagen que se mueve detrás de la máscara */}
                        <motion.img
                          src={formData.image || "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"}
                          alt="Deliciosas Galletas"
                          style={{
                            width: '120%',
                            height: '120%',
                            objectFit: 'cover',
                            position: 'absolute',
                            top: '-10%',
                            left: '-10%'
                          }}
                          animate={{
                            x: [-20, 20, -20],
                            y: [-15, 15, -15],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{
                            duration: 15,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                          </Box>
                        </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
              </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<Save />}
          disabled={saving}
          sx={{
            backgroundColor: '#8B4513',
            '&:hover': { backgroundColor: '#A0522D' },
            mr: 2
          }}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
        <Button
          onClick={handleClose}
          variant="outlined"
        >
          Cerrar
        </Button>
      </DialogActions>

      {/* Popup de vista previa completa */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            width: '90vw',
            height: '90vh',
            maxWidth: 'none',
            borderRadius: '20px'
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#8B4513', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Vista Previa del Popup Hero
          </Typography>
          <IconButton onClick={() => setPreviewOpen(false)} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '100%' }}>
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#f5f5f5'
          }}>
            <PopupHero 
              open={true} 
              onClose={() => setPreviewOpen(false)} 
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Snackbar para mensajes de éxito/error */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default PopupHeroManager;
