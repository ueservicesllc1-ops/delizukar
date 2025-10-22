import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
// import AOS from 'aos';
// import 'aos/dist/aos.css';

// Context
import { StoreProvider } from './context/StoreContext';
import { TitleConfigProvider } from './context/TitleConfigContext';
import { FeaturedProductsProvider } from './context/FeaturedProductsContext';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import HeroBanner from './components/HeroBanner';
import FeaturedProducts from './components/FeaturedProducts';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
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
import Login from './pages/Login';

// Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#8B4513',
      light: '#A0522D',
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
            <Header />
            
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/productos" element={<Products />} />
              <Route path="/producto/:id" element={<ProductDetail />} />
              <Route path="/carrito" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/mi-cuenta" element={<UserDashboard />} />
              <Route path="/contacto" element={<Contacto />} />
              <Route path="/nosotros" element={<Nosotros />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/productos" element={<AdminProducts />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/terms-service" element={<TermsService />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/allergy" element={<Allergy />} />
              <Route path="/shipping" element={<Shipping />} />
              <Route path="/cookie-care" element={<CookieCare />} />
            </Routes>
            
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
