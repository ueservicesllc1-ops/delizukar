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
  IconButton,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Close,
  Facebook,
  Instagram,
  Twitter,
  YouTube,
  WhatsApp,
  LinkedIn,
  Pinterest,
  Save,
  Share
} from '@mui/icons-material';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const SocialMediaManager = ({ open, onClose }) => {
  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    whatsapp: '',
    linkedin: '',
    tiktok: '',
    pinterest: ''
  });
  const [loading, setLoading] = useState(false);

  // Cargar enlaces existentes
  useEffect(() => {
    if (open) {
      loadSocialLinks();
    }
  }, [open]);

  const loadSocialLinks = async () => {
    try {
      const docRef = doc(db, 'config', 'socialMedia');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setSocialLinks(docSnap.data());
      }
    } catch (error) {
      console.error('Error cargando enlaces de redes sociales:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'config', 'socialMedia'), socialLinks);
      alert('Enlaces de redes sociales guardados correctamente');
      onClose();
    } catch (error) {
      console.error('Error guardando enlaces:', error);
      alert('Error al guardar los enlaces');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (platform, value) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  const socialPlatforms = [
    { key: 'facebook', label: 'Facebook', icon: <Facebook />, color: '#1877F2' },
    { key: 'instagram', label: 'Instagram', icon: <Instagram />, color: '#E4405F' },
    { key: 'twitter', label: 'Twitter', icon: <Twitter />, color: '#1DA1F2' },
    { key: 'youtube', label: 'YouTube', icon: <YouTube />, color: '#FF0000' },
    { key: 'whatsapp', label: 'WhatsApp', icon: <WhatsApp />, color: '#25D366' },
    { key: 'linkedin', label: 'LinkedIn', icon: <LinkedIn />, color: '#0077B5' },
    { key: 'tiktok', label: 'TikTok', icon: <Share />, color: '#000000' },
    { key: 'pinterest', label: 'Pinterest', icon: <Pinterest />, color: '#BD081C' }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
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
            <Share sx={{ fontSize: '2rem' }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Configuración de Redes Sociales
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
            Configura los enlaces de tus redes sociales que aparecerán en el footer de la página.
          </Typography>

          <Grid container spacing={3}>
            {socialPlatforms.map((platform) => (
              <Grid item xs={12} sm={6} key={platform.key}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card sx={{ 
                    border: '2px solid #f0f0f0',
                    '&:hover': {
                      border: `2px solid ${platform.color}`,
                      boxShadow: `0 4px 20px ${platform.color}20`
                    },
                    transition: 'all 0.3s ease'
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box sx={{ 
                          color: platform.color,
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '1.5rem'
                        }}>
                          {platform.icon}
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {platform.label}
                        </Typography>
                      </Box>
                      
                      <TextField
                        fullWidth
                        label={`URL de ${platform.label}`}
                        value={socialLinks[platform.key]}
                        onChange={(e) => handleInputChange(platform.key, e.target.value)}
                        placeholder={`https://${platform.key}.com/tu-usuario`}
                        variant="outlined"
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': {
                              borderColor: platform.color
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: platform.color
                            }
                          }
                        }}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={onClose}
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
              disabled={loading}
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
              {loading ? 'Guardando...' : 'Guardar Enlaces'}
            </Button>
          </motion.div>
        </DialogActions>
      </motion.div>
    </Dialog>
  );
};

export default SocialMediaManager;
