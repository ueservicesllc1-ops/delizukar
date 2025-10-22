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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Avatar
} from '@mui/material';
import {
  Close,
  Save,
  Edit,
  Delete,
  Star,
  StarBorder,
  Refresh
} from '@mui/icons-material';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { fontUploader } from '../utils/fontUploader';

const FeaturedProductsManager = ({ open, onClose }) => {
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Configuración del título
  const [titleConfig, setTitleConfig] = useState({
    text: 'Galletas Destacadas',
    font: 'Playfair Display'
  });
  
  // Fuentes disponibles
  const [availableFonts, setAvailableFonts] = useState([]);
  const [uploadedFonts, setUploadedFonts] = useState([]);

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (open) {
      loadData();
      loadFonts();
    }
  }, [open]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar productos
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
      
      // Cargar configuración de productos destacados
      const configDoc = doc(db, 'appConfig', 'featuredProducts');
      const configSnapshot = await getDocs(collection(db, 'appConfig'));
      const configData = configSnapshot.docs.find(doc => doc.id === 'featuredProducts');
      
      if (configData) {
        const config = configData.data();
        setTitleConfig({
          text: config.titleText || 'Galletas Destacadas',
          font: config.titleFont || 'Playfair Display'
        });
        setFeaturedProducts(config.selectedProducts || []);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      showSnackbar('Error cargando datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadFonts = async () => {
    try {
      // Cargar fuentes predefinidas
      await fontUploader.loadFonts(['playfair-display', 'roboto', 'montserrat', 'poppins', 'lato', 'open-sans']);
      setAvailableFonts(fontUploader.availableFonts);
      
      // Cargar fuentes subidas desde Firestore
      const fontsCollection = collection(db, 'fonts');
      const snapshot = await getDocs(fontsCollection);
      const uploadedFontsData = [];
      const seenNames = new Set();
      
      snapshot.forEach((doc) => {
        const fontData = { id: doc.id, ...doc.data() };
        if (!seenNames.has(fontData.name)) {
          uploadedFontsData.push(fontData);
          seenNames.add(fontData.name);
        }
      });
      
      setUploadedFonts(uploadedFontsData);
    } catch (error) {
      console.error('Error loading fonts:', error);
    }
  };

  const handleProductToggle = (productId) => {
    setFeaturedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else if (prev.length < 4) {
        return [...prev, productId];
      } else {
        showSnackbar('Solo puedes seleccionar máximo 4 productos', 'warning');
        return prev;
      }
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Guardar configuración
      const configDoc = doc(db, 'appConfig', 'featuredProducts');
      await setDoc(configDoc, {
        titleText: titleConfig.text,
        titleFont: titleConfig.font,
        selectedProducts: featuredProducts,
        updatedAt: new Date()
      }, { merge: true });
      
      showSnackbar('Configuración guardada exitosamente', 'success');
    } catch (error) {
      console.error('Error saving configuration:', error);
      showSnackbar('Error al guardar la configuración', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const getSelectedProducts = () => {
    return products.filter(product => featuredProducts.includes(product.id));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '20px',
          maxHeight: '95vh',
          height: '95vh'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Star sx={{ color: '#8B4513', fontSize: '2rem' }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#8B4513' }}>
              Configurar Galletas Destacadas
            </Typography>
          </Box>
          <Button
            onClick={onClose}
            sx={{ color: '#8B4513' }}
          >
            ✕
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading && <LinearProgress />}
        
        <Box sx={{ mt: 2 }}>
          {/* Configuración del Título */}
          <Card sx={{ mb: 4, p: 3, backgroundColor: '#f8f9fa' }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#8B4513', fontWeight: 600 }}>
              Configuración del Título
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Texto del título"
                  value={titleConfig.text}
                  onChange={(e) => setTitleConfig(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Galletas Destacadas"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Fuente del título</InputLabel>
                  <Select
                    value={titleConfig.font}
                    onChange={(e) => setTitleConfig(prev => ({ ...prev, font: e.target.value }))}
                  >
                    {/* Fuentes predefinidas */}
                    {availableFonts.map(font => (
                      <MenuItem key={`predefined-${font.id}`} value={font.name} sx={{ fontFamily: `"${font.name}", sans-serif` }}>
                        {font.name}
                      </MenuItem>
                    ))}
                    {/* Separador */}
                    <MenuItem disabled>
                      <Box sx={{ width: '100%', height: '1px', backgroundColor: '#ddd', my: 1 }} />
                    </MenuItem>
                    {/* Fuentes personalizadas */}
                    {uploadedFonts.map(font => (
                      <MenuItem key={`uploaded-${font.id}`} value={font.name} sx={{ fontFamily: `"${font.name}", sans-serif` }}>
                        {font.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Vista previa del título */}
              <Grid item xs={12}>
                <Box sx={{ p: 2, backgroundColor: 'white', borderRadius: 2, textAlign: 'center', border: '1px solid #ddd' }}>
                  <Typography variant="h4" sx={{ 
                    fontFamily: `"${titleConfig.font}", serif`,
                    color: '#EC8C8D',
                    fontWeight: 800
                  }}>
                    Vista previa: {titleConfig.text}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Card>

          {/* Selección de Productos */}
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#8B4513', fontWeight: 600 }}>
                Seleccionar Productos Destacados
              </Typography>
              <Chip 
                label={`${featuredProducts.length}/4 seleccionados`}
                color={featuredProducts.length === 4 ? 'success' : 'default'}
                sx={{ fontWeight: 600 }}
              />
            </Box>

            <Grid container spacing={1.5}>
              {products.map((product) => {
                const isSelected = featuredProducts.includes(product.id);
                const isMaxReached = featuredProducts.length >= 4 && !isSelected;
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={product.id}>
                    <Card
                      sx={{
                        cursor: isMaxReached ? 'not-allowed' : 'pointer',
                        opacity: isMaxReached ? 0.5 : 1,
                        border: isSelected ? '2px solid #8B4513' : '1px solid #ddd',
                        transition: 'all 0.3s ease',
                        '&:hover': !isMaxReached ? {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        } : {}
                      }}
                      onClick={() => handleProductToggle(product.id)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Checkbox
                            checked={isSelected}
                            disabled={isMaxReached}
                            sx={{ color: '#8B4513' }}
                          />
                          <Avatar
                            src={product.image}
                            alt={product.name}
                            sx={{ width: 50, height: 50, mr: 2 }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                              {product.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              ${product.price}
                            </Typography>
                          </Box>
                        </Box>
                        
                        {product.description && (
                          <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                            {product.description.substring(0, 80)}...
                          </Typography>
                        )}
                        
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          {product.featured && <Chip label="Destacado" size="small" color="primary" />}
                          {product.bestSeller && <Chip label="Más Vendido" size="small" color="success" />}
                          {product.isNew && <Chip label="Nuevo" size="small" color="warning" />}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* Productos Seleccionados */}
            {featuredProducts.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#8B4513', fontWeight: 600 }}>
                  Productos Seleccionados
                </Typography>
                <Grid container spacing={2}>
                  {getSelectedProducts().map((product) => (
                    <Grid item xs={12} sm={6} md={3} key={product.id}>
                      <Card sx={{ p: 2, backgroundColor: '#f8f9fa', border: '1px solid #8B4513' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            src={product.image}
                            alt={product.name}
                            sx={{ width: 40, height: 40, mr: 2 }}
                          />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {product.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              ${product.price}
                            </Typography>
                          </Box>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Card>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={loadData}
          startIcon={<Refresh />}
          sx={{ color: '#8B4513' }}
        >
          Refrescar
        </Button>
        <Button
          onClick={onClose}
          sx={{ color: '#8B4513' }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<Save />}
          disabled={loading}
          sx={{
            backgroundColor: '#8B4513',
            '&:hover': { backgroundColor: '#A0522D' }
          }}
        >
          Guardar Configuración
        </Button>
      </DialogActions>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default FeaturedProductsManager;
