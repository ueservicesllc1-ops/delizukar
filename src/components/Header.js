import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
  Drawer,
  List,
  ListItem,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  Avatar,
  Dialog,
  DialogContent,
  TextField,
  InputAdornment,
  Chip,
  ListItemAvatar,
  ListItemText
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search,
  ShoppingBag,
  Person,
  Security,
  Login,
  Storefront,
  LocalShipping,
  Close,
  ArrowForward
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
import { useLanguage } from '../context/LanguageContext';
import { useShoppingExperience } from '../context/ShoppingExperienceContext';
import { startAutoTranslate, stopAutoTranslate } from '../utils/applyTranslations';
import { translateText } from '../services/translateService';
import HeaderExperienceFlyer from './HeaderExperienceFlyer';
import { usePopupsVisibility } from '../context/PopupsVisibilityContext';
import { PRODUCT_TRANSLATIONS } from '../pages/Products';

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const [translatingLang, setTranslatingLang] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { getCartItemsCount, products } = useStore();
  const { language, setLanguage } = useLanguage();
  const { visibility } = usePopupsVisibility();

  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (userData) => {
      if (userData) {
        setUser({
          displayName: userData.displayName,
          email: userData.email,
          photoURL: userData.photoURL,
          uid: userData.uid
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const labels = {
    es: { 
      home: 'Inicio', products: 'Galletas', sweetbox: 'Cajas', about: 'Nosotros', contact: 'Contacto', faq: 'FAQ',
      logout: 'Salir', login: 'Iniciar Sesión', profile: 'Mi Perfil', orders: 'Mis Pedidos', settings: 'Configuración',
      cookieWeightChip: 'Entre 180g y 200g de puro antojo en cada galleta'
    },
    en: { 
      home: 'Home', products: 'Cookies', sweetbox: 'Boxes', about: 'About Us', contact: 'Contact', faq: 'FAQ',
      logout: 'Logout', login: 'Sign In', profile: 'My Profile', orders: 'My Orders', settings: 'Settings',
      cookieWeightChip: 'Between 180g and 200g of pure craving in every cookie'
    }
  };
  const L = labels[language] || labels.es;
  const menuItems = [
    { label: L.home, href: '/' },
    { label: L.sweetbox, href: '/sweet-boxes' },
    { label: L.products, href: '/productos' },
    { label: L.about, href: '/nosotros' },
    { label: L.contact, href: '/contacto' },
    { label: L.faq, href: '/faq' }
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const saveUserToFirestore = async (userData) => {
    const usersRef = collection(db, 'registeredUsers');
    const q = query(usersRef, where('uid', '==', userData.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
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
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const authUser = result.user;
      await saveUserToFirestore({
        uid: authUser.uid,
        displayName: authUser.displayName,
        email: authUser.email,
        photoURL: authUser.photoURL
      });
      navigate('/');
    } catch (error) {
      console.error('Error en autenticación:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleCartClick = () => {
    navigate('/carrito');
  };

  const handleLanguageChange = async (lang) => {
    setLanguage(lang);
    if (lang === 'es') {
      stopAutoTranslate();
      setTranslatingLang(false);
    } else {
      try {
        setTranslatingLang(true);
        await translateText('Hola', lang, 'es');
        startAutoTranslate(lang, 'es');
      } catch {
        alert('No se pudo traducir. Verifica backend y API key.');
      } finally {
        setTranslatingLang(false);
      }
    }
  };

  if (location.pathname === '/checkout') {
    return null;
  }

  const { modality, isPickup, isShipping, openModal } = useShoppingExperience();

  const ExperienceBar = () => {
    const isEn = language === 'en';
    const label = isPickup
      ? (isEn ? 'LOCAL PICKUP — CLIFTON, NJ' : 'RECOGIDA LOCAL — CLIFTON, NJ')
      : isShipping
      ? (isEn ? 'SHIPPING — DELIVERED TO YOU' : 'ENVÍO — DIRECTO A TU PUERTA')
      : (isEn ? 'CHOOSE EXPERIENCE: PICKUP OR SHIPPING' : 'ELIGE EXPERIENCIA: RECOGIDA O ENVÍO');

    const buttonText = modality
      ? (isEn ? 'CHANGE' : 'CAMBIAR')
      : (isEn ? 'SELECT' : 'ELEGIR');

    const showFlyers = visibility.showPickupFlyer !== false || visibility.showShippingFlyer !== false;

    return (
      <Box
        sx={{
          backgroundColor: '#c8626d',
          color: '#ffffff',
          py: { xs: 0.6, sm: 0.7, md: 0.8 },
          px: { xs: 1.5, sm: 2 },
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'center',
          gap: { xs: 0.6, md: 2.5 },
          fontSize: { xs: '0.7rem', sm: '0.8rem' },
          fontWeight: 700,
          letterSpacing: '0.4px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          zIndex: 10
        }}
      >
        {showFlyers && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 0.8, md: 1.2 } }}>
            {visibility.showPickupFlyer !== false && <HeaderExperienceFlyer type="pickup" isMobile={isMobile} />}
            {visibility.showShippingFlyer !== false && <HeaderExperienceFlyer type="shipping" isMobile={isMobile} />}
          </Box>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 0.8, sm: 1.2 }, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'nowrap' }}>
          {isPickup && <Storefront sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' }, color: '#ffe6e8' }} />}
          {isShipping && <LocalShipping sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' }, color: '#ffe6e8' }} />}
          <span>{label}</span>
        </Box>
        <Box sx={{ opacity: 0.6, mx: 0.2 }}>|</Box>
        <Button
          size="small"
          onClick={openModal}
          sx={{
            color: '#ffffff',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            textTransform: 'uppercase',
            fontWeight: 800,
            fontSize: { xs: '0.64rem', sm: '0.72rem' },
            py: 0.15,
            px: { xs: 1, sm: 1.4 },
            minWidth: 'auto',
            borderRadius: '999px',
            border: '1px solid rgba(255, 255, 255, 0.45)',
            '&:hover': {
              backgroundColor: '#ffffff',
              color: '#c8626d'
            },
            transition: 'all 0.2s ease'
          }}
        >
          {buttonText}
        </Button>
        </Box>
      </Box>
    );
  };

  const drawer = (
    <Box sx={{ width: 260, height: '100%', backgroundColor: '#c8626d', color: 'white', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Delizukar</Typography>
        <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
          <MenuIcon />
        </IconButton>
      </Box>

      {/* Modalidad de Compra en Drawer */}
      <Box sx={{ mx: 2, mb: 1.5, p: 1.5, backgroundColor: 'rgba(0,0,0,0.14)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)' }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
          {language === 'en' ? 'Shopping Mode' : 'Modo de Compra'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isPickup ? '🏪 PICKUP' : isShipping ? '📦 SHIPPING' : (language === 'en' ? 'Not chosen' : 'Sin elegir')}
          </Typography>
          <Button
            size="small"
            onClick={() => {
              setMobileOpen(false);
              openModal();
            }}
            sx={{
              color: '#c8626d',
              backgroundColor: '#ffffff',
              fontSize: '0.7rem',
              fontWeight: 800,
              py: 0.2,
              px: 1,
              borderRadius: '999px',
              minWidth: 'auto',
              '&:hover': { backgroundColor: '#fff0f2' }
            }}
          >
            {language === 'en' ? 'CHANGE' : 'CAMBIAR'}
          </Button>
        </Box>
      </Box>

      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <Button
              onClick={() => {
                navigate(item.href);
                setMobileOpen(false);
              }}
              sx={{
                width: '100%',
                justifyContent: 'flex-start',
                color: 'white',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                px: 2,
                py: 1,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.18)'
                }
              }}
            >
              {item.label}
            </Button>
          </ListItem>
        ))}
      </List>
      <Box sx={{ px: 2, pb: 3 }}>
        <Box
          component="select"
          aria-label="Seleccionar idioma"
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          disabled={translatingLang}
          sx={{
            width: '100%',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.7)',
            backgroundColor: 'rgba(255,255,255,0.9)',
            color: '#c8626d',
            fontWeight: 600,
            fontSize: '0.9rem',
            px: 2,
            py: 1.2,
            outline: 'none',
            boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
          }}
        >
          <option value="en">EN</option>
          <option value="es">ES</option>
        </Box>
      </Box>
    </Box>
  );

  const LanguageSelect = (props) => (
    <Box
      component="select"
      aria-label="Seleccionar idioma"
      value={language}
      onChange={(e) => handleLanguageChange(e.target.value)}
      disabled={translatingLang}
      sx={{
        borderRadius: '999px',
        border: '1px solid #c8626d',
        backgroundColor: '#ffffff',
        color: '#c8626d',
        fontWeight: 600,
        fontSize: '0.85rem',
        px: 2,
        py: 0.6,
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        outline: 'none',
        ...props.sx
      }}
    >
      <option value="en">EN</option>
      <option value="es">ES</option>
    </Box>
  );

  const renderMobileToolbar = () => (
          <Toolbar disableGutters sx={{ position: 'relative', flexDirection: 'column', gap: 1, px: 2, py: 1.2, minHeight: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <IconButton onClick={handleDrawerToggle} sx={{ color: '#c8626d', position: 'absolute', left: 8 }}>
          <MenuIcon />
        </IconButton>


        <motion.a href="/" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '6px' }}>
          <Box component="img" src="/LOGO.png" alt="Delizukar Logo" sx={{ height: 95, width: 'auto' }} />
        </motion.a>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, position: 'absolute', right: 8, top: 8 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              onClick={() => setSearchOpen(true)}
              aria-label={language === 'en' ? 'Search cookies' : 'Buscar galletas'}
              sx={{ color: '#c8626d' }}
            >
              <Search />
            </IconButton>
            <IconButton
              onClick={user ? (e) => setAnchorEl(e.currentTarget) : handleGoogleAuth}
              sx={{ color: '#c8626d' }}
            >
              {user ? <Person /> : <Login />}
            </IconButton>
            <IconButton onClick={handleCartClick} sx={{ color: '#be8782' }}>
              <Badge badgeContent={getCartItemsCount()} color="error">
                <ShoppingBag />
              </Badge>
            </IconButton>
          </Box>
          <LanguageSelect sx={{ px: 1.5, py: 0.4, fontSize: '0.75rem' }} />
        </Box>
      </Box>


    </Toolbar>
  );

  const renderDesktopToolbar = () => (
    <Toolbar
      disableGutters
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: { md: 1.5, lg: 2 },
        px: { md: 2, lg: 6 },
        py: { md: 1.8, lg: 2.6 },
        minHeight: 'auto'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: { md: 1.5, lg: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { md: 1, lg: 1.5 }, flex: 1, justifyContent: 'flex-start' }}>
          <IconButton
            onClick={() => setSearchOpen(true)}
            aria-label={language === 'en' ? 'Search cookies' : 'Buscar galletas'}
            sx={{
              color: '#c8626d',
              backgroundColor: 'rgba(200, 98, 109, 0.08)',
              ml: { md: 0.5, lg: 1 },
              mr: { md: 1, lg: 2 },
              '&:hover': {
                backgroundColor: 'rgba(200, 98, 109, 0.16)',
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s ease'
            }}
            title={language === 'en' ? 'Search cookies' : 'Buscar galletas'}
          >
            <Search />
          </IconButton>
        </Box>

        <motion.a
          href="/"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ display: 'flex', justifyContent: 'center', flexShrink: 0 }}
        >
          <Box 
            component="img" 
            src="/LOGO.png" 
            alt="Delizukar Logo" 
            sx={{ 
              height: { md: 120, lg: 155 }, 
              width: 'auto', 
              maxWidth: '100%', 
              objectFit: 'contain' 
            }} 
          />
        </motion.a>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: { md: 1.5, lg: 2 },
          justifyContent: 'flex-end', 
          flex: 1
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 0.5,
            justifyContent: 'center', 
            minWidth: { md: '180px', lg: '240px' } 
          }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { md: 1.2, lg: 1.6 } }}>
            {user ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar src={user.photoURL} alt={user.displayName} sx={{ width: 36, height: 36 }} />
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: '#c8626d', maxWidth: { md: '120px', lg: '160px' }, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}
                >
                  {user.displayName}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleLogout}
                  sx={{
                    borderColor: '#c8626d',
                    color: '#c8626d',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: '#c8626d',
                      color: 'white',
                      borderColor: '#c8626d'
                    }
                  }}
                >
                  {L.logout}
                </Button>
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ color: '#c8626d' }}>
                  <Person sx={{ fontSize: '1.8rem' }} />
                </IconButton>
              </Box>
            ) : (
              <Button
                variant="outlined"
                startIcon={<Login />}
                onClick={handleGoogleAuth}
                sx={{
                  borderColor: '#c8626d',
                  color: '#c8626d',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: '#c8626d',
                    color: 'white',
                    borderColor: '#c8626d'
                  }
                }}
              >
                {L.login}
              </Button>
            )}
            {user && (user.email === 'ueservicesllc1@gmail.com' || user.email === 'florvazdi@gmail.com') && (
              <IconButton component="a" href="/admin" sx={{ color: '#c8626d' }}>
                <Security sx={{ fontSize: '1.8rem' }} />
              </IconButton>
            )}
            <IconButton onClick={handleCartClick} sx={{ color: '#be8782' }}>
              <Badge badgeContent={getCartItemsCount()} color="error">
                <ShoppingBag />
              </Badge>
            </IconButton>
          </Box>
          <LanguageSelect sx={{ px: 1.5, py: 0.4, fontSize: '0.8rem' }} />
        </Box>
      </Box>
    </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: { md: 1.5, lg: 2.5 },
          width: '100%'
        }}
      >
        {menuItems.map((item) => (
          <Button
            key={item.label}
            onClick={() => navigate(item.href)}
            sx={{
              color: '#eb8b8b',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { md: '1rem', lg: '1.05rem' },
              px: { md: 2.2, lg: 2.8 },
              py: { md: 0.8, lg: 1 },
              borderRadius: '999px',
              '&:hover': {
                backgroundColor: '#c8626d20'
              },
              backgroundColor: location.pathname === item.href ? '#c8626d15' : 'transparent',
              border: location.pathname === item.href ? '1px solid #c8626d40' : 'none'
            }}
          >
            {item.label}
          </Button>
        ))}
      </Box>
    </Toolbar>
  );

  return (
    <div data-no-translate>
      <AppBar
        position="static"
        sx={{
          backgroundColor: '#ffece5',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        {ExperienceBar()}
        {isMobile ? renderMobileToolbar() : renderDesktopToolbar()}
      </AppBar>

      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          zIndex: (theme) => theme.zIndex.drawer + 2,
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 260,
            zIndex: (theme) => theme.zIndex.drawer + 2,
            top: 0
          }
        }}
      >
        {drawer}
      </Drawer>

      {user && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => setAnchorEl(null)}>{L.profile}</MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>{L.orders}</MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>{L.settings}</MenuItem>
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              handleLogout();
            }}
          >
            {L.logout}
          </MenuItem>
        </Menu>
      )}

      {/* Modal de Búsqueda interactivo */}
      <Dialog
        open={searchOpen}
        onClose={() => {
          setSearchOpen(false);
          setSearchQuery('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: { xs: 2, sm: 2.5 },
            position: 'relative',
            mt: { xs: 4, sm: 8 },
            verticalAlign: 'top',
            border: '2px solid rgba(200, 98, 109, 0.3)',
            boxShadow: '0 20px 45px rgba(0,0,0,0.2)'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#c8626d', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Search sx={{ color: '#c8626d' }} />
            {language === 'en' ? 'Search Cookies' : 'Buscar Galletas'}
          </Typography>
          <IconButton
            size="small"
            onClick={() => {
              setSearchOpen(false);
              setSearchQuery('');
            }}
            sx={{
              color: '#c8626d',
              backgroundColor: 'rgba(200, 98, 109, 0.08)',
              '&:hover': { backgroundColor: 'rgba(200, 98, 109, 0.18)' }
            }}
          >
            <Close />
          </IconButton>
        </Box>

        {/* Input de búsqueda */}
        <TextField
          fullWidth
          autoFocus
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchQuery.trim()) {
              setSearchOpen(false);
              navigate(`/productos?search=${encodeURIComponent(searchQuery.trim())}`);
            }
          }}
          placeholder={language === 'en' ? 'Search by name, flavor or ingredient...' : 'Buscar por nombre, sabor o ingrediente...'}
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#c8626d' }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <Close fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
            sx: {
              borderRadius: '14px',
              backgroundColor: '#fafafa',
              '&.Mui-focused fieldset': {
                borderColor: '#c8626d'
              }
            }
          }}
        />

        {/* Sugerencias rápidas si no ha escrito nada */}
        {!searchQuery.trim() && (
          <Box sx={{ mt: 2.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 1 }}>
              {language === 'en' ? 'Popular searches' : 'Búsquedas populares'}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {['Chocolate Chip', 'Lotus Biscoff', 'Dubai Pistacho', 'Red Velvet', 'Ferrero'].map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  clickable
                  onClick={() => setSearchQuery(tag)}
                  sx={{
                    backgroundColor: '#ffece5',
                    color: '#c8626d',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    '&:hover': { backgroundColor: '#ffd7cc' }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Lista de resultados en tiempo real */}
        {searchQuery.trim() && (
          <Box sx={{ mt: 2, maxHeight: '380px', overflowY: 'auto' }}>
            {(() => {
              const q = searchQuery.trim().toLowerCase();
              const filtered = (products || []).filter((p) => {
                if (p.active === false) return false;
                const orig = (p.name || '').toLowerCase();
                const es = (PRODUCT_TRANSLATIONS?.es?.[p.name]?.name || '').toLowerCase();
                const en = (PRODUCT_TRANSLATIONS?.en?.[p.name]?.name || '').toLowerCase();
                const desc = (p.description || '').toLowerCase();
                const cat = (p.category || '').toLowerCase();
                return orig.includes(q) || es.includes(q) || en.includes(q) || desc.includes(q) || cat.includes(q);
              });

              if (filtered.length === 0) {
                return (
                  <Box sx={{ py: 4, textAlign: 'center', color: '#999' }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {language === 'en' ? 'No cookies found matching your search' : 'No se encontraron galletas con esa búsqueda'}
                    </Typography>
                    <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                      {language === 'en' ? 'Try searching for another flavor' : 'Intenta buscar con otro sabor o nombre'}
                    </Typography>
                  </Box>
                );
              }

              return (
                <List sx={{ p: 0 }}>
                  {filtered.map((item) => {
                    const translatedName = PRODUCT_TRANSLATIONS?.[language]?.[item.name]?.name || item[`name_${language}`] || item.name;
                    return (
                      <ListItem
                        key={item.id}
                        button
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                          if (item.category === 'boxes') {
                            navigate('/cajas');
                          } else {
                            navigate(`/productos?id=${encodeURIComponent(item.id)}`);
                          }
                        }}
                        sx={{
                          borderRadius: '12px',
                          mb: 1,
                          backgroundColor: '#fafafa',
                          border: '1px solid #f0f0f0',
                          '&:hover': {
                            backgroundColor: '#fff3f0',
                            borderColor: '#c8626d'
                          },
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          py: 1
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: 50 }}>
                          <Avatar
                            src={item.image}
                            alt={translatedName}
                            variant="rounded"
                            sx={{ width: 48, height: 48, backgroundColor: '#ffffff', border: '1px solid #eee' }}
                          />
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography sx={{ fontWeight: 700, color: '#333', fontSize: '0.92rem' }}>
                              {translatedName}
                            </Typography>
                          }
                          secondary={
                            <Typography sx={{ color: '#c8626d', fontWeight: 800, fontSize: '0.85rem' }}>
                              ${Number(item.price || 0).toFixed(2)}
                            </Typography>
                          }
                        />
                        <ArrowForward sx={{ color: '#c8626d', fontSize: '1.2rem' }} />
                      </ListItem>
                    );
                  })}
                </List>
              );
            })()}
          </Box>
        )}
      </Dialog>
    </div>
  );
};

export default Header;
