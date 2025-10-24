import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  IconButton,
  Toolbar,
  AppBar,
  Collapse,
  Chip,
  Button
} from '@mui/material';
import {
  Dashboard,
  Inventory,
  Menu as MenuIcon,
  AttachMoney,
  Receipt,
  ExpandLess,
  ExpandMore,
  Cookie,
  ArrowBack
} from '@mui/icons-material';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import CostAnalysisDashboard from '../pages/CostAnalysisDashboard';
import CostAnalysisIngredients from '../pages/CostAnalysisIngredients';
import CostAnalysisProducts from '../pages/CostAnalysisProducts';

const CostAnalysisLayout = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState('dashboard');
  const [productsExpanded, setProductsExpanded] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const renderContent = () => {
    switch (selectedSection) {
      case 'dashboard':
        return <CostAnalysisDashboard />;
      case 'ingredients':
        return <CostAnalysisIngredients />;
      case 'products':
        return <CostAnalysisProducts selectedProduct={selectedProduct} onProductSelect={setSelectedProduct} />;
      default:
        return <CostAnalysisDashboard />;
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: <Dashboard />,
      description: 'Resumen general y reportes'
    },
    {
      id: 'ingredients',
      title: 'Ingredientes',
      icon: <Inventory />,
      description: 'Gestión de materias primas'
    },
    {
      id: 'products',
      title: 'Productos',
      icon: <Receipt />,
      description: 'Recetas y productos'
    }
  ];

  const drawerWidth = 280;

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const productsRef = collection(db, 'products');
      const productsQuery = query(productsRef, orderBy('createdAt', 'desc'));
      const productsSnapshot = await getDocs(productsQuery);
      
      const productsList = [];
      productsSnapshot.forEach((doc) => {
        productsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setProducts(productsList);
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSectionChange = (sectionId) => {
    setSelectedSection(sectionId);
    setDrawerOpen(false);
  };

  const handleProductsClick = () => {
    if (!productsExpanded) {
      loadProducts();
    }
    setProductsExpanded(!productsExpanded);
  };

  const handleProductSelect = async (product) => {
    console.log('🔄 Producto seleccionado desde layout:', product);
    setSelectedProduct(product);
    setSelectedSection('products');
    setDrawerOpen(false);
  };

  const drawer = (
    <Box sx={{ height: '100%', backgroundColor: '#f8f9fa' }}>
      {/* Header del drawer */}
      <Box sx={{ 
        p: 2, 
        backgroundColor: '#c8626d', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <AttachMoney sx={{ fontSize: 24 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: '"Asap", sans-serif' }}>
          Sistema de Costos
        </Typography>
      </Box>

      <Divider />

      {/* Lista de opciones */}
      <List sx={{ p: 1 }}>
        {menuItems.map((item) => (
          <React.Fragment key={item.id}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={item.id === 'products' ? handleProductsClick : () => handleSectionChange(item.id)}
                sx={{
                  borderRadius: '8px',
                  backgroundColor: selectedSection === item.id ? '#e8f4fd' : 'transparent',
                  border: selectedSection === item.id ? '1px solid #c8626d' : '1px solid transparent',
                  '&:hover': {
                    backgroundColor: selectedSection === item.id ? '#e8f4fd' : '#f0f0f0'
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  color: selectedSection === item.id ? '#c8626d' : '#666',
                  minWidth: 40
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: selectedSection === item.id ? 600 : 400,
                        fontFamily: '"Asap", sans-serif',
                        color: selectedSection === item.id ? '#c8626d' : '#333'
                      }}
                    >
                      {item.title}
                    </Typography>
                  }
                  secondary={
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#666',
                        fontFamily: '"Asap", sans-serif'
                      }}
                    >
                      {item.description}
                    </Typography>
                  }
                />
                {item.id === 'products' && (
                  productsExpanded ? <ExpandLess /> : <ExpandMore />
                )}
              </ListItemButton>
            </ListItem>
            
            {/* Submenú de productos */}
            {item.id === 'products' && (
              <Collapse in={productsExpanded} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ pl: 2 }}>
                  {loadingProducts ? (
                    <ListItem>
                      <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', color: '#666' }}>
                        Cargando productos...
                      </Typography>
                    </ListItem>
                  ) : products.length > 0 ? (
                    products.map((product) => (
                      <ListItem key={product.id} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                          onClick={() => handleProductSelect(product)}
                          sx={{
                            borderRadius: '4px',
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #e0e0e0',
                            minHeight: '36px',
                            py: 0.5,
                            px: 1,
                            '&:hover': {
                              backgroundColor: '#e8f4fd',
                              borderColor: '#c8626d'
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <Cookie sx={{ fontSize: 16, color: '#c8626d' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontFamily: '"Asap", sans-serif',
                                    color: '#333',
                                    fontSize: '0.8rem',
                                    fontWeight: 500
                                  }}
                                >
                                  {product.name}
                                </Typography>
                                <Chip
                                  label={product.category || 'Galleta'}
                                  size="small"
                                  sx={{ 
                                    fontFamily: '"Asap", sans-serif',
                                    fontSize: '0.65rem',
                                    height: 16,
                                    minWidth: 'auto'
                                  }}
                                />
                              </Box>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', color: '#666' }}>
                        No hay productos creados
                      </Typography>
                    </ListItem>
                  )}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* AppBar para móvil */}
      <AppBar 
        position="fixed" 
        sx={{ 
          display: { xs: 'flex', md: 'none' },
          backgroundColor: '#c8626d',
          zIndex: (theme) => theme.zIndex.drawer + 1
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontFamily: '"Asap", sans-serif' }}>
            Sistema de Costos
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer para móvil */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            border: 'none'
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Drawer para desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            border: 'none',
            position: 'relative'
          },
        }}
        open
      >
        {drawer}
      </Drawer>

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, md: 2 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: '56px', md: 0 }
        }}
      >
        {/* Botón Volver al Admin - Visible en todas las secciones */}
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => window.location.href = '/admin'}
            sx={{
              borderColor: '#c8626d',
              color: '#c8626d',
              fontFamily: '"Asap", sans-serif',
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: '#c8626d',
                color: 'white',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(200, 98, 109, 0.3)'
              }
            }}
          >
            Volver al Admin
          </Button>
        </Box>

        {renderContent()}
      </Box>
    </Box>
  );
};

export default CostAnalysisLayout;
