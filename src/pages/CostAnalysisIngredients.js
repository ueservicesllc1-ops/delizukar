import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  AttachMoney,
  Inventory,
  PhotoCamera,
  Close
} from '@mui/icons-material';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';

const CostAnalysisIngredients = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    price: 0,
    unit: 'kg',
    category: 'materia_prima',
    description: '',
    image: '',
    supplier: '',
    stock: 0,
    minStock: 0
  });

  useEffect(() => {
    loadIngredients();
  }, []);

  // Función para manejar la selección de archivo
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Función para subir imagen a Firebase Storage
  const uploadImage = async (file) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Crear referencia única para la imagen
      const timestamp = Date.now();
      const fileName = `ingredients/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      // Subir archivo
      const snapshot = await uploadBytes(storageRef, file);
      
      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setUploadProgress(100);
      return downloadURL;
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Función para limpiar la imagen seleccionada
  const clearImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (editingIngredient) {
      setEditingIngredient({...editingIngredient, image: ''});
    } else {
      setNewIngredient({...newIngredient, image: ''});
    }
  };

  const loadIngredients = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando ingredientes desde Firestore...');
      
      const ingredientsRef = collection(db, 'ingredients');
      const q = query(ingredientsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const ingredientsList = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        ingredientsList.push({
          id: doc.id,
          ...data,
          // Asegurar que los campos numéricos estén bien formateados
          price: parseFloat(data.price) || 0,
          stock: parseFloat(data.stock) || 0,
          minStock: parseFloat(data.minStock) || 0
        });
      });
      
      console.log(`✅ Cargados ${ingredientsList.length} ingredientes desde Firestore`);
      setIngredients(ingredientsList);
      
    } catch (error) {
      console.error('❌ Error cargando ingredientes:', error);
      console.error('Detalles del error:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      alert(`Error al cargar ingredientes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = async () => {
    if (!newIngredient.name.trim() || newIngredient.price <= 0) {
      alert('Por favor completa el nombre y precio del ingrediente');
      return;
    }

    try {
      console.log('🔄 Guardando ingrediente en Firestore...', newIngredient);
      
      let imageUrl = newIngredient.image;
      
      // Si hay una imagen seleccionada, subirla a Firebase Storage
      if (selectedFile) {
        console.log('📤 Subiendo imagen a Firebase Storage...');
        imageUrl = await uploadImage(selectedFile);
        console.log('✅ Imagen subida exitosamente:', imageUrl);
      }
      
      const ingredientsRef = collection(db, 'ingredients');
      const docRef = await addDoc(ingredientsRef, {
        ...newIngredient,
        createdAt: new Date().toISOString(),
        addedBy: 'admin',
        // Asegurar que todos los campos estén presentes
        name: newIngredient.name.trim(),
        price: parseFloat(newIngredient.price) || 0,
        unit: newIngredient.unit || 'kg',
        category: newIngredient.category || 'materia_prima',
        description: newIngredient.description || '',
        image: imageUrl,
        supplier: newIngredient.supplier || '',
        stock: parseFloat(newIngredient.stock) || 0,
        minStock: parseFloat(newIngredient.minStock) || 0
      });

      console.log('✅ Ingrediente guardado exitosamente con ID:', docRef.id);
      
      // Limpiar el formulario
      setNewIngredient({
        name: '',
        price: 0,
        unit: 'kg',
        category: 'materia_prima',
        description: '',
        image: '',
        supplier: '',
        stock: 0,
        minStock: 0
      });
      
      // Limpiar imagen seleccionada
      setSelectedFile(null);
      setPreviewUrl('');
      
      setDialogOpen(false);
      loadIngredients();
      
      // Mostrar mensaje de éxito
      alert('✅ Ingrediente agregado exitosamente');
      
    } catch (error) {
      console.error('❌ Error agregando ingrediente:', error);
      console.error('Detalles del error:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      alert(`Error al agregar ingrediente: ${error.message}`);
    }
  };

  const handleEditIngredient = async () => {
    if (!editingIngredient.name.trim() || editingIngredient.price <= 0) {
      alert('Por favor completa el nombre y precio del ingrediente');
      return;
    }

    try {
      console.log('🔄 Actualizando ingrediente en Firestore...', editingIngredient);
      
      const ingredientRef = doc(db, 'ingredients', editingIngredient.id);
      await updateDoc(ingredientRef, {
        name: editingIngredient.name.trim(),
        price: parseFloat(editingIngredient.price) || 0,
        unit: editingIngredient.unit || 'kg',
        category: editingIngredient.category || 'materia_prima',
        description: editingIngredient.description || '',
        image: editingIngredient.image || '',
        supplier: editingIngredient.supplier || '',
        stock: parseFloat(editingIngredient.stock) || 0,
        minStock: parseFloat(editingIngredient.minStock) || 0,
        updatedAt: new Date().toISOString()
      });

      console.log('✅ Ingrediente actualizado exitosamente');
      setEditingIngredient(null);
      setDialogOpen(false);
      loadIngredients();
      
      // Mostrar mensaje de éxito
      alert('✅ Ingrediente actualizado exitosamente');
      
    } catch (error) {
      console.error('❌ Error actualizando ingrediente:', error);
      console.error('Detalles del error:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      alert(`Error al actualizar ingrediente: ${error.message}`);
    }
  };

  const handleDeleteIngredient = async (ingredientId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este ingrediente?')) {
      try {
        console.log('🔄 Eliminando ingrediente de Firestore...', ingredientId);
        
        await deleteDoc(doc(db, 'ingredients', ingredientId));
        console.log('✅ Ingrediente eliminado exitosamente');
        loadIngredients();
        
        // Mostrar mensaje de éxito
        alert('✅ Ingrediente eliminado exitosamente');
        
      } catch (error) {
        console.error('❌ Error eliminando ingrediente:', error);
        console.error('Detalles del error:', {
          code: error.code,
          message: error.message,
          stack: error.stack
        });
        alert(`Error al eliminar ingrediente: ${error.message}`);
      }
    }
  };

  const openEditDialog = (ingredient) => {
    setEditingIngredient({ ...ingredient });
    setDialogOpen(true);
  };

  const getCategoryColor = (category) => {
    const colors = {
      materia_prima: 'primary',
      empaque: 'secondary',
      servicios: 'success',
      otros: 'default'
    };
    return colors[category] || 'default';
  };

  const getCategoryLabel = (category) => {
    const labels = {
      materia_prima: 'Materia Prima',
      empaque: 'Empaque',
      servicios: 'Servicios',
      otros: 'Otros'
    };
    return labels[category] || category;
  };

  const getStockStatus = (stock, minStock) => {
    if (stock <= 0) return { status: 'Sin Stock', color: 'error' };
    if (stock <= minStock) return { status: 'Stock Bajo', color: 'warning' };
    return { status: 'En Stock', color: 'success' };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography variant="h6" sx={{ fontFamily: '"Asap", sans-serif' }}>
          Cargando ingredientes...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}>
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            color: '#c8626d', 
            fontFamily: '"Asap", sans-serif',
            mb: 1
          }}>
            Materias Primas
          </Typography>
          <Typography variant="body1" sx={{ color: '#666', fontFamily: '"Asap", sans-serif' }}>
            Gestión de ingredientes y materias primas
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setEditingIngredient(null);
            setDialogOpen(true);
          }}
          sx={{
            backgroundColor: '#c8626d',
            '&:hover': { backgroundColor: '#b8555a' },
            fontFamily: '"Asap", sans-serif'
          }}
        >
          Agregar Ingrediente
        </Button>
      </Box>

      {/* Grid de ingredientes */}
      <Grid container spacing={3}>
        {ingredients.map((ingredient) => {
          const stockStatus = getStockStatus(ingredient.stock || 0, ingredient.minStock || 0);
          
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={ingredient.id}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease'
                }
              }}>
                {/* Imagen del ingrediente */}
                <Box sx={{ position: 'relative', height: 200 }}>
                  {ingredient.image ? (
                    <CardMedia
                      component="img"
                      height="200"
                      image={ingredient.image}
                      alt={ingredient.name}
                      sx={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Box sx={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f5f5f5'
                    }}>
                      <Avatar sx={{ width: 80, height: 80, backgroundColor: '#c8626d' }}>
                        <Inventory sx={{ fontSize: 40 }} />
                      </Avatar>
                    </Box>
                  )}
                  
                  {/* Botones de acción */}
                  <Box sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    display: 'flex',
                    gap: 0.5
                  }}>
                    <IconButton
                      size="small"
                      onClick={() => openEditDialog(ingredient)}
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        '&:hover': { backgroundColor: 'white' }
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteIngredient(ingredient.id)}
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        '&:hover': { backgroundColor: 'white' }
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Chip de categoría */}
                  <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                    <Chip
                      label={getCategoryLabel(ingredient.category)}
                      color={getCategoryColor(ingredient.category)}
                      size="small"
                      sx={{ fontFamily: '"Asap", sans-serif' }}
                    />
                  </Box>
                </Box>

                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                  {/* Nombre del ingrediente */}
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    fontFamily: '"Asap", sans-serif',
                    color: '#c8626d',
                    mb: 1,
                    lineHeight: 1.2
                  }}>
                    {ingredient.name}
                  </Typography>

                  {/* Precio */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AttachMoney sx={{ fontSize: 20, color: '#4CAF50' }} />
                    <Typography variant="h6" sx={{ 
                      fontWeight: 700,
                      fontFamily: '"Asap", sans-serif',
                      color: '#4CAF50'
                    }}>
                      ${ingredient.price}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#666',
                      fontFamily: '"Asap", sans-serif'
                    }}>
                      / {ingredient.unit}
                    </Typography>
                  </Box>

                  {/* Descripción */}
                  {ingredient.description && (
                    <Typography variant="body2" sx={{ 
                      color: '#666',
                      fontFamily: '"Asap", sans-serif',
                      mb: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {ingredient.description}
                    </Typography>
                  )}

                  {/* Proveedor */}
                  {ingredient.supplier && (
                    <Typography variant="caption" sx={{ 
                      color: '#999',
                      fontFamily: '"Asap", sans-serif',
                      display: 'block',
                      mb: 1
                    }}>
                      Proveedor: {ingredient.supplier}
                    </Typography>
                  )}

                  {/* Estado del stock */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      label={stockStatus.status}
                      color={stockStatus.color}
                      size="small"
                      sx={{ fontFamily: '"Asap", sans-serif' }}
                    />
                    <Typography variant="caption" sx={{ 
                      color: '#666',
                      fontFamily: '"Asap", sans-serif'
                    }}>
                      Stock: {ingredient.stock || 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {ingredients.length === 0 && (
        <Box sx={{ 
          textAlign: 'center', 
          py: 8,
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '2px dashed #dee2e6'
        }}>
          <Inventory sx={{ fontSize: 64, color: '#c8626d', mb: 2 }} />
          <Typography variant="h6" sx={{ 
            color: '#666', 
            fontFamily: '"Asap", sans-serif',
            mb: 1
          }}>
            No hay ingredientes agregados
          </Typography>
          <Typography variant="body2" sx={{ color: '#999', fontFamily: '"Asap", sans-serif' }}>
            Comienza agregando tus materias primas
          </Typography>
        </Box>
      )}

      {/* Modal personalizado para agregar/editar ingrediente */}
      {dialogOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
            p: 2
          }}
          onClick={() => setDialogOpen(false)}
        >
          <Box
            sx={{
              backgroundColor: 'white',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <Box
              sx={{
                backgroundColor: '#c8626d',
                color: 'white',
                p: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontFamily: '"Asap", sans-serif',
                  fontWeight: 700,
                  fontSize: '1.5rem'
                }}
              >
                {editingIngredient ? 'Editar Ingrediente' : 'Agregar Ingrediente'}
              </Typography>
              <IconButton
                onClick={() => setDialogOpen(false)}
                sx={{
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                <Close />
              </IconButton>
            </Box>

            {/* Contenido del modal */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                p: 4
              }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nombre del Ingrediente"
                    value={editingIngredient ? editingIngredient.name : newIngredient.name}
                    onChange={(e) => {
                      if (editingIngredient) {
                        setEditingIngredient({...editingIngredient, name: e.target.value});
                      } else {
                        setNewIngredient({...newIngredient, name: e.target.value});
                      }
                    }}
                    sx={{ 
                      fontFamily: '"Asap", sans-serif',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px'
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Precio"
                    type="number"
                    value={editingIngredient ? editingIngredient.price : newIngredient.price}
                    onChange={(e) => {
                      if (editingIngredient) {
                        setEditingIngredient({...editingIngredient, price: parseFloat(e.target.value) || 0});
                      } else {
                        setNewIngredient({...newIngredient, price: parseFloat(e.target.value) || 0});
                      }
                    }}
                    sx={{ 
                      fontFamily: '"Asap", sans-serif',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px'
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Unidad</InputLabel>
                    <Select
                      value={editingIngredient ? editingIngredient.unit : newIngredient.unit}
                      onChange={(e) => {
                        if (editingIngredient) {
                          setEditingIngredient({...editingIngredient, unit: e.target.value});
                        } else {
                          setNewIngredient({...newIngredient, unit: e.target.value});
                        }
                      }}
                      label="Unidad"
                      sx={{
                        borderRadius: '12px',
                        fontFamily: '"Asap", sans-serif'
                      }}
                    >
                      <MenuItem value="kg">kg</MenuItem>
                      <MenuItem value="g">g</MenuItem>
                      <MenuItem value="lb">lb</MenuItem>
                      <MenuItem value="oz">oz</MenuItem>
                      <MenuItem value="unit">unidad</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Categoría</InputLabel>
                    <Select
                      value={editingIngredient ? editingIngredient.category : newIngredient.category}
                      onChange={(e) => {
                        if (editingIngredient) {
                          setEditingIngredient({...editingIngredient, category: e.target.value});
                        } else {
                          setNewIngredient({...newIngredient, category: e.target.value});
                        }
                      }}
                      label="Categoría"
                      sx={{
                        borderRadius: '12px',
                        fontFamily: '"Asap", sans-serif'
                      }}
                    >
                      <MenuItem value="materia_prima">Materia Prima</MenuItem>
                      <MenuItem value="empaque">Empaque</MenuItem>
                      <MenuItem value="servicios">Servicios</MenuItem>
                      <MenuItem value="otros">Otros</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descripción"
                    multiline
                    rows={3}
                    value={editingIngredient ? editingIngredient.description : newIngredient.description}
                    onChange={(e) => {
                      if (editingIngredient) {
                        setEditingIngredient({...editingIngredient, description: e.target.value});
                      } else {
                        setNewIngredient({...newIngredient, description: e.target.value});
                      }
                    }}
                    sx={{ 
                      fontFamily: '"Asap", sans-serif',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px'
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Proveedor"
                    value={editingIngredient ? editingIngredient.supplier : newIngredient.supplier}
                    onChange={(e) => {
                      if (editingIngredient) {
                        setEditingIngredient({...editingIngredient, supplier: e.target.value});
                      } else {
                        setNewIngredient({...newIngredient, supplier: e.target.value});
                      }
                    }}
                    sx={{ 
                      fontFamily: '"Asap", sans-serif',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px'
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Stock Actual"
                    type="number"
                    value={editingIngredient ? editingIngredient.stock : newIngredient.stock}
                    onChange={(e) => {
                      if (editingIngredient) {
                        setEditingIngredient({...editingIngredient, stock: parseFloat(e.target.value) || 0});
                      } else {
                        setNewIngredient({...newIngredient, stock: parseFloat(e.target.value) || 0});
                      }
                    }}
                    sx={{ 
                      fontFamily: '"Asap", sans-serif',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px'
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Stock Mínimo"
                    type="number"
                    value={editingIngredient ? editingIngredient.minStock : newIngredient.minStock}
                    onChange={(e) => {
                      if (editingIngredient) {
                        setEditingIngredient({...editingIngredient, minStock: parseFloat(e.target.value) || 0});
                      } else {
                        setNewIngredient({...newIngredient, minStock: parseFloat(e.target.value) || 0});
                      }
                    }}
                    sx={{ 
                      fontFamily: '"Asap", sans-serif',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px'
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ 
                    fontFamily: '"Asap", sans-serif',
                    fontWeight: 600,
                    mb: 1,
                    color: '#333'
                  }}>
                    Imagen del Ingrediente
                  </Typography>
                  
                  {/* Preview de imagen */}
                  {(previewUrl || (editingIngredient && editingIngredient.image)) && (
                    <Box sx={{ mb: 2, textAlign: 'center' }}>
                      <img
                        src={previewUrl || editingIngredient?.image}
                        alt="Preview"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '150px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '2px solid #e0e0e0'
                        }}
                      />
                      <Button
                        size="small"
                        color="error"
                        onClick={clearImage}
                        sx={{ mt: 1, fontFamily: '"Asap", sans-serif' }}
                      >
                        Eliminar Imagen
                      </Button>
                    </Box>
                  )}
                  
                  {/* Uploader de archivo */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="image-upload"
                      type="file"
                      onChange={handleFileSelect}
                    />
                    <label htmlFor="image-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<PhotoCamera />}
                        disabled={uploading}
                        sx={{
                          fontFamily: '"Asap", sans-serif',
                          borderColor: '#c8626d',
                          color: '#c8626d',
                          '&:hover': {
                            backgroundColor: '#c8626d',
                            color: 'white'
                          }
                        }}
                      >
                        {uploading ? 'Subiendo...' : 'Seleccionar Imagen'}
                      </Button>
                    </label>
                    
                    {uploading && (
                      <Box sx={{ width: '100%', ml: 2 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={uploadProgress}
                          sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            backgroundColor: '#f0f0f0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#c8626d'
                            }
                          }}
                        />
                        <Typography variant="caption" sx={{ 
                          fontFamily: '"Asap", sans-serif',
                          color: '#666',
                          mt: 0.5,
                          display: 'block'
                        }}>
                          Subiendo imagen... {uploadProgress}%
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  <Typography variant="caption" sx={{ 
                    fontFamily: '"Asap", sans-serif',
                    color: '#666',
                    mt: 1,
                    display: 'block'
                  }}>
                    Formatos soportados: JPG, PNG, GIF. Tamaño máximo: 5MB
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* Footer del modal */}
            <Box
              sx={{
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid #e0e0e0',
                p: 3,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2
              }}
            >
              <Button
                onClick={() => setDialogOpen(false)}
                variant="outlined"
                sx={{
                  fontFamily: '"Asap", sans-serif',
                  fontWeight: 600,
                  borderRadius: '12px',
                  px: 3,
                  py: 1.5,
                  borderColor: '#ddd',
                  color: '#666',
                  '&:hover': {
                    borderColor: '#999',
                    backgroundColor: '#f5f5f5'
                  }
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={editingIngredient ? handleEditIngredient : handleAddIngredient}
                variant="contained"
                sx={{
                  backgroundColor: '#c8626d',
                  '&:hover': { backgroundColor: '#b8555a' },
                  fontFamily: '"Asap", sans-serif',
                  fontWeight: 600,
                  borderRadius: '12px',
                  px: 3,
                  py: 1.5,
                  boxShadow: '0 4px 12px rgba(200, 98, 109, 0.3)'
                }}
              >
                {editingIngredient ? 'Actualizar' : 'Agregar'}
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CostAnalysisIngredients;
