import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';
// import AOS from 'aos';
// import 'aos/dist/aos.css';

// Import i18n configuration
import './i18n';

// Context
import { StoreProvider } from './context/StoreContext';
import { TitleConfigProvider } from './context/TitleConfigContext';
import { FeaturedProductsProvider } from './context/FeaturedProductsContext';

// Components
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import Terms from './pages/Terms';
import TermsService from './pages/TermsService';
import FAQ from './pages/FAQ';
import Allergy from './pages/Allergy';
import Shipping from './pages/Shipping';
import CookieCare from './pages/CookieCare';
import Nosotros from './pages/Nosotros';
import Contacto from './pages/Contacto';

// Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#c8626d',
      light: '#b5555a',
      dark: '#654321',
      contrastText: '#fff'
    },
    secondary: {
      main: '#FF6B35',
      light: '#FF8A65',
      dark: '#E64A19',
      contrastText: '#fff'
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff'
    },
    text: {
      primary: '#333333',
      secondary: '#666666'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 800
    },
    h2: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 700
    },
    h3: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 600
    },
    h4: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 600
    },
    h5: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 500
    },
    h6: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 500
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 25
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12
          }
        }
      }
    }
  }
});

// Inicializar AOS
// AOS.init({
//   duration: 800,
//   easing: 'ease-in-out',
//   once: true,
//   offset: 100
// });

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
            <StoreProvider>
              <TitleConfigProvider>
                <FeaturedProductsProvider>
                  <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <div className="App">
            <Box sx={{ 
              paddingTop: { xs: '70px', sm: '70px', md: '70px' }
            }}>
              <Routes>
              <Route path="/" element={
                <>
                  <Header />
                  <Home />
                </>
              } />
              <Route path="/productos" element={
                <>
                  <Header />
                  <Products />
                </>
              } />
              <Route path="/producto/:id" element={
                <>
                  <Header />
                  <ProductDetail />
                </>
              } />
              <Route path="/carrito" element={
                <>
                  <Header />
                  <Cart />
                </>
              } />
              <Route path="/checkout" element={
                <>
                  <Header />
                  <Checkout />
                </>
              } />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/mi-cuenta" element={
                <>
                  <Header />
                  <UserDashboard />
                </>
              } />
              <Route path="/contacto" element={
                <>
                  <Header />
                  <Contacto />
                </>
              } />
              <Route path="/nosotros" element={
                <>
                  <Header />
                  <Nosotros />
                </>
              } />
              <Route path="/admin" element={
                <>
                  <Header />
                  <AdminDashboard />
                </>
              } />
              <Route path="/admin/productos" element={
                <>
                  <Header />
                  <AdminProducts />
                </>
              } />
              <Route path="/terms" element={
                <>
                  <Header />
                  <Terms />
                </>
              } />
              <Route path="/terms-service" element={
                <>
                  <Header />
                  <TermsService />
                </>
              } />
              <Route path="/faq" element={
                <>
                  <Header />
                  <FAQ />
                </>
              } />
              <Route path="/allergy" element={
                <>
                  <Header />
                  <Allergy />
                </>
              } />
              <Route path="/shipping" element={
                <>
                  <Header />
                  <Shipping />
                </>
              } />
              <Route path="/cookie-care" element={
                <>
                  <Header />
                  <CookieCare />
                </>
              } />
              </Routes>
            </Box>
            
            <Footer />
            
            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#333',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '16px'
                },
                success: {
                  iconTheme: {
                    primary: '#4CAF50',
                    secondary: '#fff'
                  }
                },
                error: {
                  iconTheme: {
                    primary: '#f44336',
                    secondary: '#fff'
                  }
                }
              }}
            />
          </div>
                  </Router>
                </FeaturedProductsProvider>
              </TitleConfigProvider>
            </StoreProvider>
    </ThemeProvider>
  );
}

export default App;
