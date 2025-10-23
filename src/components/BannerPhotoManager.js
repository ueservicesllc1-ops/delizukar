import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  TextField,
  Chip,
  LinearProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  PhotoCamera,
  Upload,
  Close,
  Delete,
  Edit,
  Visibility,
  CloudUpload,
  Image
} from '@mui/icons-material';
import { storage, db } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const BannerPhotoManager = ({ open, onClose }) => {
  const [bannerPhotos, setBannerPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [photoData, setPhotoData] = useState({
    title: '',
    description: '',
    color: '#8B4513',
    order: 1
  });
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Cargar fotos del banner al abrir
  useEffect(() => {
    if (open) {
      loadBannerPhotos();
    }
  }, [open]);

  const loadBannerPhotos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'bannerPhotos'));
      const photos = [];
      querySnapshot.forEach((doc) => {
        photos.push({ id: doc.id, ...doc.data() });
      });
      setBannerPhotos(photos.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Error cargando fotos del banner:', error);
      showSnackbar('Error cargando fotos del banner', 'error');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        showSnackbar('Por favor selecciona un archivo de imagen', 'error');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showSnackbar('El archivo es demasiado grande. Máximo 5MB', 'error');
        return;
      }

      setSelectedFile(file);
      setPhotoData({
        title: '',
        description: '',
        color: '#8B4513',
        order: bannerPhotos.length + 1
      });
    }
  };

  const uploadPhoto = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Crear referencia en Storage
      const storageRef = ref(storage, `banner-photos/${Date.now()}-${selectedFile.name}`);
      
      // Subir archivo
      const uploadTask = uploadBytes(storageRef, selectedFile);
      
      // Simular progreso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await uploadTask;
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(storageRef);

      // Guardar datos en Firestore
      const photoDoc = {
        title: photoData.title || `Banner ${bannerPhotos.length + 1}`,
        description: photoData.description,
        color: photoData.color,
        order: photoData.order,
        imageUrl: downloadURL,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        uploadedAt: new Date(),
        isActive: true
      };

      await addDoc(collection(db, 'bannerPhotos'), photoDoc);
      
      showSnackbar('Foto subida exitosamente', 'success');
      setSelectedFile(null);
      setPhotoData({ title: '', description: '', color: '#8B4513', order: 1 });
      loadBannerPhotos();
      
    } catch (error) {
      console.error('Error subiendo foto:', error);
      showSnackbar('Error subiendo foto', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const deletePhoto = async (photo) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta foto?')) return;

    try {
      // Eliminar de Storage
      const imageRef = ref(storage, photo.imageUrl);
      await deleteObject(imageRef);
      
      // Eliminar de Firestore
      await deleteDoc(doc(db, 'bannerPhotos', photo.id));
      
      showSnackbar('Foto eliminada exitosamente', 'success');
      loadBannerPhotos();
    } catch (error) {
      console.error('Error eliminando foto:', error);
      showSnackbar('Error eliminando foto', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        className="banner-photo-manager-mobile"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhotoCamera sx={{ color: '#8B4513' }} />
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#eb8b8b' }}>
                Gestión de Fotos del Banner
              </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: '#666' }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {/* Subir nueva foto */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#eb8b8b' }}>
              Subir Nueva Foto
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<Upload />}
                sx={{
                  borderColor: '#8B4513',
                  color: '#8B4513',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: '#8B451320',
                    borderColor: '#8B4513'
                  }
                }}
              >
                Seleccionar Imagen
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </Button>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Formatos: JPG, PNG, WEBP (máximo 5MB)
              </Typography>
            </Box>

            {selectedFile && (
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="Preview"
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                          borderRadius: '10px',
                          border: '2px dashed #ddd'
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Título"
                      value={photoData.title}
                      onChange={(e) => setPhotoData({ ...photoData, title: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Descripción"
                      multiline
                      rows={2}
                      value={photoData.description}
                      onChange={(e) => setPhotoData({ ...photoData, description: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <TextField
                        label="Color de overlay"
                        type="color"
                        value={photoData.color}
                        onChange={(e) => setPhotoData({ ...photoData, color: e.target.value })}
                        sx={{ width: '120px' }}
                      />
                      <TextField
                        label="Orden"
                        type="number"
                        value={photoData.order}
                        onChange={(e) => setPhotoData({ ...photoData, order: parseInt(e.target.value) })}
                        sx={{ width: '100px' }}
                      />
                    </Box>
                    <Button
                      variant="contained"
                      onClick={uploadPhoto}
                      disabled={uploading}
                      startIcon={<CloudUpload />}
                      sx={{
                        backgroundColor: '#8B4513',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                          backgroundColor: '#A0522D'
                        }
                      }}
                    >
                      {uploading ? 'Subiendo...' : 'Subir Foto'}
                    </Button>
                    {uploading && (
                      <Box sx={{ mt: 2 }}>
                        <LinearProgress variant="determinate" value={uploadProgress} />
                        <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                          {uploadProgress}%
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>

          <Box sx={{ borderTop: '1px solid #eee', pt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#eb8b8b' }}>
              Fotos del Banner ({bannerPhotos.length})
            </Typography>
            
            {bannerPhotos.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Image sx={{ fontSize: '4rem', color: '#ddd', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                  No hay fotos del banner
                </Typography>
                <Typography variant="body2" sx={{ color: '#999' }}>
                  Sube tu primera foto para el carrusel
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {bannerPhotos.map((photo, index) => (
                  <Grid item xs={12} sm={6} md={4} key={photo.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Card
                        sx={{
                          borderRadius: '15px',
                          overflow: 'hidden',
                          '&:hover': {
                            boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                          }
                        }}
                      >
                        <CardMedia
                          component="img"
                          height="200"
                          image={photo.imageUrl}
                          alt={photo.title}
                          sx={{ objectFit: 'cover' }}
                        />
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                            {photo.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                            {photo.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Chip
                              label={`Orden: ${photo.order}`}
                              size="small"
                              sx={{ backgroundColor: '#8B451320', color: '#8B4513' }}
                            />
                            <Chip
                              label={photo.isActive ? 'Activa' : 'Inactiva'}
                              size="small"
                              sx={{ 
                                backgroundColor: photo.isActive ? '#4CAF5020' : '#f4433620',
                                color: photo.isActive ? '#4CAF50' : '#f44336'
                              }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => window.open(photo.imageUrl, '_blank')}
                              sx={{ color: '#8B4513' }}
                            >
                              <Visibility />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => deletePhoto(photo)}
                              sx={{ color: '#f44336' }}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={onClose}
            sx={{
              color: '#666',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default BannerPhotoManager;
