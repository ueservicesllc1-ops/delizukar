import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { fontUploader } from '../utils/fontUploader';

const TitleConfigContext = createContext();

const initialState = {
  text: 'Lo que dicen nuestros clientes',
  font: 'Playfair Display',
  loading: true
};

export const TitleConfigProvider = ({ children }) => {
  const [titleConfig, setTitleConfig] = useState({
    text: 'Lo que dicen nuestros clientes',
    font: 'Playfair Display'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'appConfig', 'testimonialsTitle');
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      console.log('🔍 Verificando configuración del título en Firestore...');
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('📋 Datos encontrados en appConfig/testimonialsTitle:', data);
        
        const newConfig = {
          text: data.text || 'Lo que dicen nuestros clientes',
          font: data.font || 'Playfair Display'
        };
        
        console.log('✅ Configuración del título cargada:', newConfig);
        setTitleConfig(newConfig);
        
        // Cargar la fuente y aplicarla al documento
        try {
          console.log('🔤 Cargando fuente:', newConfig.font);
          
          // Cargar la fuente desde Firestore si es una fuente personalizada
          if (newConfig.font !== 'Playfair Display' && newConfig.font !== 'Roboto' && newConfig.font !== 'Montserrat') {
            console.log('🔍 Buscando fuente personalizada en Firestore:', newConfig.font);
            
            // Buscar la fuente en la colección de fuentes
            const fontsRef = collection(db, 'fonts');
            const fontsSnapshot = await getDocs(fontsRef);
            const customFont = fontsSnapshot.docs.find(doc => doc.data().name === newConfig.font);
            
            if (customFont) {
              const fontData = customFont.data();
              console.log('✅ Fuente personalizada encontrada:', fontData);
              
              // Crear @font-face con la URL de la fuente
              const fontFace = `
                @font-face {
                  font-family: '${newConfig.font}';
                  src: url('${fontData.dataUrl || fontData.url}');
                  font-display: swap;
                }
              `;
              
              const style = document.createElement('style');
              style.setAttribute('data-custom-font', newConfig.font);
              style.textContent = fontFace;
              document.head.appendChild(style);
              
              console.log('✅ Fuente personalizada cargada:', newConfig.font);
            } else {
              console.log('⚠️ Fuente personalizada no encontrada, usando fuente del sistema');
            }
          } else {
            await fontUploader.loadFont(newConfig.font);
          }
          
          // Aplicar la fuente directamente al documento
          const style = document.createElement('style');
          style.setAttribute('data-title-font', newConfig.font);
          style.textContent = `
            .testimonials-title {
              font-family: "${newConfig.font}", serif !important;
            }
          `;
          
          // Remover estilos anteriores
          const existingStyle = document.querySelector(`[data-title-font]`);
          if (existingStyle) {
            existingStyle.remove();
          }
          
          document.head.appendChild(style);
          console.log('✅ Fuente aplicada al documento:', newConfig.font);
        } catch (error) {
          console.error('❌ Error loading font:', error);
        }
      } else {
        // If no config in Firestore, save default
        const defaultConfig = {
          text: 'Lo que dicen nuestros clientes',
          font: 'Playfair Display'
        };
        setDoc(docRef, defaultConfig, { merge: true });
        setTitleConfig(defaultConfig);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error loading title config:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateTitleConfig = async (newConfig) => {
    const docRef = doc(db, 'appConfig', 'testimonialsTitle');
    await setDoc(docRef, newConfig, { merge: true });
    setTitleConfig(newConfig);
    fontUploader.loadFont(newConfig.font); // Ensure font is loaded
  };

  const value = {
    titleConfig,
    updateTitleConfig,
    loading
  };

  return (
    <TitleConfigContext.Provider value={value}>
      {children}
    </TitleConfigContext.Provider>
  );
};

export const useTitleConfig = () => {
  const context = useContext(TitleConfigContext);
  if (!context) {
    throw new Error('useTitleConfig must be used within a TitleConfigProvider');
  }
  return context;
};

export default TitleConfigContext;
