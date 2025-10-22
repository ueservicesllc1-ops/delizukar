import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  LinearProgress,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Delete,
  Add,
  PhotoCamera,
  Star,
  Person
} from '@mui/icons-material';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { fontUploader } from '../utils/fontUploader';
import { useTitleConfig } from '../context/TitleConfigContext';

const TestimonialsManager = ({ open, onClose }) => {
  const { titleConfig, updateTitleConfig } = useTitleConfig();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [testimonialDialog, setTestimonialDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState(null);
  const [titleConfigDialog, setTitleConfigDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [uploading, setUploading] = useState(false);
  
  // Formulario
  const [formData, setFormData] = useState({
    name: '',
    comment: '',
    rating: 5,
    photo: null,
    photoUrl: '',
    isActive: true,
    titleFont: 'Roboto',
    commentFont: 'Roboto'
  });

  // Configuración del título principal
  const [localTitleConfig, setLocalTitleConfig] = useState({
    text: 'Lo que dicen nuestros clientes',
    font: 'Roboto'
  });

  // Cargar fuentes disponibles desde fontUploader
  const [availableFonts, setAvailableFonts] = useState([]);
  const [uploadedFonts, setUploadedFonts] = useState([]);

  // Cargar fuentes al abrir el modal
  useEffect(() => {
    if (open) {
      loadFonts();
    }
  }, [open]);

  // Cargar fuentes cuando se abre el diálogo de configuración del título
  useEffect(() => {
    if (titleConfigDialog) {
      loadFonts();
      // Sincronizar con el contexto
      setLocalTitleConfig(titleConfig);
    }
  }, [titleConfigDialog, titleConfig]);

  // Forzar actualización de la vista previa cuando cambie la fuente
  useEffect(() => {
    if (titleConfigDialog) {
      const previewElement = document.getElementById('title-preview');
      if (previewElement) {
        previewElement.style.fontFamily = `"${localTitleConfig.font}", sans-serif`;
        previewElement.style.fontWeight = '700';
        previewElement.style.fontSize = '1.5rem';
      }
    }
  }, [localTitleConfig.font, titleConfigDialog]);

  const loadFonts = async () => {
    try {
      // Cargar fuentes predefinidas
      await fontUploader.loadFonts(['playfair-display', 'roboto', 'montserrat', 'poppins', 'lato', 'open-sans']);
      setAvailableFonts(fontUploader.availableFonts);
      
      // Cargar fuentes subidas desde Firestore
      const fontsCollection = collection(db, 'fonts');
      const snapshot = await getDocs(fontsCollection);
      const uploadedFontsData = [];
      const seenNames = new Set(); // Para evitar duplicados
      
      snapshot.forEach((doc) => {
        const fontData = { id: doc.id, ...doc.data() };
        // Solo agregar si no hemos visto este nombre antes
        if (!seenNames.has(fontData.name)) {
          uploadedFontsData.push(fontData);
          seenNames.add(fontData.name);
        }
      });
      
      setUploadedFonts(uploadedFontsData);
      
      // Aplicar fuentes subidas al documento
      uploadedFontsData.forEach(font => {
        if (font.dataUrl) {
          const style = document.createElement('style');
          style.setAttribute('data-font', font.name);
          style.textContent = `
            @font-face {
              font-family: '${font.name}';
              src: url(${font.dataUrl});
              font-display: swap;
            }
          `;
          document.head.appendChild(style);
        }
      });
    } catch (error) {
      console.error('Error loading fonts:', error);
    }
  };

  // Cargar testimonios desde Firebase
  useEffect(() => {
    if (open) {
      loadTestimonials();
    }
  }, [open]);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      // Cargar todos los testimonios
      const testimonialsSnapshot = await getDocs(collection(db, 'testimonials'));
      
      console.log('📊 Total testimonios encontrados en Firestore:', testimonialsSnapshot.docs.length);
      
      const testimonialsData = testimonialsSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📝 Testimonio encontrado:', {
          id: doc.id,
          name: data.name,
          isActive: data.isActive,
          createdAt: data.createdAt,
          comment: data.comment ? data.comment.substring(0, 50) + '...' : 'Sin comentario'
        });
        return {
          id: doc.id,
          ...data
        };
      });
      
      console.log('✅ Testimonios cargados exitosamente:', testimonialsData);
      setTestimonials(testimonialsData);
    } catch (error) {
      console.error('❌ Error loading testimonials:', error);
      showSnackbar('Error cargando testimonios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    
    try {
      setUploading(true);
      const storageRef = ref(storage, `testimonials/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setFormData(prev => ({ 
        ...prev, 
        photo: file, 
        photoUrl: downloadURL 
      }));
      
      showSnackbar('Foto subida exitosamente', 'success');
    } catch (error) {
      console.error('Error uploading photo:', error);
      showSnackbar('Error subiendo foto', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveTestimonial = async () => {
    if (!formData.name || !formData.comment) {
      showSnackbar('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    try {
      const testimonialData = {
        name: formData.name,
        comment: formData.comment,
        rating: formData.rating,
        photoUrl: formData.photoUrl,
        isActive: formData.isActive,
        titleFont: formData.titleFont,
        commentFont: formData.commentFont,
        createdAt: editingTestimonial ? editingTestimonial.createdAt : new Date(),
        updatedAt: new Date()
      };

      console.log('Guardando testimonio:', testimonialData);

      if (editingTestimonial) {
        // Actualizar testimonio existente
        const testimonialRef = doc(db, 'testimonials', editingTestimonial.id);
        await updateDoc(testimonialRef, testimonialData);
        console.log('Testimonio actualizado exitosamente');
        showSnackbar('Testimonio actualizado exitosamente', 'success');
      } else {
        // Crear nuevo testimonio
        const docRef = await addDoc(collection(db, 'testimonials'), testimonialData);
        console.log('Testimonio creado con ID:', docRef.id);
        showSnackbar('Testimonio creado exitosamente', 'success');
      }

      setTestimonialDialog(false);
      resetForm();
      
      // Recargar testimonios después de un pequeño delay
      setTimeout(() => {
        loadTestimonials();
      }, 500);
    } catch (error) {
      console.error('Error saving testimonial:', error);
      showSnackbar('Error guardando testimonio', 'error');
    }
  };

  const handleDeleteTestimonial = async () => {
    if (!testimonialToDelete) return;

    try {
      await deleteDoc(doc(db, 'testimonials', testimonialToDelete.id));
      showSnackbar('Testimonio eliminado exitosamente', 'success');
      setDeleteDialog(false);
      setTestimonialToDelete(null);
      loadTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      showSnackbar('Error eliminando testimonio', 'error');
    }
  };

  const openEditDialog = (testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      name: testimonial.name,
      comment: testimonial.comment,
      rating: testimonial.rating,
      photo: null,
      photoUrl: testimonial.photoUrl || '',
      isActive: testimonial.isActive !== false,
      titleFont: testimonial.titleFont || 'Roboto',
      commentFont: testimonial.commentFont || 'Roboto'
    });
    setTestimonialDialog(true);
  };

  const openNewDialog = () => {
    setEditingTestimonial(null);
    resetForm();
    setTestimonialDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      comment: '',
      rating: 5,
      photo: null,
      photoUrl: '',
      isActive: true,
      titleFont: 'Roboto',
      commentFont: 'Roboto'
    });
  };

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        sx={{
          color: i < rating ? '#FFD700' : '#ddd',
          fontSize: '1rem'
        }}
      />
    ));
  };

  if (loading) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: '20px',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <LinearProgress sx={{ width: 300 }} />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '20px',
          height: '80vh',
          minHeight: '600px'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Person />
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700, 
                color: '#8B4513',
                fontFamily: `"${titleConfig.font}", sans-serif`
              }}
            >
              {titleConfig.text}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openNewDialog}
              sx={{
                backgroundColor: '#8B4513',
                '&:hover': { backgroundColor: '#A0522D' }
              }}
            >
              Nuevo Testimonio
            </Button>
            <Button
              variant="outlined"
              onClick={async () => {
                // Cargar fuentes antes de abrir el diálogo
                await loadFonts();
                setTitleConfigDialog(true);
              }}
              sx={{
                borderColor: '#8B4513',
                color: '#8B4513',
                '&:hover': { backgroundColor: '#8B451320' }
              }}
            >
              Configurar Título
            </Button>
            <Button
              variant="outlined"
              onClick={loadTestimonials}
              sx={{
                borderColor: '#8B4513',
                color: '#8B4513',
                '&:hover': { backgroundColor: '#8B451320' }
              }}
            >
              Refrescar
            </Button>
            <Button
              variant="outlined"
              onClick={async () => {
                if (window.confirm('⚠️ ELIMINAR TODOS LOS TESTIMONIOS - Esto borrará TODO de la base de datos')) {
                  try {
                    setLoading(true);
                    
                    // Buscar en múltiples colecciones posibles
                    const collections = ['testimonials', 'testimonial', 'reviews', 'comments', 'clientes'];
                    let totalEliminados = 0;
                    
                    for (const collectionName of collections) {
                      try {
                        const snapshot = await getDocs(collection(db, collectionName));
                        console.log(`🔍 Colección "${collectionName}": ${snapshot.docs.length} documentos`);
                        
                        for (const doc of snapshot.docs) {
                          const data = doc.data();
                          console.log(`📄 ${collectionName}/${doc.id}: ${data.name || 'Sin nombre'} - "${data.comment?.substring(0, 30) || 'Sin comentario'}..."`);
                          
                          await deleteDoc(doc.ref);
                          totalEliminados++;
                          console.log(`🗑️ Eliminado de ${collectionName}: ${data.name || doc.id}`);
                        }
                      } catch (error) {
                        console.log(`⚠️ Colección "${collectionName}" no existe o error:`, error.message);
                      }
                    }
                    
                    showSnackbar(`✅ ${totalEliminados} testimonios eliminados de todas las colecciones`, 'success');
                    setTestimonials([]); // Limpiar tabla
                    setLoading(false);
                  } catch (error) {
                    console.error('Error eliminando testimonios:', error);
                    showSnackbar('Error eliminando testimonios', 'error');
                    setLoading(false);
                  }
                }
              }}
              sx={{
                borderColor: '#f44336',
                color: '#f44336',
                fontWeight: 600,
                '&:hover': { 
                  backgroundColor: '#f4433620',
                  borderColor: '#d32f2f'
                }
              }}
            >
              🗑️ ELIMINAR TODO
            </Button>
            <Button
              onClick={onClose}
              sx={{ color: '#8B4513' }}
            >
              ✕
            </Button>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box>
          {/* Tabla de testimonios */}
          <TableContainer component={Paper} sx={{ borderRadius: 2, mt: 2, minHeight: '400px' }}>
            {testimonials.length === 0 ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                py: 8,
                textAlign: 'center'
              }}>
                <Person sx={{ fontSize: '4rem', color: '#ddd', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                  No hay testimonios aún
                </Typography>
                <Typography variant="body2" sx={{ color: '#999', mb: 3 }}>
                  Crea el primer testimonio para comenzar
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={openNewDialog}
                  sx={{
                    backgroundColor: '#8B4513',
                    '&:hover': { backgroundColor: '#A0522D' }
                  }}
                >
                  Crear Primer Testimonio
                </Button>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Cliente</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Comentario</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Calificación</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Fuentes</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                {testimonials.map((testimonial, index) => (
                  <motion.tr
                    key={testimonial.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={testimonial.photoUrl}
                          sx={{ width: 40, height: 40 }}
                        >
                          {testimonial.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {testimonial.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666' }}>
                            {new Date(testimonial.createdAt?.seconds * 1000).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {testimonial.comment}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {getRatingStars(testimonial.rating)}
                        <Typography variant="body2" sx={{ ml: 1, color: '#666' }}>
                          ({testimonial.rating}/5)
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={testimonial.isActive ? 'Activo' : 'Inactivo'}
                        size="small"
                        sx={{
                          backgroundColor: testimonial.isActive ? '#4caf5020' : '#f4433620',
                          color: testimonial.isActive ? '#4caf50' : '#f44336',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          Título: {testimonial.titleFont}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          Comentario: {testimonial.commentFont}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          onClick={() => openEditDialog(testimonial)}
                          sx={{
                            color: '#8B4513',
                            '&:hover': { backgroundColor: '#8B451320' }
                          }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            setTestimonialToDelete(testimonial);
                            setDeleteDialog(true);
                          }}
                          sx={{
                            color: '#f44336',
                            '&:hover': { backgroundColor: '#f4433620' }
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </motion.tr>
                ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>

          {/* Dialog para crear/editar testimonio */}
          <Dialog
            open={testimonialDialog}
            onClose={() => setTestimonialDialog(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              {editingTestimonial ? 'Editar Testimonio' : 'Nuevo Testimonio'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nombre del cliente"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Calificación</InputLabel>
                    <Select
                      value={formData.rating}
                      onChange={(e) => handleInputChange('rating', e.target.value)}
                    >
                      {[1, 2, 3, 4, 5].map(rating => (
                        <MenuItem key={rating} value={rating}>
                          {rating} estrella{rating > 1 ? 's' : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Comentario"
                    multiline
                    rows={4}
                    value={formData.comment}
                    onChange={(e) => handleInputChange('comment', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Fuente del título</InputLabel>
                    <Select
                      value={formData.titleFont}
                      onChange={(e) => handleInputChange('titleFont', e.target.value)}
                    >
                      {/* Fuentes predefinidas */}
                      {availableFonts.map(font => (
                        <MenuItem key={`predefined-${font.id}`} value={font.name} sx={{ fontFamily: `"${font.name}", sans-serif` }}>
                          {font.name}
                        </MenuItem>
                      ))}
                      {/* Separador si hay fuentes personalizadas */}
                      {uploadedFonts.length > 0 && (
                        <MenuItem disabled sx={{ borderTop: '1px solid #ddd', mt: 1 }}>
                          <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>
                            Fuentes Personalizadas
                          </Typography>
                        </MenuItem>
                      )}
                      {/* Fuentes subidas */}
                      {uploadedFonts.map(font => (
                        <MenuItem key={`uploaded-${font.id}`} value={font.name} sx={{ fontFamily: `"${font.name}", sans-serif` }}>
                          {font.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Fuente del comentario</InputLabel>
                    <Select
                      value={formData.commentFont}
                      onChange={(e) => handleInputChange('commentFont', e.target.value)}
                    >
                      {/* Fuentes predefinidas */}
                      {availableFonts.map(font => (
                        <MenuItem key={`predefined-${font.id}`} value={font.name} sx={{ fontFamily: `"${font.name}", sans-serif` }}>
                          {font.name}
                        </MenuItem>
                      ))}
                      {/* Separador si hay fuentes personalizadas */}
                      {uploadedFonts.length > 0 && (
                        <MenuItem disabled sx={{ borderTop: '1px solid #ddd', mt: 1 }}>
                          <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>
                            Fuentes Personalizadas
                          </Typography>
                        </MenuItem>
                      )}
                      {/* Fuentes subidas */}
                      {uploadedFonts.map(font => (
                        <MenuItem key={`uploaded-${font.id}`} value={font.name} sx={{ fontFamily: `"${font.name}", sans-serif` }}>
                          {font.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="photo-upload"
                      type="file"
                      onChange={(e) => handlePhotoUpload(e.target.files[0])}
                    />
                    <label htmlFor="photo-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<PhotoCamera />}
                        disabled={uploading}
                        sx={{ borderColor: '#8B4513', color: '#8B4513' }}
                      >
                        {uploading ? 'Subiendo...' : 'Subir Foto'}
                      </Button>
                    </label>
                    {formData.photoUrl && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={formData.photoUrl} sx={{ width: 40, height: 40 }} />
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Foto seleccionada
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      />
                    }
                    label="Testimonio activo"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setTestimonialDialog(false)}
                startIcon={<Cancel />}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveTestimonial}
                variant="contained"
                startIcon={<Save />}
                sx={{
                  backgroundColor: '#8B4513',
                  '&:hover': { backgroundColor: '#A0522D' }
                }}
              >
                {editingTestimonial ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dialog de confirmación de eliminación */}
          <Dialog
            open={deleteDialog}
            onClose={() => setDeleteDialog(false)}
          >
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogContent>
              <Typography>
                ¿Estás seguro de que quieres eliminar este testimonio? Esta acción no se puede deshacer.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleDeleteTestimonial}
                color="error"
                variant="contained"
              >
                Eliminar
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dialog para configurar título */}
          <Dialog
            open={titleConfigDialog}
            onClose={() => setTitleConfigDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Configurar Título Principal</DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Texto del título"
                    value={localTitleConfig.text}
                    onChange={(e) => setLocalTitleConfig(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Lo que dicen nuestros clientes"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Fuente del título</InputLabel>
                    <Select
                      value={localTitleConfig.font}
                      onChange={(e) => {
                        const newFont = e.target.value;
                        setLocalTitleConfig(prev => ({ ...prev, font: newFont }));
                        
                        // Aplicar la fuente inmediatamente
                        const previewElement = document.getElementById('title-preview');
                        if (previewElement) {
                          previewElement.style.fontFamily = `"${newFont}", sans-serif`;
                          previewElement.style.fontWeight = '700';
                          previewElement.style.fontSize = '1.5rem';
                        }
                      }}
                    >
                      {/* Fuentes predefinidas */}
                      {availableFonts.map(font => (
                        <MenuItem key={`predefined-${font.id}`} value={font.name} sx={{ fontFamily: `"${font.name}", sans-serif` }}>
                          {font.name}
                        </MenuItem>
                      ))}
                      {/* Fuentes subidas */}
                      {uploadedFonts.map(font => (
                        <MenuItem key={`uploaded-${font.id}`} value={font.name} sx={{ fontFamily: `"${font.name}", sans-serif` }}>
                          {font.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 2, textAlign: 'center' }}>
                    <div
                      id="title-preview"
                      style={{
                        fontFamily: `"${localTitleConfig.font}", sans-serif`,
                        color: '#8B4513',
                        fontWeight: 700,
                        fontSize: '1.5rem',
                        margin: 0,
                        padding: 0
                      }}
                    >
                      Vista previa: {localTitleConfig.text}
                    </div>
                    <Button
                      size="small"
                      onClick={() => {
                        console.log('Fuente actual:', titleConfig.font);
                        console.log('Fuentes disponibles:', availableFonts.length);
                        console.log('Fuentes subidas:', uploadedFonts.length);
                      }}
                      sx={{ mt: 1, fontSize: '0.7rem' }}
                    >
                      Debug Fuentes
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setTitleConfigDialog(false)}
                startIcon={<Cancel />}
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await updateTitleConfig(localTitleConfig);
                    setTitleConfigDialog(false);
                    showSnackbar('Título configurado exitosamente', 'success');
                  } catch (error) {
                    console.error('Error saving title config:', error);
                    showSnackbar('Error al guardar la configuración', 'error');
                  }
                }}
                variant="contained"
                startIcon={<Save />}
                sx={{
                  backgroundColor: '#8B4513',
                  '&:hover': { backgroundColor: '#A0522D' }
                }}
              >
                Guardar
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </DialogContent>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default TestimonialsManager;
