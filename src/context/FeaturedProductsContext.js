import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { fontUploader } from '../utils/fontUploader';

const FeaturedProductsContext = createContext();

export const FeaturedProductsProvider = ({ children }) => {
  const [featuredConfig, setFeaturedConfig] = useState({
    titleText: 'Galletas Destacadas',
    titleFont: 'Playfair Display',
    selectedProducts: []
  });
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'appConfig', 'featuredProducts');
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      console.log('🔍 Verificando configuración de productos destacados...');
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('📋 Datos encontrados en appConfig/featuredProducts:', data);
        
        const newConfig = {
          titleText: data.titleText || 'Galletas Destacadas',
          titleFont: data.titleFont || 'Playfair Display',
          selectedProducts: data.selectedProducts || []
        };
        
        console.log('✅ Configuración de productos destacados cargada:', newConfig);
        setFeaturedConfig(newConfig);
        
        // Cargar productos destacados
        if (newConfig.selectedProducts.length > 0) {
          await loadFeaturedProducts(newConfig.selectedProducts);
        }
        
        // Cargar la fuente
        try {
          console.log('🔤 Cargando fuente para productos destacados:', newConfig.titleFont);
          
          if (newConfig.titleFont !== 'Playfair Display' && newConfig.titleFont !== 'Roboto' && newConfig.titleFont !== 'Montserrat') {
            console.log('🔍 Buscando fuente personalizada en Firestore:', newConfig.titleFont);
            
            const fontsRef = collection(db, 'fonts');
            const fontsSnapshot = await getDocs(fontsRef);
            const customFont = fontsSnapshot.docs.find(doc => doc.data().name === newConfig.titleFont);
            
            if (customFont) {
              const fontData = customFont.data();
              console.log('✅ Fuente personalizada encontrada:', fontData);
              
              const fontFace = `
                @font-face {
                  font-family: '${newConfig.titleFont}';
                  src: url('${fontData.dataUrl || fontData.url}');
                  font-display: swap;
                }
              `;
              
              const style = document.createElement('style');
              style.setAttribute('data-featured-title-font', newConfig.titleFont);
              style.textContent = fontFace;
              document.head.appendChild(style);
              
              console.log('✅ Fuente personalizada cargada:', newConfig.titleFont);
            }
          } else {
            await fontUploader.loadFont(newConfig.titleFont);
          }
          
          // Aplicar la fuente al documento
          const style = document.createElement('style');
          style.setAttribute('data-featured-title-style', newConfig.titleFont);
          style.textContent = `
            .featured-products-title {
              font-family: "${newConfig.titleFont}", serif !important;
            }
          `;
          
          const existingStyle = document.querySelector(`[data-featured-title-style]`);
          if (existingStyle) {
            existingStyle.remove();
          }
          
          document.head.appendChild(style);
          console.log('✅ Fuente aplicada al documento:', newConfig.titleFont);
        } catch (error) {
          console.error('❌ Error loading font:', error);
        }
      } else {
        console.log('⚠️ No se encontró configuración de productos destacados');
      }
      setLoading(false);
    }, (error) => {
      console.error("Error loading featured products config:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadFeaturedProducts = async (productIds) => {
    try {
      console.log('🔄 Cargando productos destacados:', productIds);
      
      const productsRef = collection(db, 'products');
      const snapshot = await getDocs(productsRef);
      
      const allProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const featured = allProducts.filter(product => productIds.includes(product.id));
      
      console.log('✅ Productos destacados cargados:', featured);
      setFeaturedProducts(featured);
    } catch (error) {
      console.error('❌ Error loading featured products:', error);
    }
  };

  const value = {
    featuredConfig,
    featuredProducts,
    loading
  };

  return (
    <FeaturedProductsContext.Provider value={value}>
      {children}
    </FeaturedProductsContext.Provider>
  );
};

export const useFeaturedProducts = () => {
  const context = useContext(FeaturedProductsContext);
  if (!context) {
    throw new Error('useFeaturedProducts must be used within a FeaturedProductsProvider');
  }
  return context;
};
