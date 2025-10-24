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
  LinearProgress
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Inventory
} from '@mui/icons-material';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useTranslation } from 'react-i18next';

const InventoryManager = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [inventoryDialog, setInventoryDialog] = useState(false);
  const [newQuantity, setNewQuantity] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Cargar productos desde Firebase
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      showSnackbar('Error cargando productos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleUpdateInventory = async () => {
    if (!editingProduct || !newQuantity || isNaN(newQuantity) || newQuantity < 0) {
      showSnackbar('Por favor ingresa una cantidad válida', 'error');
      return;
    }

    try {
      const productRef = doc(db, 'products', editingProduct.id);
      await updateDoc(productRef, {
        inventory: parseInt(newQuantity),
        lastUpdated: new Date()
      });

      // Actualizar el estado local
      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id 
          ? { ...p, inventory: parseInt(newQuantity), lastUpdated: new Date() }
          : p
      ));

      setInventoryDialog(false);
      setEditingProduct(null);
      setNewQuantity('');
      showSnackbar('Inventario actualizado exitosamente', 'success');
    } catch (error) {
      console.error('Error updating inventory:', error);
      showSnackbar('Error actualizando inventario', 'error');
    }
  };

  const openInventoryDialog = (product) => {
    setEditingProduct(product);
    setNewQuantity(product.inventory?.toString() || '0');
    setInventoryDialog(true);
  };

  const getInventoryStatus = (inventory) => {
    if (inventory === 0) return { label: t('product.outOfStock', 'Out of Stock'), color: '#f44336' };
    if (inventory < 10) return { label: t('product.lowStock', 'Low Stock'), color: '#ff9800' };
    if (inventory < 50) return { label: t('product.mediumStock', 'Medium Stock'), color: '#ffc107' };
    return { label: t('product.inStock', 'In Stock'), color: '#4caf50' };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <LinearProgress sx={{ width: 300 }} />
      </Box>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      className="inventory-manager-mobile"
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '20px',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Inventory />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#c8626d' }}>
              Gestión de Inventario
            </Typography>
          </Box>
          <Button
            onClick={onClose}
            sx={{ color: '#c8626d' }}
          >
            ✕
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box>
          <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
            Administra las cantidades de productos en inventario
          </Typography>

      {/* Resumen de inventario */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" sx={{ color: '#c8626d', fontWeight: 700 }}>
              {products.reduce((total, product) => total + (product.inventory || 0), 0)}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Total Unidades
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 700 }}>
              {products.filter(p => p.inventory > 0 && p.inventory < 20).length}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Bajo Stock
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" sx={{ color: '#2196f3', fontWeight: 700 }}>
              {products.length}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Total Productos
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Tabla de productos */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Producto</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Categoría</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Precio</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Inventario</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Última Actualización</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product, index) => {
                  const status = getInventoryStatus(product.inventory || 0);
                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            component="img"
                            src={product.image}
                            alt={product.name}
                            sx={{
                              width: 50,
                              height: 50,
                              objectFit: 'cover',
                              borderRadius: 1
                            }}
                          />
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {product.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              ID: {product.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.category || 'Sin categoría'}
                          size="small"
                          sx={{ backgroundColor: '#c8626d20', color: '#c8626d' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          ${product.price}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {product.inventory || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={status.label}
                          size="small"
                          sx={{
                            backgroundColor: status.color + '20',
                            color: status.color,
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          {product.lastUpdated 
                            ? new Date(product.lastUpdated.seconds * 1000).toLocaleDateString()
                            : 'Nunca'
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => openInventoryDialog(product)}
                          sx={{
                            color: '#c8626d',
                            '&:hover': { backgroundColor: '#c8626d20' }
                          }}
                        >
                          <Edit />
                        </IconButton>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog para actualizar inventario */}
      <Dialog
        open={inventoryDialog}
        onClose={() => setInventoryDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Actualizar Inventario
        </DialogTitle>
        <DialogContent>
          {editingProduct && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box
                  component="img"
                  src={editingProduct.image}
                  alt={editingProduct.name}
                  sx={{
                    width: 60,
                    height: 60,
                    objectFit: 'cover',
                    borderRadius: 1
                  }}
                />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {editingProduct.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Inventario actual: {editingProduct.inventory || 0}
                  </Typography>
                </Box>
              </Box>
              
              <TextField
                fullWidth
                label="Nueva cantidad en inventario"
                type="number"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                inputProps={{ min: 0 }}
                sx={{ mb: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setInventoryDialog(false)}
            startIcon={<Cancel />}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpdateInventory}
            variant="contained"
            startIcon={<Save />}
            sx={{
              backgroundColor: '#c8626d',
              '&:hover': { backgroundColor: '#b5555a' }
            }}
          >
            Actualizar
          </Button>
        </DialogActions>
      </Dialog>

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
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryManager;
