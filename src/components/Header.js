import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  Avatar
} from '@mui/material';
import {
  ShoppingBasket,
  Menu as MenuIcon,
  Search,
  Person,
  Favorite,
  Close,
  Security,
  Login,
  PersonAdd
} from '@mui/icons-material';
import { useStore } from '../context/StoreContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const [authMenuOpen, setAuthMenuOpen] = useState(false);
  const { cart, getCartItemsCount } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGoogleAuth = async () => {
    try {
      // Aquí se implementará la autenticación con Google
      console.log('Iniciando autenticación con Google...');
      // Por ahora, simulamos un usuario
      setUser({
        displayName: 'Usuario Google',
        email: 'usuario@gmail.com',
        photoURL: 'https://via.placeholder.com/40'
      });
      setAuthMenuOpen(false);
    } catch (error) {
      console.error('Error en autenticación:', error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAuthMenuOpen(false);
  };

  // No mostrar header en la página de checkout
  if (location.pathname === '/checkout') {
    return null;
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCartClick = () => {
    navigate('/carrito');
  };

  const cartItemsCount = getCartItemsCount();

  const menuItems = [
    { label: 'HOME', href: '/' },
    { label: 'ORDER HERE', href: '/productos' },
    { label: 'OUR HISTORY', href: '/nosotros' },
    { label: 'CONTACT US', href: '/contacto' },
    { label: "FAQ's", href: '/faq' }
  ];

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#eb8b8b' }}>
          Delizukar
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          <Close />
        </IconButton>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.label} sx={{ py: 1 }}>
            <Button
              href={item.href}
              sx={{
                width: '100%',
                justifyContent: 'flex-start',
                color: '#eb8b8b',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: '#8B451320',
                  color: '#8B4513'
                }
              }}
            >
              {item.label}
            </Button>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AppBar
          position="fixed"
          sx={{
            backgroundColor: 'white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            zIndex: 1000
          }}
        >
          <Container maxWidth="lg">
            <Toolbar sx={{ 
              flexDirection: 'column', 
              py: 1, // reduce padding vertical
              minHeight: '92px', // reduce altura total
              justifyContent: 'center'
            }}>
              {/* Authentication Buttons - Top Right */}
              <Box sx={{ 
                position: 'absolute', 
                top: 8, 
                right: 16, 
                zIndex: 10 
              }}>
                {!user ? (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Login />}
                      onClick={handleGoogleAuth}
                      sx={{
                        borderColor: '#c8626d',
                        color: '#c8626d',
                        fontSize: '0.7rem',
                        py: 0.5,
                        px: 1,
                        minWidth: 'auto',
                        '&:hover': {
                          backgroundColor: '#c8626d',
                          color: 'white',
                          borderColor: '#c8626d'
                        }
                      }}
                    >
                      Iniciar
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<PersonAdd />}
                      onClick={handleGoogleAuth}
                      sx={{
                        backgroundColor: '#8B4513',
                        fontSize: '0.7rem',
                        py: 0.5,
                        px: 1,
                        minWidth: 'auto',
                        '&:hover': {
                          backgroundColor: '#A0522D'
                        }
                      }}
                    >
                      Registro
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={user.photoURL}
                      alt={user.displayName}
                      sx={{ width: 28, height: 28 }}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleLogout}
                      sx={{
                        borderColor: '#c8626d',
                        color: '#c8626d',
                        fontSize: '0.7rem',
                        py: 0.5,
                        px: 1,
                        minWidth: 'auto',
                        '&:hover': {
                          backgroundColor: '#c8626d',
                          color: 'white',
                          borderColor: '#c8626d'
                        }
                      }}
                    >
                      Salir
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Logo with Search and User Icons */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: '100%',
                marginBottom: '8px',
                mt: 1,
                position: 'relative'
              }}>
                {/* Search Icon - Left */}
                <IconButton
                  sx={{
                    color: '#be8782',
                    position: 'absolute',
                    left: 0,
                    '&:hover': {
                      backgroundColor: '#be878220'
                    }
                  }}
                >
                  <Search />
                </IconButton>

                {/* Logo - Center */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Box
                    component="a"
                    href="/"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      textDecoration: 'none'
                    }}
                  >
                    <Box
                      component="img"
                      src="/LOGO.png"
                      alt="Delizukar Logo"
                      sx={{
                        height: 144, // Reduced by 10% (160 * 0.9 = 144)
                        width: 'auto',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </Box>
                </motion.div>

                {/* Cart, Profile, Admin Icons and Auth Buttons - Right */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  position: 'absolute',
                  right: 0
                }}>
                  {/* Shopping Cart */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <IconButton
                      onClick={handleCartClick}
                      sx={{
                        color: '#be8782',
                        '&:hover': {
                          backgroundColor: '#be878220'
                        }
                      }}
                    >
                      <Badge badgeContent={cartItemsCount} color="error">
                        <ShoppingBasket />
                      </Badge>
                    </IconButton>
                  </motion.div>

                  {/* Admin Panel - Shield Icon */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <IconButton
                      component="a"
                      href="/admin"
                      sx={{
                        color: '#8B4513',
                        '&:hover': {
                          backgroundColor: '#8B451320',
                          color: '#be8782'
                        }
                      }}
                    >
                      <Security />
                    </IconButton>
                  </motion.div>

                  {/* Profile */}
                  <IconButton
                    onClick={handleProfileMenuOpen}
                    sx={{
                      color: '#8B4513',
                      '&:hover': {
                        backgroundColor: '#8B451320'
                      }
                    }}
                  >
                    <Person />
                  </IconButton>
                </Box>
              </Box>

              {/* Navigation and Actions Container */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                width: '100%',
                flexWrap: 'wrap',
                gap: 2
              }}>
                {/* Desktop Navigation - Centered */}
                {!isMobile && (
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    {menuItems.map((item) => (
                        <Button
                          key={item.label}
                          href={item.href}
                          sx={{
                            color: '#eb8b8b',
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '1rem',
                            px: 2,
                            py: 1,
                            borderRadius: '25px',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              backgroundColor: '#8B451320',
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                        {item.label}
                      </Button>
                    ))}
                  </Box>
                )}

                {/* Actions - Hidden on desktop, shown on mobile */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>

                {/* Mobile Menu Button */}
                {isMobile && (
                  <IconButton
                    edge="end"
                    onClick={handleDrawerToggle}
                    sx={{
                      color: '#eb8b8b',
                      ml: 1
                    }}
                  >
                    <MenuIcon />
                  </IconButton>
                )}
                </Box>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      </motion.div>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 250
          }
        }}
      >
        {drawer}
      </Drawer>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfileMenuClose}>Mi Perfil</MenuItem>
        <MenuItem onClick={handleProfileMenuClose}>Mis Pedidos</MenuItem>
        <MenuItem onClick={handleProfileMenuClose}>Configuración</MenuItem>
        <MenuItem onClick={handleProfileMenuClose}>Cerrar Sesión</MenuItem>
      </Menu>
    </>
  );
};

export default Header;
