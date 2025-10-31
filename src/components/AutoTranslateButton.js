import React, { useState } from 'react';
import { Box, IconButton, CircularProgress, Snackbar, Alert } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';

const AutoTranslateButton = ({ 
  sourceLang = 'es', 
  targetLang = 'en',
  position = { bottom: '20px', right: '20px' },
  buttonColor = '#EC8C8D',
  buttonHoverColor = '#d47a7b'
}) => {
  const [translating, setTranslating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  // API del backend (proxy a LibreTranslate) - evita problemas de CORS
  const getBackendUrl = () => {
    // Detectar si estamos en desarrollo (localhost) o producción
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isDevelopment) {
      return 'http://localhost:5000';
    }
    
    // En producción, usar la URL del backend de Railway
    // Si está configurada REACT_APP_API_URL, usarla; sino, intentar detectar automáticamente
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    
    // Fallback: usar la URL actual del frontend (asumiendo que backend está en el mismo dominio)
    // O usar la URL conocida de Railway
    return window.location.origin.includes('railway') 
      ? window.location.origin 
      : 'https://delizukar-production.up.railway.app';
  };

  // Función para traducir texto usando el backend (que actúa como proxy)
  const translateText = async (text) => {
    if (!text || text.trim().length === 0) return text;
    
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: 'text'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Error 429: Demasiadas peticiones
        if (response.status === 429) {
          throw new Error(errorData.error || 'Límite de peticiones alcanzado. Por favor, espera un momento e intenta nuevamente.');
        }
        
        throw new Error(errorData.error || `Error de traducción: ${response.status}`);
      }

      const data = await response.json();
      return data.translatedText || text;
    } catch (error) {
      console.error('Error traduciendo:', error);
      throw error; // Relanzar para que el handler pueda manejarlo
    }
  };

  // Función para obtener todos los elementos de texto visibles
  const getTextElements = () => {
    const selectors = [
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
      'span', 'li', 'a', 'button', 'label',
      'td', 'th', 'div[role="button"]',
      '.MuiTypography-root', '.MuiButton-label',
      '[aria-label]'
    ];

    const elements = [];
    selectors.forEach(selector => {
      const found = document.querySelectorAll(selector);
      found.forEach(el => {
        // Excluir elementos dentro de la franja rosa (hero-color-strip-mobile)
        if (el.closest('.hero-color-strip-mobile')) {
          return;
        }
        
        // Excluir elementos con atributo data-no-translate
        if (el.hasAttribute('data-no-translate') || el.closest('[data-no-translate]')) {
          return;
        }
        
        // Solo incluir elementos visibles y que no estén dentro de elementos que ya hemos incluido
        if (isElementVisible(el) && !isDescendantOfTranslated(el, elements)) {
          // Evitar elementos que contienen solo números o símbolos
          const text = getElementText(el);
          if (text && text.trim().length > 0 && !isOnlyNumbersOrSymbols(text)) {
            elements.push({ element: el, originalText: text });
          }
        }
      });
    });

    return elements;
  };

  // Verificar si un elemento es visible
  const isElementVisible = (el) => {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      el.offsetWidth > 0 &&
      el.offsetHeight > 0
    );
  };

  // Verificar si un elemento es descendiente de elementos ya incluidos
  const isDescendantOfTranslated = (el, translatedElements) => {
    return translatedElements.some(({ element }) => element.contains(el) && element !== el);
  };

  // Obtener texto de un elemento (sin incluir textos de hijos)
  const getElementText = (el) => {
    // Si es un input o textarea, obtener el value
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      return el.value;
    }

    // Para otros elementos, obtener solo el texto directo
    let text = '';
    if (el.childNodes.length === 0) {
      text = el.textContent || el.innerText || '';
    } else {
      // Solo tomar el texto directo del nodo, no de los hijos
      el.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          text += node.textContent;
        }
      });
    }
    return text.trim();
  };

  // Verificar si el texto contiene solo números o símbolos
  const isOnlyNumbersOrSymbols = (text) => {
    return /^[\d\s\W]+$/.test(text);
  };

  // Reemplazar texto en un elemento
  const setElementText = (el, newText) => {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.value = newText;
    } else {
      // Limpiar hijos de texto pero mantener estructura HTML
      el.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          node.remove();
        }
      });
      
      // Agregar el nuevo texto
      if (el.childNodes.length === 0) {
        el.textContent = newText;
      } else {
        // Insertar antes del primer hijo que no sea texto
        const textNode = document.createTextNode(newText);
        el.insertBefore(textNode, el.firstChild);
      }
    }
  };

  // Función principal de traducción
  const handleTranslate = async () => {
    setTranslating(true);
    setShowError(false);

    try {
      // Obtener todos los elementos de texto
      const textElements = getTextElements();
      console.log(`Encontrados ${textElements.length} elementos para traducir`);

      if (textElements.length === 0) {
        setShowError(true);
        setTranslating(false);
        return;
      }

      // Traducir cada elemento (con límite de elementos para evitar sobrecarga)
      const maxElements = 100; // Límite razonable
      const elementsToTranslate = textElements.slice(0, maxElements);

      // Crear un mapa de textos únicos con sus elementos
      const uniqueTexts = new Map();
      const textToElements = new Map(); // Mapa: texto -> array de elementos que lo contienen
      
      elementsToTranslate.forEach(({ element, originalText }) => {
        const cleanText = originalText.trim();
        if (cleanText.length > 0) {
          if (!uniqueTexts.has(cleanText)) {
            uniqueTexts.set(cleanText, null);
            textToElements.set(cleanText, []);
          }
          textToElements.get(cleanText).push({ element, originalText });
        }
      });

      console.log(`Traduciendo ${uniqueTexts.size} textos únicos usando método optimizado (concatenación)...`);

      // ESTRATEGIA: Traducir en lotes pequeños para evitar error 429 y asegurar calidad
      // Traducir texto por texto puede ser lento pero más confiable que concatenar
      const textsArray = Array.from(uniqueTexts.keys());
      const batchSize = 10; // Lotes de 10 textos (balance entre velocidad y confiabilidad)
      
      console.log(`📦 Traduciendo ${textsArray.length} textos en lotes de ${batchSize}...`);
      
      for (let i = 0; i < textsArray.length; i += batchSize) {
        const batch = textsArray.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(textsArray.length / batchSize);
        
        console.log(`📤 Lote ${batchNumber}/${totalBatches}: Traduciendo ${batch.length} textos...`);
        
        // Traducir cada texto del lote en paralelo
        const batchPromises = batch.map(async (text) => {
          try {
            const translated = await translateText(text);
            if (translated && translated !== text && translated.trim().length > 0) {
              uniqueTexts.set(text, translated.trim());
              return true;
            }
            return false;
          } catch (error) {
            console.error(`Error traduciendo "${text.substring(0, 30)}...":`, error);
            return false;
          }
        });
        
        await Promise.all(batchPromises);
        
        // Pequeña pausa entre lotes para evitar saturar el servidor
        if (i + batchSize < textsArray.length) {
          await new Promise(resolve => setTimeout(resolve, 300)); // 300ms entre lotes
        }
      }
      
      console.log(`✅ Proceso de traducción completado. ${uniqueTexts.size} textos únicos procesados.`);

      // Aplicar traducciones a todos los elementos
      let translatedCount = 0;
      let skippedCount = 0;
      textToElements.forEach((elements, originalText) => {
        const translatedText = uniqueTexts.get(originalText);
        if (translatedText && translatedText !== originalText && translatedText.trim().length > 0) {
          elements.forEach(({ element }) => {
            try {
              setElementText(element, translatedText);
              translatedCount++;
            } catch (err) {
              console.error(`Error aplicando traducción al elemento:`, err);
            }
          });
        } else {
          skippedCount++;
          if (!translatedText) {
            console.warn(`⚠️ No se encontró traducción para: "${originalText.substring(0, 50)}..."`);
          } else if (translatedText === originalText) {
            console.warn(`⚠️ Traducción idéntica (probablemente error): "${originalText.substring(0, 50)}..."`);
          }
        }
      });

      console.log(`✅ Traducidos ${translatedCount} elementos`);
      if (skippedCount > 0) {
        console.warn(`⚠️ ${skippedCount} textos no fueron traducidos`);
      }

      setShowSuccess(true);
    } catch (error) {
      console.error('Error en traducción:', error);
      setShowError(true);
    } finally {
      setTranslating(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          ...position,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <IconButton
          onClick={handleTranslate}
          disabled={translating}
          sx={{
            backgroundColor: buttonColor,
            color: 'white',
            width: { xs: 56, md: 64 },
            height: { xs: 56, md: 64 },
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: buttonHoverColor,
              transform: 'scale(1.1)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
            },
            '&:disabled': {
              backgroundColor: buttonColor,
              opacity: 0.7
            },
            '& .MuiSvgIcon-root': {
              fontSize: { xs: '1.5rem', md: '1.75rem' }
            }
          }}
          aria-label="Traducir página"
        >
          {translating ? (
            <CircularProgress size={24} sx={{ color: 'white' }} />
          ) : (
            <TranslateIcon />
          )}
        </IconButton>
      </Box>

      {/* Snackbar para éxito */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          Traducción completada
        </Alert>
      </Snackbar>

      {/* Snackbar para error */}
      <Snackbar
        open={showError}
        autoHideDuration={4000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setShowError(false)}>
          Error al traducir. Intenta nuevamente.
        </Alert>
      </Snackbar>
    </>
  );
};

export default AutoTranslateButton;

