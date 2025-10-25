import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Rating,
  Avatar,
  LinearProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  FilterList,
  Sort,
  Star,
  Inventory,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';

const AdminProducts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Lista vacía de productos
  const products = [];

  const categories = [
    'Todas',
    'NY Style Cookies',
    'Chocolate',
    'Especiales',
    'Veganas',
    'Sin Gluten'
  ];

  const getStockColor = (stock) => {
    if (stock < 10) return '#f44336';
    if (stock < 25) return '#FF9800';
    return '#4CAF50';
  };

  const getStockLabel = (stock) => {
    if (stock < 10) return 'Bajo Stock';
    if (stock < 25) return 'Stock Medio';
    return 'Stock Alto';
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Box sx={{ py: 4, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Container maxWidth="xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 800,
                      color: '#eb8b8b',
                      fontSize: { xs: '2rem', md: '3rem' },
                      fontFamily: 'Playfair Display, serif'
                    }}
                  >
                    Gestión de Productos
                  </Typography>
              <Typography
                variant="h6"
                sx={{ color: '#eb8b8b' }}
              >
                Administra tu catálogo de galletas
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
              sx={{
                backgroundColor: '#c8626d',
                color: 'white',
                px: 4,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: '25px',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#b5555a',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(139, 69, 19, 0.3)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Nuevo Producto
            </Button>
          </Box>
        </motion.div>

        {/* Filtros y búsqueda */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card
            sx={{
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              mb: 4
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <Search sx={{ color: '#c8626d', mr: 1 }} />
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '25px',
                        '& fieldset': {
                          borderColor: '#ddd',
                        },
                        '&:hover fieldset': {
                          borderColor: '#c8626d',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#c8626d',
                        },
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Categoría</InputLabel>
                    <Select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      sx={{ borderRadius: '25px' }}
                    >
                      {categories.map((category) => (
                        <MenuItem key={category} value={category === 'Todas' ? 'all' : category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Ordenar por</InputLabel>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      sx={{ borderRadius: '25px' }}
                    >
                      <MenuItem value="name">Nombre</MenuItem>
                      <MenuItem value="price">Precio</MenuItem>
                      <MenuItem value="sales">Ventas</MenuItem>
                      <MenuItem value="rating">Rating</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={2}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterList />}
                    fullWidth
                    sx={{
                      borderColor: '#c8626d',
                      color: '#c8626d',
                      borderRadius: '25px',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#c8626d20',
                        borderColor: '#c8626d'
                      }
                    }}
                  >
                    Filtros
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>

        {/* Grid de productos */}
        <Grid container spacing={4}>
          {filteredProducts.length === 0 ? (
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card
                  sx={{
                    borderRadius: '20px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    p: 8,
                    textAlign: 'center'
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: '#c8626d',
                      mb: 2
                    }}
                  >
                    No hay productos
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: '#666', mb: 4 }}
                  >
                    Comienza agregando tu primer producto
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    sx={{
                      backgroundColor: '#c8626d',
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 4,
                      py: 1.5,
                      borderRadius: '25px',
                      '&:hover': {
                        backgroundColor: '#b5555a'
                      }
                    }}
                  >
                    Agregar Producto
                  </Button>
                </Card>
              </motion.div>
            </Grid>
          ) : (
            filteredProducts.map((product, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <Card
                  sx={{
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
                      transform: 'translateY(-5px)'
                    }
                  }}
                >
                  {/* Imagen del producto */}
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={product.image}
                      alt={product.name}
                      sx={{
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.05)'
                        }
                      }}
                    />
                    
                    {/* Badges */}
                    <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {product.isNew && (
                        <Chip
                          label="New"
                          size="small"
                          sx={{
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                      )}
                      {product.isBestSeller && (
                        <Chip
                          label="Más Vendido"
                          size="small"
                          sx={{
                            backgroundColor: '#FF6B35',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                      )}
                    </Box>

                    {/* Estado del producto */}
                    <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                      <Chip
                        label={product.isActive ? 'Activo' : 'Inactivo'}
                        size="small"
                        sx={{
                          backgroundColor: product.isActive ? '#4CAF50' : '#f44336',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>
                  </Box>

                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: '#333',
                        mb: 1,
                        fontSize: '1.1rem'
                      }}
                    >
                      {product.name}
                    </Typography>
                    
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#666',
                        mb: 2,
                        fontSize: '0.9rem'
                      }}
                    >
                      {product.category}
                    </Typography>

                    {/* Rating */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Rating
                        value={product.rating}
                        precision={0.1}
                        readOnly
                        size="small"
                        sx={{ color: '#FFD700' }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ ml: 1, color: '#666', fontSize: '0.85rem' }}
                      >
                        ({product.reviews})
                      </Typography>
                    </Box>

                    {/* Precio */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: '#c8626d',
                          fontSize: '1.3rem'
                        }}
                      >
                        ${product.price}
                      </Typography>
                      {product.originalPrice && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#999',
                            textDecoration: 'line-through',
                            fontSize: '1rem'
                          }}
                        >
                          ${product.originalPrice}
                        </Typography>
                      )}
                    </Box>

                    {/* Información de stock y ventas */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                          Stock
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: getStockColor(product.stock),
                            fontSize: '0.9rem'
                          }}
                        >
                          {product.stock} units
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                          Ventas
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: '#c8626d',
                            fontSize: '0.9rem'
                          }}
                        >
                          {product.sales}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Barra de stock */}
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                          {getStockLabel(product.stock)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                          {product.stock}/100
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(product.stock / 100) * 100}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getStockColor(product.stock),
                            borderRadius: 3
                          }
                        }}
                      />
                    </Box>

                    {/* Botones de acción */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        onClick={() => handleEditProduct(product)}
                        sx={{
                          backgroundColor: '#c8626d20',
                          color: '#c8626d',
                          '&:hover': {
                            backgroundColor: '#c8626d',
                            color: 'white'
                          }
                        }}
                      >
                        <Edit />
                      </IconButton>
                      
                      <IconButton
                        sx={{
                          backgroundColor: '#2196F320',
                          color: '#2196F3',
                          '&:hover': {
                            backgroundColor: '#2196F3',
                            color: 'white'
                          }
                        }}
                      >
                        <Visibility />
                      </IconButton>
                      
                      <IconButton
                        sx={{
                          backgroundColor: '#f4433620',
                          color: '#f44336',
                          '&:hover': {
                            backgroundColor: '#f44336',
                            color: 'white'
                          }
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))
          )}
        </Grid>

        {/* Dialog para editar/crear producto */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
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
              borderRadius: '20px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
              zIndex: 9999999
            }
          }}
          BackdropProps={{
            sx: {
              zIndex: 9999998
            }
          }}
        >
          <DialogTitle sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#c8626d' }}>
            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre del producto"
                  defaultValue={editingProduct?.name || ''}
                  sx={{ borderRadius: '12px' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Precio"
                  type="number"
                  defaultValue={editingProduct?.price || ''}
                  sx={{ borderRadius: '12px' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Precio original"
                  type="number"
                  defaultValue={editingProduct?.originalPrice || ''}
                  sx={{ borderRadius: '12px' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    defaultValue={editingProduct?.category || ''}
                    sx={{ borderRadius: '12px' }}
                  >
                    {categories.slice(1).map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Stock"
                  type="number"
                  defaultValue={editingProduct?.stock || ''}
                  sx={{ borderRadius: '12px' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  multiline
                  rows={3}
                  defaultValue={editingProduct?.description || ''}
                  sx={{ borderRadius: '12px' }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={<Switch defaultChecked={editingProduct?.isNew || false} />}
                  label="Producto Nuevo"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={<Switch defaultChecked={editingProduct?.isBestSeller || false} />}
                  label="Más Vendido"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={<Switch defaultChecked={editingProduct?.isActive || true} />}
                  label="Activo"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={handleCloseDialog}
              sx={{
                color: '#666',
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleCloseDialog}
              sx={{
                backgroundColor: '#c8626d',
                color: 'white',
                px: 4,
                py: 1.5,
                borderRadius: '25px',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#b5555a'
                }
              }}
            >
              {editingProduct ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default AdminProducts;
