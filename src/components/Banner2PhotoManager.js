import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  IconButton,
  Divider,
  TextField,
  LinearProgress,
  Chip,
  Avatar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Close, PhotoCamera, Upload, Delete, Edit, Visibility, AddPhotoAlternate, Sort } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { db, storage } from '../firebase/config';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';

const Banner2PhotoManager = ({ open, onClose }) => {
  const [photos, setPhotos] = useState([]);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newPhotoData, setNewPhotoData] = useState({
    title: '',
    description: '',
    color: '#c8626d',
    order: 0,
    isActive: true,
  });
  const [editingPhoto, setEditingPhoto] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const banner2PhotosCollectionRef = collection(db, 'banner2Photos');

  // Cargar fotos existentes desde Firestore
  const loadBanner2Photos = async () => {
    try {
      const querySnapshot = await getDocs(banner2PhotosCollectionRef);
      const loadedPhotos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPhotos(loadedPhotos.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Error cargando fotos del banner 2:', error);
    }
  };

  useEffect(() => {
    if (open) {
      loadBanner2Photos();
    }
  }, [open]);

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(selectedFile.type)) {
        alert('Tipo de archivo no soportado. Por favor, sube JPG, PNG o WEBP.');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 5MB.');
        return;
      }
      setFile(selectedFile);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPhotoData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Por favor, selecciona una imagen para subir.');
      return;
    }

    setIsUploading(true);
    const uniqueId = uuidv4();
    const storageRef = ref(storage, `banner2-photos/${uniqueId}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error('Error al subir la imagen:', error);
        alert('Error al subir la imagen.');
        setIsUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const photoToSave = {
          ...newPhotoData,
          imageUrl: downloadURL,
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
        };

        await addDoc(banner2PhotosCollectionRef, photoToSave);
        alert('Imagen subida y datos guardados en Firestore.');
        setFile(null);
        setNewPhotoData({ title: '', description: '', color: '#c8626d', order: 0, isActive: true });
        setIsUploading(false);
        setUploadProgress(0);
        loadBanner2Photos();
      }
    );
  };

  const handleDeletePhoto = async (photoId, imageUrl) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta foto?')) {
      try {
        await deleteDoc(doc(db, 'banner2Photos', photoId));
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
        alert('Foto eliminada correctamente.');
        loadBanner2Photos();
      } catch (error) {
        console.error('Error al eliminar la foto:', error);
        alert('Error al eliminar la foto.');
      }
    }
  };

  const handleEditPhoto = (photo) => {
    setEditingPhoto(photo);
    setNewPhotoData({
      title: photo.title,
      description: photo.description,
      color: photo.color,
      order: photo.order,
      isActive: photo.isActive,
    });
    setFile(null);
  };

  const handleUpdatePhoto = async () => {
    if (!editingPhoto) return;

    try {
      const photoRef = doc(db, 'banner2Photos', editingPhoto.id);
      await updateDoc(photoRef, newPhotoData);
      alert('Datos de la foto actualizados correctamente.');
      setEditingPhoto(null);
      setNewPhotoData({ title: '', description: '', color: '#c8626d', order: 0, isActive: true });
      loadBanner2Photos();
    } catch (error) {
      console.error('Error al actualizar la foto:', error);
      alert('Error al actualizar la foto.');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
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
          <PhotoCamera sx={{ color: '#c8626d' }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#c8626d' }}>
            Gestión de Fotos del Banner 2
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#666' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 4 }}>
        {/* Sección para subir nueva foto */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#333' }}>
            {editingPhoto ? 'Editar Datos de la Foto' : 'Subir Nueva Foto al Banner 2'}
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={editingPhoto ? 12 : 6}>
              {!editingPhoto && (
                <Box
                  {...getRootProps()}
                  sx={{
                    border: '2px dashed #ddd',
                    borderRadius: '15px',
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isDragActive ? '#f0f0f0' : '#fff',
                    transition: 'all 0.3s ease',
                    minHeight: '150px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': { borderColor: '#c8626d' }
                  }}
                >
                  <input {...getInputProps()} />
                  <AddPhotoAlternate sx={{ fontSize: '3rem', color: '#c8626d', mb: 1 }} />
                  <Typography variant="body1" sx={{ color: '#333', fontWeight: 600 }}>
                    Arrastra y suelta una imagen aquí, o haz click para seleccionar
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    JPG, PNG, WEBP (Máx. 5MB)
                  </Typography>
                </Box>
              )}
              {file && !editingPhoto && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>Archivo seleccionado: <strong>{file.name}</strong></Typography>
                  <img src={URL.createObjectURL(file)} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '10px', objectFit: 'cover' }} />
                </Box>
              )}
              {editingPhoto && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>Foto actual:</Typography>
                  <img src={editingPhoto.imageUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '10px', objectFit: 'cover' }} />
                </Box>
              )}
            </Grid>
            {!editingPhoto && (
              <Grid item xs={12} md={6}>
                <TextField
                  label="Título del Banner"
                  name="title"
                  fullWidth
                  margin="normal"
                  value={newPhotoData.title}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Descripción"
                  name="description"
                  fullWidth
                  multiline
                  rows={3}
                  margin="normal"
                  value={newPhotoData.description}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Color de Overlay (Hex)"
                  name="color"
                  fullWidth
                  margin="normal"
                  value={newPhotoData.color}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Orden (número)"
                  name="order"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={newPhotoData.order}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  startIcon={<Upload />}
                  onClick={handleUpload}
                  disabled={isUploading || !file}
                  sx={{
                    backgroundColor: '#c8626d',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    borderRadius: '25px',
                    '&:hover': { backgroundColor: '#b5555a' },
                    mt: 2
                  }}
                >
                  {isUploading ? `Subiendo... ${uploadProgress.toFixed(0)}%` : 'Subir Foto'}
                </Button>
                {isUploading && (
                  <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 2 }} />
                )}
              </Grid>
            )}
            {editingPhoto && (
              <Grid item xs={12}>
                <TextField
                  label="Título del Banner"
                  name="title"
                  fullWidth
                  margin="normal"
                  value={newPhotoData.title}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Descripción"
                  name="description"
                  fullWidth
                  multiline
                  rows={3}
                  margin="normal"
                  value={newPhotoData.description}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Color de Overlay (Hex)"
                  name="color"
                  fullWidth
                  margin="normal"
                  value={newPhotoData.color}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Orden (número)"
                  name="order"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={newPhotoData.order}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  onClick={handleUpdatePhoto}
                  sx={{
                    backgroundColor: '#c8626d',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    borderRadius: '25px',
                    '&:hover': { backgroundColor: '#b5555a' },
                    mt: 2
                  }}
                >
                  Guardar Cambios
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setEditingPhoto(null)}
                  sx={{
                    borderColor: '#c8626d',
                    color: '#c8626d',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    borderRadius: '25px',
                    '&:hover': { backgroundColor: '#c8626d20' },
                    mt: 2,
                    ml: 2
                  }}
                >
                  Cancelar Edición
                </Button>
              </Grid>
            )}
          </Grid>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Lista de fotos existentes */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2, color: '#333' }}>
            Fotos del Banner 2 Existentes ({photos.length})
          </Typography>
          {photos.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" sx={{ color: '#666' }}>No hay fotos en el banner 2. ¡Sube la primera!</Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {photos.map((photo) => (
                <Grid item xs={12} sm={6} md={4} key={photo.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card
                      sx={{
                        borderRadius: '15px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                    >
                      <Box
                        sx={{
                          height: 150,
                          backgroundImage: `url(${photo.imageUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'flex-start',
                          p: 2
                        }}
                      >
                        <Chip
                          label={`Orden: ${photo.order}`}
                          size="small"
                          sx={{
                            backgroundColor: '#c8626d',
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      </Box>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#333' }}>
                          {photo.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {photo.description}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                          <Chip
                            label={photo.isActive ? 'Activo' : 'Inactivo'}
                            size="small"
                            sx={{
                              backgroundColor: photo.isActive ? '#4CAF5020' : '#f4433620',
                              color: photo.isActive ? '#4CAF50' : '#f44336',
                              fontWeight: 600
                            }}
                          />
                          <Box>
                            <IconButton size="small" onClick={() => handleEditPhoto(photo)}>
                              <Edit sx={{ color: '#2196F3' }} />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDeletePhoto(photo.id, photo.imageUrl)}>
                              <Delete sx={{ color: '#f44336' }} />
                            </IconButton>
                          </Box>
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

      <DialogActions sx={{ p: 3, justifyContent: 'flex-end' }}>
        <Button onClick={onClose} sx={{ color: '#666', textTransform: 'none' }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Banner2PhotoManager;

