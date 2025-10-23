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
  Card,
  CardMedia,
  CardContent,
  CardActions as MuiCardActions,
  IconButton,
  Rating,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PhotoCamera,
  Star,
  Save,
  Cancel
} from '@mui/icons-material';
import { db, storage } from '../firebase/config';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const ProductsManager = ({ open, onClose }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    weight: '',
    image: '',
    rating: 5,
    category: '',
    isNew: false,
    isBestSeller: false,
    featured: false,
    active: true
  });

  const categories = [
    'Clásicas NY',
    'Chocolate',
    'Vainilla',
    'Especiales',
    'Veganas',
    'Sin Gluten'
  ];

  useEffect(() => {
    if (open) {
      loadProducts();
    }
  }, [open]);

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
    } catch (err) {
      setError('Error al cargar productos: ' + err.message);
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      // Validar cantidad máxima (incluyendo las existentes)
      if (selectedImages.length + files.length > 2) {
        setError('Máximo 2 imágenes permitidas');
        return;
      }

      // Validar cada archivo
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          setError('Por favor selecciona solo archivos de imagen válidos');
          return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
          setError('Las imágenes deben ser menores a 5MB');
          return;
        }
      }

      // Agregar nuevas imágenes a las existentes
      const newSelectedImages = [...selectedImages, ...files];
      setSelectedImages(newSelectedImages);
      
      // Crear previews para las nuevas imágenes
      const newPreviews = [];
      files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews[index] = e.target.result;
          if (newPreviews.length === files.length) {
            setImagePreviews([...imagePreviews, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const uploadImagesToStorage = async (files, productId) => {
    try {
      setUploadingImage(true);
      const uploadPromises = files.map(async (file, index) => {
        // Crear referencia única para cada imagen
        const imageRef = ref(storage, `products/${productId}/${Date.now()}_${index}_${file.name}`);
        
        // Subir archivo
        const snapshot = await uploadBytes(imageRef, file);
        
        // Obtener URL de descarga
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        return downloadURL;
      });
      
      const urls = await Promise.all(uploadPromises);
      return urls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error('Error al subir las imágenes: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const deleteImageFromStorage = async (imageUrl) => {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      weight: '',
      image: '',
      rating: 5,
      category: '',
      isNew: false,
      isBestSeller: false,
      featured: false
    });
    setEditingProduct(null);
    setShowForm(false);
    setSelectedImages([]);
    setImagePreviews([]);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.category) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      let imageUrls = [];

      // Si hay imágenes seleccionadas, subirlas a Storage
      if (selectedImages.length > 0) {
        if (editingProduct) {
          // Si estamos editando, eliminar las imágenes anteriores si existen
          if (editingProduct.images && Array.isArray(editingProduct.images)) {
            for (const imageUrl of editingProduct.images) {
              if (imageUrl.startsWith('gs://')) {
                await deleteImageFromStorage(imageUrl);
              }
            }
          }
        }
        
        // Subir nuevas imágenes
        imageUrls = await uploadImagesToStorage(selectedImages, editingProduct?.id || 'temp');
      } else if (editingProduct && editingProduct.images) {
        // Si estamos editando y no hay nuevas imágenes, mantener las existentes
        imageUrls = editingProduct.images;
      } else if (formData.image) {
        // Si hay una imagen URL manual
        imageUrls = [formData.image];
      }

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        rating: parseFloat(formData.rating),
        images: imageUrls,
        image: imageUrls[0] || '', // Mantener compatibilidad con el campo image
        updatedAt: new Date().toISOString()
      };

      // Solo agregar createdAt si es un producto nuevo
      if (!editingProduct) {
        productData.createdAt = new Date().toISOString();
      }

      if (editingProduct) {
        // Actualizar producto existente
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        setSuccess('Producto actualizado exitosamente');
      } else {
        // Crear nuevo producto
        const docRef = await addDoc(collection(db, 'products'), productData);
        
        // Si hay imágenes seleccionadas, subirlas y actualizar el producto
        if (selectedImages.length > 0) {
          const newImageUrls = await uploadImagesToStorage(selectedImages, docRef.id);
          await updateDoc(doc(db, 'products', docRef.id), { 
            images: newImageUrls,
            image: newImageUrls[0] || ''
          });
        }
        
        setSuccess('Producto creado exitosamente');
      }

      await loadProducts();
      resetForm();
      
      setTimeout(() => {
        setSuccess('');
      }, 2000);
      
    } catch (err) {
      setError('Error al guardar: ' + err.message);
      console.error('Error saving product:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      weight: product.weight || '',
      image: product.image || '',
      rating: product.rating || 5,
      category: product.category || '',
      isNew: product.isNew || false,
      isBestSeller: product.isBestSeller || false,
      featured: product.featured || false,
      active: product.active !== false
    });
    
    // Mostrar imágenes existentes si las hay
    if (product.images && Array.isArray(product.images)) {
      setImagePreviews(product.images);
    } else if (product.image) {
      setImagePreviews([product.image]);
    } else {
      setImagePreviews([]);
    }
    
    setSelectedImages([]);
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    try {
      // Encontrar el producto para obtener las URLs de las imágenes
      const product = products.find(p => p.id === productId);
      
      // Eliminar las imágenes del Storage si existen
      if (product) {
        if (product.images && Array.isArray(product.images)) {
          for (const imageUrl of product.images) {
            if (imageUrl.startsWith('gs://')) {
              await deleteImageFromStorage(imageUrl);
            }
          }
        } else if (product.image && product.image.startsWith('gs://')) {
          await deleteImageFromStorage(product.image);
        }
      }
      
      // Eliminar el producto de Firestore
      await deleteDoc(doc(db, 'products', productId));
      setSuccess('Producto eliminado exitosamente');
      await loadProducts();
      
      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError('Error al eliminar: ' + err.message);
    }
  };

  const handleClose = () => {
    resetForm();
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      className="products-manager-mobile"
      PaperProps={{
        sx: {
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          maxHeight: '90vh',
          height: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 2 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: '#8B4513',
            fontFamily: 'Playfair Display, serif'
          }}
        >
          Gestión de Productos
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }}>
            {success}
          </Alert>
        )}

        {/* Botón para agregar nuevo producto */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowForm(true)}
            sx={{
              backgroundColor: '#8B4513',
              borderRadius: '25px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              '&:hover': {
                backgroundColor: '#A0522D'
              }
            }}
          >
            Nuevo Producto
          </Button>
        </Box>

        {/* Formulario */}
        {showForm && (
          <Card sx={{ mb: 3, borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, color: '#8B4513', fontWeight: 600 }}>
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Nombre del Producto"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Categoría</InputLabel>
                        <Select
                          value={formData.category}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          required
                        >
                          {categories.map(category => (
                            <MenuItem key={category} value={category}>
                              {category}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Precio"
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        required
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Peso (gramos)"
                        type="number"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', e.target.value)}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', mt: -8 }}>
                    <Typography variant="body2" sx={{ mb: 1, color: '#666', fontWeight: 500 }}>
                      Vista previa:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {imagePreviews.map((preview, index) => (
                        <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Box
                            component="img"
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            sx={{
                              maxWidth: '150px',
                              maxHeight: '150px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '2px solid #8B4513'
                            }}
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              // Crear un input temporal para reemplazar esta imagen específica
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  // Validar archivo
                                  if (!file.type.startsWith('image/')) {
                                    setError('Por favor selecciona un archivo de imagen válido');
                                    return;
                                  }
                                  if (file.size > 5 * 1024 * 1024) {
                                    setError('La imagen debe ser menor a 5MB');
                                    return;
                                  }
                                  
                                  // Reemplazar la imagen en el índice específico
                                  const newPreviews = [...imagePreviews];
                                  const newSelectedImages = [...selectedImages];
                                  
                                  const reader = new FileReader();
                                  reader.onload = (e) => {
                                    newPreviews[index] = e.target.result;
                                    setImagePreviews(newPreviews);
                                  };
                                  reader.readAsDataURL(file);
                                  
                                  newSelectedImages[index] = file;
                                  setSelectedImages(newSelectedImages);
                                }
                              };
                              input.click();
                            }}
                            sx={{
                              mt: 1,
                              borderColor: '#8B4513',
                              color: '#8B4513',
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              '&:hover': {
                                borderColor: '#A0522D',
                                backgroundColor: '#8B451320'
                              }
                            }}
                          >
                            Reemplazar
                          </Button>
                        </Box>
                      ))}
                      
                      {imagePreviews.length < 2 && (
                        <Box
                          sx={{
                            maxWidth: '150px',
                            maxHeight: '150px',
                            width: '150px',
                            height: '150px',
                            border: '2px dashed #8B4513',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            backgroundColor: '#f9f9f9',
                            '&:hover': {
                              backgroundColor: '#f0f0f0'
                            }
                          }}
                          onClick={() => document.getElementById('image-upload').click()}
                        >
                          <Typography
                            sx={{
                              fontSize: '2rem',
                              color: '#8B4513',
                              fontWeight: 'bold'
                            }}
                          >
                            +
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ mb: 2, mt: -3 }}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="image-upload"
                      type="file"
                      multiple
                      onChange={handleImageSelect}
                    />
                    <label htmlFor="image-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<PhotoCamera />}
                        sx={{
                          borderColor: '#8B4513',
                          color: '#8B4513',
                          textTransform: 'none',
                          '&:hover': {
                            borderColor: '#A0522D',
                            backgroundColor: '#8B451320'
                          }
                        }}
                      >
                        Seleccionar Imágenes (máx. 2)
                      </Button>
                    </label>
                    
                    {uploadingImage && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <CircularProgress size={20} sx={{ color: '#8B4513', mr: 1 }} />
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Subiendo imagen...
                        </Typography>
                      </Box>
                    )}
                    
                    {imagePreviews.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Button
                          size="small"
                          onClick={() => {
                            setImagePreviews([]);
                            setSelectedImages([]);
                            if (editingProduct && editingProduct.images) {
                              setImagePreviews(editingProduct.images);
                            } else if (editingProduct && editingProduct.image) {
                              setImagePreviews([editingProduct.image]);
                            }
                          }}
                          sx={{ color: '#f44336', textTransform: 'none' }}
                        >
                          Eliminar imágenes seleccionadas
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descripción"
                    multiline
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                      Calificación (Estrellas)
                    </Typography>
                    <Rating
                      value={formData.rating}
                      onChange={(event, newValue) => handleInputChange('rating', newValue)}
                      precision={0.5}
                      size="large"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isNew}
                          onChange={(e) => handleInputChange('isNew', e.target.checked)}
                        />
                      }
                      label="Producto Nuevo"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isBestSeller}
                          onChange={(e) => handleInputChange('isBestSeller', e.target.checked)}
                        />
                      }
                      label="Más Vendido"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.featured}
                          onChange={(e) => handleInputChange('featured', e.target.checked)}
                        />
                      }
                      label="Destacado"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.active}
                          onChange={(e) => handleInputChange('active', e.target.checked)}
                        />
                      }
                      label="Activo"
                    />
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
                <Button
                  onClick={resetForm}
                  variant="outlined"
                  startIcon={<Cancel />}
                  sx={{
                    borderColor: '#8B4513',
                    color: '#8B4513',
                    borderRadius: '25px',
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  Cancelar
                </Button>
                
                <Button
                  onClick={handleSave}
                  variant="contained"
                  startIcon={<Save />}
                  disabled={saving}
                  sx={{
                    backgroundColor: '#8B4513',
                    borderRadius: '25px',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: '#A0522D'
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
              </Box>
            </CardContent>
          </Card>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Lista de productos en tabla */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#8B4513' }} />
          </Box>
        ) : (
          <Box sx={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Imagen</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Nombre</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Categoría</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Precio</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Rating</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Estado</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          style={{ 
                            width: '60px', 
                            height: '60px', 
                            objectFit: 'cover', 
                            borderRadius: '8px' 
                          }}
                        />
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {product.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                        {product.description?.substring(0, 50)}...
                      </Typography>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Chip label={product.category} size="small" color="primary" />
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#8B4513' }}>
                        ${product.price}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating value={product.rating} readOnly size="small" />
                        <Typography variant="caption" sx={{ ml: 1, color: '#666' }}>
                          ({product.rating})
                        </Typography>
                      </Box>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        <Chip 
                          label={product.active ? 'Activo' : 'Inactivo'} 
                          size="small" 
                          color={product.active ? 'success' : 'error'} 
                        />
                        {product.isNew && <Chip label="Nuevo" size="small" color="info" />}
                        {product.isBestSeller && <Chip label="Más Vendido" size="small" color="warning" />}
                        {product.featured && <Chip label="Destacado" size="small" color="secondary" />}
                      </Box>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(product)}
                          sx={{ color: '#8B4513' }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(product.id)}
                          sx={{ color: '#f44336' }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{
            borderColor: '#8B4513',
            color: '#8B4513',
            borderRadius: '25px',
            textTransform: 'none',
            fontWeight: 600,
            px: 3
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductsManager;
