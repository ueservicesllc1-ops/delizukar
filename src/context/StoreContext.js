import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

const StoreContext = createContext();

const initialState = {
  products: [],
  productsLoading: true,
  initialProducts: [
    {
      id: '1',
      name: 'Chocolate Chip Clásica',
      name_es: 'Chocolate Chip Clásica',
      name_en: 'Classic Chocolate Chip',
      price: 12.99,
      image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      rating: 4.8,
      reviews: 124,
      bestSeller: true,
      isNew: false,
      featured: true,
      active: true,
      category: 'chocolate',
      description: 'Nuestra galleta de chocolate chip clásica, horneada con ingredientes premium.',
      description_es: 'Nuestra galleta de chocolate chip clásica, horneada con ingredientes premium.',
      description_en: 'Our classic chocolate chip cookie, baked with premium ingredients.'
    },
    {
      id: '2',
      name: 'Vainilla Premium',
      name_es: 'Vainilla Premium',
      name_en: 'Premium Vanilla',
      price: 11.99,
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      rating: 4.6,
      reviews: 89,
      bestSeller: true,
      isNew: true,
      featured: true,
      active: true,
      category: 'vainilla',
      description: 'Galleta de vainilla con un toque especial de canela.',
      description_es: 'Galleta de vainilla con un toque especial de canela.',
      description_en: 'Vanilla cookie with a special touch of cinnamon.'
    },
    {
      id: '3',
      name: 'Oatmeal Raisin',
      name_es: 'Avena y Pasas',
      name_en: 'Oatmeal Raisin',
      price: 13.99,
      image: 'https://images.unsplash.com/photo-1590086783191-a0694c7d1e6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      rating: 4.7,
      reviews: 67,
      bestSeller: true,
      isNew: false,
      featured: true,
      active: true,
      category: 'especiales',
      description: 'Galleta de avena con pasas, perfecta para el desayuno.',
      description_es: 'Galleta de avena con pasas, perfecta para el desayuno.',
      description_en: 'Oatmeal cookie with raisins, perfect for breakfast.'
    },
    {
      id: '4',
      name: 'Chocolate Deluxe',
      name_es: 'Chocolate Deluxe',
      name_en: 'Chocolate Deluxe',
      price: 14.99,
      image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      rating: 4.9,
      reviews: 156,
      bestSeller: true,
      isNew: false,
      featured: true,
      active: true,
      category: 'chocolate',
      description: 'Una galleta intensa con cuatro tipos de chocolate, textura cremosa y un sabor profundo para los verdaderos amantes del cacao.',
      description_es: 'Una galleta intensa con cuatro tipos de chocolate, textura cremosa y un sabor profundo para los verdaderos amantes del cacao.',
      description_en: 'An intense cookie with four types of chocolate, creamy texture, and deep flavor for true cocoa lovers.'
    },
    {
      id: '5',
      name: 'Sweet Box – 4 Cookies',
      name_es: 'Sweet Box – 4 Cookies',
      name_en: 'Sweet Box – 4 Cookies',
      price: 52.00,
      image: '/assets/images/caja_generica.png',
      rating: 5.0,
      reviews: 0,
      bestSeller: false,
      isNew: true,
      featured: true,
      active: true,
      category: 'boxes',
      description: 'Arma tu caja con 4 galletas estilo NY (200g c/u). Venta mínima de 4 unidades.',
      description_es: 'Arma tu caja con 4 galletas estilo NY (200g c/u). Venta mínima de 4 unidades.',
      description_en: 'Build your box with 4 NY-style cookies (200g each). Minimum purchase is 4 cookies.'
    },
    {
      id: '6',
      name: 'Sweet Box – 6 Cookies',
      name_es: 'Sweet Box – 6 Cookies',
      name_en: 'Sweet Box – 6 Cookies',
      price: 74.10,
      image: '/assets/images/caja_generica.png',
      rating: 5.0,
      reviews: 0,
      bestSeller: false,
      isNew: true,
      featured: true,
      active: true,
      category: 'boxes',
      description: 'Arma tu caja con 6 galletas estilo NY (200g c/u). Incluye un 5% de descuento.',
      description_es: 'Arma tu caja con 6 galletas estilo NY (200g c/u). Incluye un 5% de descuento.',
      description_en: 'Build your box with 6 NY-style cookies (200g each). Includes a 5% discount.'
    },
    {
      id: '7',
      name: 'Deluxe Sweet Box – 12 Cookies',
      name_es: 'Deluxe Sweet Box – 12 Cookies',
      name_en: 'Deluxe Sweet Box – 12 Cookies',
      price: 140.40,
      image: '/assets/images/caja_generica.png',
      rating: 5.0,
      reviews: 0,
      bestSeller: false,
      isNew: true,
      featured: true,
      active: true,
      category: 'boxes',
      description: 'Perfecto para compartir o regalar. 12 galletas estilo NY (200g c/u). Incluye un 10% de descuento.',
      description_es: 'Perfecto para compartir o regalar. 12 galletas estilo NY (200g c/u). Incluye un 10% de descuento.',
      description_en: 'Perfect for sharing or gifting. 12 NY-style cookies (200g each). Includes a 10% discount.'
    },
    {
      id: '8',
      name: 'Gift Message + Premium Card',
      name_es: 'Mensaje de Regalo + Tarjeta Premium',
      name_en: 'Gift Message + Premium Card',
      price: 9.00,
      image: '/assets/images/caja_generica.png',
      rating: 5.0,
      reviews: 0,
      bestSeller: false,
      isNew: true,
      featured: false,
      active: true,
      category: 'regalo',
      description: 'Añade un mensaje personalizado dentro de tu caja. Perfecto para cualquier ocasión especial.',
      description_es: 'Añade un mensaje personalizado dentro de tu caja. Perfecto para cualquier ocasión especial.',
      description_en: 'Add a personalized message inside your box. Perfect for any special occasion.'
    }
  ],
  cart: JSON.parse(localStorage.getItem('delizukar-cart')) || [],
  user: null,
  loading: false,
  categories: [
    { id: 'clasicas', name: 'NY Style Cookies', icon: 'cookie' },
    { id: 'chocolate', name: 'Chocolate', icon: 'chocolate' },
    { id: 'vainilla', name: 'Vainilla', icon: 'milk' },
    { id: 'especiales', name: 'Especiales', icon: 'star' },
    { id: 'boxes', name: 'Sweet Boxes', icon: 'package' },
    { id: 'regalo', name: 'Regalos', icon: 'card_giftcard' },
    { id: 'veganas', name: 'Veganas', icon: 'leaf' },
    { id: 'sin-gluten', name: 'Sin Gluten', icon: 'grain' }
  ],
  featuredProducts: [],
  newProducts: [],
  bestSellers: []
};

function storeReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload, productsLoading: false };
    
    case 'SET_FEATURED_PRODUCTS':
      return { ...state, featuredProducts: action.payload };
    
    case 'SET_NEW_PRODUCTS':
      return { ...state, newProducts: action.payload };
    
    case 'SET_BEST_SELLERS':
      return { ...state, bestSellers: action.payload };
    
    case 'ADD_TO_CART':
      const existingItem = state.cart.find(item => item.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      }
      return {
        ...state,
        cart: [...state.cart, { ...action.payload, quantity: 1 }]
      };
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.id !== action.payload)
      };
    
    case 'UPDATE_CART_QUANTITY':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };
    
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    
    case 'SET_USER':
      return { ...state, user: action.payload };
    
    default:
      return state;
  }
}

export const StoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(storeReducer, initialState);

  // Cargar productos desde Firebase con actualizaciones en tiempo real
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    // Configurar listener en tiempo real para la colección de productos
    const unsubscribe = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const firebaseProducts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Si hay productos en Firebase, usarlos; si no, mantener los de prueba
        if (firebaseProducts.length > 0) {
          // Filtrar solo productos activos para las páginas públicas
          const activeProducts = firebaseProducts.filter(p => p.active !== false);
          
          dispatch({ type: 'SET_PRODUCTS', payload: activeProducts });
          dispatch({ type: 'SET_FEATURED_PRODUCTS', payload: activeProducts.filter(p => p.featured) });
          dispatch({ type: 'SET_NEW_PRODUCTS', payload: activeProducts.filter(p => p.isNew) });
          dispatch({ type: 'SET_BEST_SELLERS', payload: activeProducts.filter(p => p.bestSeller) });
        } else {
          // Si no hay productos en Firebase, usar los productos de prueba
          const testProducts = initialState.initialProducts;
          dispatch({ type: 'SET_PRODUCTS', payload: testProducts });
          dispatch({ type: 'SET_FEATURED_PRODUCTS', payload: testProducts.filter(p => p.featured) });
          dispatch({ type: 'SET_NEW_PRODUCTS', payload: testProducts.filter(p => p.isNew) });
          dispatch({ type: 'SET_BEST_SELLERS', payload: testProducts.filter(p => p.bestSeller) });
        }
        dispatch({ type: 'SET_LOADING', payload: false });
      },
      (error) => {
        console.error('Error loading products:', error);
        // En caso de error, usar productos de prueba
        const testProducts = initialState.initialProducts;
        dispatch({ type: 'SET_PRODUCTS', payload: testProducts });
        dispatch({ type: 'SET_FEATURED_PRODUCTS', payload: testProducts.filter(p => p.featured) });
        dispatch({ type: 'SET_NEW_PRODUCTS', payload: testProducts.filter(p => p.isNew) });
        dispatch({ type: 'SET_BEST_SELLERS', payload: testProducts.filter(p => p.bestSeller) });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    );

    // Limpiar el listener cuando el componente se desmonte
    return () => unsubscribe();
  }, []);

  // Persistir carrito en localStorage
  useEffect(() => {
    localStorage.setItem('delizukar-cart', JSON.stringify(state.cart));
  }, [state.cart]);

  const addToCart = (product) => {
    dispatch({ type: 'ADD_TO_CART', payload: product });
  };

  const removeFromCart = (productId) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { id: productId, quantity } });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getCartTotal = () => {
    return state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return state.cart.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    ...state,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

