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
  AccountBalanceWallet,
  ShoppingBag,
  Person,
  Favorite,
  Close,
  Security,
  Login,
  PersonAdd
} from '@mui/icons-material';
import { useStore } from '../context/StoreContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { responsiveComponents, getResponsiveValue } from '../utils/responsiveDesign';

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const [authMenuOpen, setAuthMenuOpen] = useState(false);
  const { cart, getCartItemsCount } = useStore();
  const { t } = useTranslation();
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

  // Escuchar cambios de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          uid: user.uid
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const saveUserToFirestore = async (userData) => {
    try {
      // Verificar si el usuario ya existe
      const usersRef = collection(db, 'registeredUsers');
      const q = query(usersRef, where('uid', '==', userData.uid));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Usuario no existe, guardarlo
        await addDoc(usersRef, {
          uid: userData.uid,
          displayName: userData.displayName,
          email: userData.email,
          photoURL: userData.photoURL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          role: 'user',
          status: 'active'
        });
        console.log('✅ Usuario guardado en Firestore');
      } else {
        console.log('ℹ️ Usuario ya existe en Firestore');
      }
    } catch (error) {
      console.error('❌ Error guardando usuario en Firestore:', error);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      console.log('Iniciando autenticación con Google...');
      
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      console.log('✅ Usuario autenticado:', user.displayName);
      
      // Guardar usuario en Firestore
      await saveUserToFirestore({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL
      });
      
      // Redirigir a home después del login
      navigate('/');
      
      // El estado se actualizará automáticamente por onAuthStateChanged
    } catch (error) {
      console.error('❌ Error en autenticación:', error);
      
      // Mostrar mensaje de error al usuario
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('Usuario cerró el popup de autenticación');
      } else if (error.code === 'auth/popup-blocked') {
        console.log('Popup bloqueado por el navegador');
      } else {
        console.log('Error de autenticación:', error.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log('✅ Usuario deslogueado');
      // El estado se actualizará automáticamente por onAuthStateChanged
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
    }
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
    { label: t('navigation.home'), href: '/' },
    { label: t('navigation.services'), href: '/productos' },
    { label: t('navigation.about'), href: '/nosotros' },
    { label: t('navigation.contact'), href: '/contacto' },
    { label: "FAQ's", href: '/faq' }
  ];

  const drawer = (
    <Box sx={{ width: 250, backgroundColor: '#c8626d', height: '100%' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
          Delizukar
        </Typography>
        <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
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
                color: 'white',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white'
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
          className="header-mobile"
          sx={{
            backgroundColor: 'white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            zIndex: 9999,
            top: 0,
            // Sistema responsivo universal
            height: responsiveComponents.header.height,
            width: '100%',
            '& .MuiToolbar-root': {
              minHeight: responsiveComponents.header.height,
              padding: responsiveComponents.header.padding
            }
          }}
        >
          <Container maxWidth="lg">
            <Toolbar sx={{ 
              flexDirection: 'column', 
              py: 0.5, // reduce padding vertical aún más
              minHeight: '70px', // reduce altura total significativamente
              justifyContent: 'center'
            }}>
              {/* User Info - Top Right */}
              {user && (
                <Box sx={{ 
                  position: 'absolute', 
                  top: 8, 
                  right: 16, 
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  padding: '4px 8px',
                  borderRadius: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <Avatar
                    src={user.photoURL}
                    alt={user.displayName}
                    className="header-user-avatar"
                    sx={{ width: 24, height: 24 }}
                  />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#c8626d', 
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      maxWidth: '100px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {user.displayName}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleLogout}
                    sx={{
                      borderColor: '#c8626d',
                      color: '#c8626d',
                      fontSize: '0.6rem',
                      py: 0.3,
                      px: 0.8,
                      minWidth: 'auto',
                      minHeight: '20px',
                      '&:hover': {
                        backgroundColor: '#c8626d',
                        color: 'white',
                        borderColor: '#c8626d'
                      }
                    }}
                  >
                    {t('common.logout', 'Salir')}
                  </Button>
                </Box>
              )}

              {/* Authentication Buttons - Top Right (when not logged in) */}
              {!user && (
                <Box sx={{ 
                  position: 'absolute', 
                  top: 4, 
                  right: 16, 
                  zIndex: 10 
                }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }} className="header-auth-buttons">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Login />}
                      onClick={handleGoogleAuth}
                      className="header-auth-buttons"
                      sx={{
                        borderColor: '#c8626d',
                        color: '#c8626d',
                        fontSize: { xs: '0.5rem', sm: '0.6rem' },
                        py: { xs: 0.2, sm: 0.3 },
                        px: { xs: 0.6, sm: 0.8 },
                        minWidth: 'auto',
                        height: { xs: '24px', sm: '28px' },
                        '&:hover': {
                          backgroundColor: '#c8626d',
                          color: 'white',
                          borderColor: '#c8626d'
                        }
                      }}
                    >
                      {t('common.login', 'Iniciar Sesión')}
                    </Button>
                  </Box>
                </Box>
              )}

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
                {/* Mobile Menu Button - Left */}
                {isMobile && (
                  <Box sx={{ 
                    position: 'absolute', 
                    left: 0, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1 
                  }}>
                    <IconButton
                      onClick={handleDrawerToggle}
                      sx={{
                        color: '#eb8b8b',
                        '&:hover': {
                          backgroundColor: '#eb8b8b20'
                        }
                      }}
                    >
                      <MenuIcon />
                    </IconButton>
                  </Box>
                )}
                
                  {/* Search Icon - Left (desktop only) */}
                  {!isMobile && (
                    <Box sx={{ 
                      position: 'absolute', 
                      left: 0, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1 
                    }}>
                      <IconButton
                        sx={{
                          color: '#be8782',
                          '&:hover': {
                            backgroundColor: '#be878220'
                          }
                        }}
                      >
                        <Search />
                      </IconButton>
                    </Box>
                  )}

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
                        height: 100, // Made smaller for mobile
                        width: 'auto',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </Box>
                </motion.div>


                {/* Cart, Profile, Admin Icons and Auth Buttons - Right */}

                {/* User, Cart and Admin Icons - Horizontal layout - Right */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'row',
                  alignItems: 'center', 
                  gap: 0.2,
                  position: 'absolute',
                  right: 16
                }}>
                  {/* Profile - Left */}
                  <IconButton
                    className="user-icon-mobile"
                    onClick={handleProfileMenuOpen}
                    sx={{
                      color: '#c8626d',
                      fontSize: '1.5rem',
                      '&:hover': {
                        backgroundColor: '#c8626d20'
                      }
                    }}
                  >
                    <Person sx={{ fontSize: '1.5rem' }} />
                  </IconButton>

                  {/* Admin Panel - Right */}
                  <motion.div
                    className="admin-icon-mobile"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <IconButton
                      component="a"
                      href="/admin"
                      sx={{
                        color: '#c8626d',
                        fontSize: '1.5rem',
                        '&:hover': {
                          backgroundColor: '#c8626d20',
                          color: '#be8782'
                        }
                      }}
                    >
                      <Security sx={{ fontSize: '1.5rem' }} />
                    </IconButton>
                  </motion.div>

                  {/* Shopping Cart - Right */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <IconButton
                      onClick={handleCartClick}
                      className="header-cart-icon"
                      sx={{
                        color: '#be8782',
                        fontSize: '1.5rem',
                        '&:hover': {
                          backgroundColor: '#be878220'
                        }
                      }}
                    >
                      <Badge badgeContent={cartItemsCount} color="error">
                        <ShoppingBag sx={{ fontSize: '1.5rem' }} />
                      </Badge>
                    </IconButton>
                  </motion.div>
                  
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
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
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
                              backgroundColor: '#c8626d20',
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
                  {/* Mobile actions can go here if needed */}
                </Box>
              </Box>

                {/* Language Switcher - Bottom Left */}
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: 8, 
                  left: 16, 
                  zIndex: 10 
                }}>
                  <LanguageSwitcher />
                </Box>
            </Toolbar>
          </Container>
        </AppBar>
      </motion.div>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          zIndex: 10001,
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 250,
            zIndex: 10001
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
        sx={{
          zIndex: 10002
        }}
      >
        <MenuItem onClick={handleProfileMenuClose}>My Profile</MenuItem>
        <MenuItem onClick={handleProfileMenuClose}>My Orders</MenuItem>
        <MenuItem onClick={handleProfileMenuClose}>Settings</MenuItem>
        <MenuItem onClick={handleProfileMenuClose}>Logout</MenuItem>
      </Menu>
    </>
  );
};

export default Header;
