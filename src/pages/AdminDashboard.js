import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Avatar,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ShoppingCart,
  Inventory,
  AttachMoney,
  LocalShipping,
  Star,
  MoreVert,
  Add,
  Edit,
  Delete,
  Visibility,
  FontDownload,
  PhotoCamera,
  People,
  Person,
  LocalOffer,
  Share,
  Assessment
} from '@mui/icons-material';
import FontManager from '../components/FontManager';
import BannerPhotoManager from '../components/BannerPhotoManager';
import Banner2PhotoManager from '../components/Banner2PhotoManager';
import PagesManager from '../components/PagesManager';
import MinProductsManager from '../components/MinProductsManager';
import ProductsManager from '../components/ProductsManager';
import InventoryManager from '../components/InventoryManager';
import TestimonialsManager from '../components/TestimonialsManager';
import FeaturedProductsManager from '../components/FeaturedProductsManager';
import SocialMediaManager from '../components/SocialMediaManager';
import PopupHeroManager from '../components/PopupHeroManager';
import StripeBalance from '../components/StripeBalance';

const AdminDashboard = () => {
  const [fontManagerOpen, setFontManagerOpen] = useState(false);
  const [bannerPhotoManagerOpen, setBannerPhotoManagerOpen] = useState(false);
  const [banner2PhotoManagerOpen, setBanner2PhotoManagerOpen] = useState(false);
  const [pagesManagerOpen, setPagesManagerOpen] = useState(false);
  const [minProductsManagerOpen, setMinProductsManagerOpen] = useState(false);
  const [minProducts, setMinProducts] = useState(1);
  const [productsManagerOpen, setProductsManagerOpen] = useState(false);
  const [inventoryManagerOpen, setInventoryManagerOpen] = useState(false);
  const [testimonialsManagerOpen, setTestimonialsManagerOpen] = useState(false);
  const [featuredProductsManagerOpen, setFeaturedProductsManagerOpen] = useState(false);
  const [socialMediaManagerOpen, setSocialMediaManagerOpen] = useState(false);
  const [popupHeroManagerOpen, setPopupHeroManagerOpen] = useState(false);
  const [stripeBalanceOpen, setStripeBalanceOpen] = useState(false);
  const [salesReportOpen, setSalesReportOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFont, setSelectedFont] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
        navigate('/login'); // Redirigir a login si no está autenticado
      }
    });

    return () => unsubscribe();
  }, [navigate]);


  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LinearProgress sx={{ width: '200px' }} />
      </Box>
    );
  }

  if (!user) {
    return null; // Se redirigirá automáticamente
  }

  // Datos vacíos para el dashboard
  const stats = [
    {
      title: 'Ventas Totales',
      value: '$0',
      change: '0%',
      trend: 'up',
      icon: <AttachMoney sx={{ fontSize: '2rem', color: '#4CAF50' }} />,
      color: '#4CAF50'
    },
    {
      title: 'Pedidos',
      value: '0',
      change: '0%',
      trend: 'up',
      icon: <ShoppingCart sx={{ fontSize: '2rem', color: '#2196F3' }} />,
      color: '#2196F3'
    },
    {
      title: 'Clientes',
      value: '0',
      change: '0%',
      trend: 'up',
      icon: <People sx={{ fontSize: '2rem', color: '#FF9800' }} />,
      color: '#FF9800'
    },
    {
      title: 'Productos',
      value: '0',
      change: '0%',
      trend: 'up',
      icon: <Inventory sx={{ fontSize: '2rem', color: '#9C27B0' }} />,
      color: '#9C27B0'
    }
  ];

  const recentOrders = [];

  const topProducts = [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Entregado':
        return '#4CAF50';
      case 'Enviado':
        return '#2196F3';
      case 'Procesando':
        return '#FF9800';
      default:
        return '#666';
    }
  };


  // (hook duplicado eliminado; ya existe arriba antes de los returns)

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
                    Panel de Administración
                  </Typography>
              <Typography
                variant="h6"
                sx={{ color: '#eb8b8b' }}
              >
                Bienvenido de vuelta, Administrador
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                {user.email}
              </Typography>
              <Button
                onClick={handleSignOut}
                variant="outlined"
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
                Cerrar Sesión
              </Button>
            </Box>
          </Box>
        </motion.div>


        {/* Cuadrícula de botones 4x4 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ mt: 12, pt: 6 }}>
            <Grid container spacing={0} sx={{ maxWidth: '1000px', mx: 'auto' }}>
              {Array.from({ length: 16 }, (_, index) => {
                const colors = [
                  '#8B4513', '#be8782', '#A0522D', '#D2B48C',
                  '#CD853F', '#DEB887', '#F4A460', '#D2691E',
                  '#BC8F8F', '#F5DEB3', '#DDA0DD', '#98FB98',
                  '#F0E68C', '#FFB6C1', '#87CEEB', '#FFA07A'
                ];
                const color = colors[index];
                
                return (
                  <Grid item xs={3} key={index}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                            onClick={
                              index === 15 ? () => setFontManagerOpen(true) :
                              index === 0 ? () => setProductsManagerOpen(true) :
                              index === 1 ? () => setBannerPhotoManagerOpen(true) :
                              index === 2 ? () => setBanner2PhotoManagerOpen(true) :
                              index === 3 ? () => setInventoryManagerOpen(true) :
                              index === 4 ? () => setPagesManagerOpen(true) :
                              index === 5 ? () => setTestimonialsManagerOpen(true) :
                              index === 6 ? () => setFeaturedProductsManagerOpen(true) :
                              index === 7 ? () => setSocialMediaManagerOpen(true) :
                              index === 8 ? () => setPopupHeroManagerOpen(true) :
                              index === 9 ? () => setStripeBalanceOpen(true) :
                              index === 10 ? () => setSalesReportOpen(true) :
                              index === 12 ? () => setMinProductsManagerOpen(true) :
                              undefined
                            }
                        sx={{
                          width: '250px',
                          height: '120px',
                          backgroundColor: color,
                          borderRadius: 0,
                          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                          '&:hover': {
                            backgroundColor: color,
                            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                            transform: 'translateY(-2px)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                            {index === 7 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <Share sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Redes Sociales
                                </Typography>
                              </Box>
                            ) : index === 8 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <LocalOffer sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Popup Hero
                                </Typography>
                              </Box>
                            ) : index === 9 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <AttachMoney sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Balance Stripe
                                </Typography>
                              </Box>
                            ) : index === 10 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <Assessment sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Reporte de Ventas
                                </Typography>
                              </Box>
                            ) : index === 15 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <FontDownload sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Fuentes
                                </Typography>
                              </Box>
                            ) : index === 0 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <Inventory sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0,0.5)'
                                  }}
                                >
                                  Productos
                                </Typography>
                              </Box>
                            ) : index === 1 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <PhotoCamera sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Banner
                                </Typography>
                              </Box>
                            ) : index === 2 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <PhotoCamera sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Banner 2
                                </Typography>
                              </Box>
                            ) : index === 3 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <Inventory sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Inventario
                                </Typography>
                              </Box>
                            ) : index === 4 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Páginas
                                </Typography>
                              </Box>
                            ) : index === 5 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <Person sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Testimonios
                                </Typography>
                              </Box>
                            ) : index === 6 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <Star sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Productos Destacados
                                </Typography>
                              </Box>
                            ) : index === 12 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <ShoppingCart sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Min. Productos
                                </Typography>
                              </Box>
                            ) : (
                          <Typography
                            variant="h6"
                            sx={{
                              color: 'white',
                              fontWeight: 700,
                              textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                            }}
                          >
                            {index + 1}
                          </Typography>
                        )}
                      </Button>
                    </motion.div>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </motion.div>
      </Container>

      {/* Gestor de Fuentes */}
      <FontManager
        open={fontManagerOpen}
        onClose={() => setFontManagerOpen(false)}
        onFontSelect={(font) => {
          setSelectedFont(font);
          console.log('Fuente seleccionada:', font);
        }}
      />

          {/* Gestor de Fotos del Banner */}
          <BannerPhotoManager
            open={bannerPhotoManagerOpen}
            onClose={() => setBannerPhotoManagerOpen(false)}
          />

          {/* Gestor de Fotos del Banner 2 */}
          <Banner2PhotoManager
            open={banner2PhotoManagerOpen}
            onClose={() => setBanner2PhotoManagerOpen(false)}
          />

          {/* Gestor de Páginas */}
          <PagesManager
            open={pagesManagerOpen}
            onClose={() => setPagesManagerOpen(false)}
          />

          {/* Gestor de Mínimo de Productos */}
          <MinProductsManager
            open={minProductsManagerOpen}
            onClose={() => setMinProductsManagerOpen(false)}
          />

          {/* Gestor de Productos */}
          <ProductsManager
            open={productsManagerOpen}
            onClose={() => setProductsManagerOpen(false)}
          />

          {/* Gestor de Inventario */}
          <InventoryManager
            open={inventoryManagerOpen}
            onClose={() => setInventoryManagerOpen(false)}
          />

          {/* Gestor de Testimonios */}
        <TestimonialsManager
          open={testimonialsManagerOpen}
          onClose={() => setTestimonialsManagerOpen(false)}
        />
        <FeaturedProductsManager
          open={featuredProductsManagerOpen}
          onClose={() => setFeaturedProductsManagerOpen(false)}
        />

        {/* Gestor de Redes Sociales */}
        <SocialMediaManager
          open={socialMediaManagerOpen}
          onClose={() => setSocialMediaManagerOpen(false)}
        />

        {/* Gestor de Popup Hero */}
        <PopupHeroManager
          open={popupHeroManagerOpen}
          onClose={() => setPopupHeroManagerOpen(false)}
        />

        <StripeBalance
          open={stripeBalanceOpen}
          onClose={() => setStripeBalanceOpen(false)}
        />

        {/* Reporte de Ventas */}
        <Dialog
          open={salesReportOpen}
          onClose={() => setSalesReportOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assessment sx={{ color: '#8B4513' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#8B4513' }}>
                Reporte de Ventas
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#666' }}>
                📊 Reporte de Ventas
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
                Esta funcionalidad estará disponible próximamente.
              </Typography>
              <Typography variant="body2" sx={{ color: '#999' }}>
                Aquí podrás ver estadísticas de ventas, productos más vendidos, 
                ingresos por período y más métricas importantes.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setSalesReportOpen(false)}
              variant="contained"
              sx={{
                backgroundColor: '#8B4513',
                '&:hover': { backgroundColor: '#A0522D' }
              }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

        </Box>
      );
    };

    export default AdminDashboard;
