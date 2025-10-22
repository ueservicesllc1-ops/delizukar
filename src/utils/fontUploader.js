// Función para subir y gestionar fuentes de letras
export const fontUploader = {
  // Lista de fuentes disponibles
  availableFonts: [
    {
      id: 'playfair-display',
      name: 'Playfair Display',
      category: 'Serif',
      url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap'
    },
    {
      id: 'roboto',
      name: 'Roboto',
      category: 'Sans-serif',
      url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap'
    },
    {
      id: 'montserrat',
      name: 'Montserrat',
      category: 'Sans-serif',
      url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap'
    },
    {
      id: 'poppins',
      name: 'Poppins',
      category: 'Sans-serif',
      url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap'
    },
    {
      id: 'lato',
      name: 'Lato',
      category: 'Sans-serif',
      url: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap'
    },
    {
      id: 'open-sans',
      name: 'Open Sans',
      category: 'Sans-serif',
      url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap'
    },
    {
      id: 'source-sans-pro',
      name: 'Source Sans Pro',
      category: 'Sans-serif',
      url: 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700;900&display=swap'
    },
    {
      id: 'nunito',
      name: 'Nunito',
      category: 'Sans-serif',
      url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800;900&display=swap'
    },
    {
      id: 'raleway',
      name: 'Raleway',
      category: 'Sans-serif',
      url: 'https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700;800;900&display=swap'
    },
    {
      id: 'merriweather',
      name: 'Merriweather',
      category: 'Serif',
      url: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&display=swap'
    }
  ],

  // Cargar una fuente específica
  loadFont: (fontId) => {
    const font = fontUploader.availableFonts.find(f => f.id === fontId);
    if (!font) return false;

    // Crear link element para cargar la fuente
    const link = document.createElement('link');
    link.href = font.url;
    link.rel = 'stylesheet';
    
    // Verificar si ya está cargada
    const existingLink = document.querySelector(`link[href="${font.url}"]`);
    if (existingLink) return true;

    // Agregar al head
    document.head.appendChild(link);
    
    // Esperar a que se cargue
    return new Promise((resolve) => {
      link.onload = () => resolve(true);
      link.onerror = () => resolve(false);
    });
  },

  // Cargar múltiples fuentes
  loadFonts: async (fontIds) => {
    const promises = fontIds.map(id => fontUploader.loadFont(id));
    return Promise.all(promises);
  },

  // Aplicar fuente a un elemento
  applyFont: (element, fontFamily, fontWeight = '400') => {
    if (element && element.style) {
      element.style.fontFamily = fontFamily;
      element.style.fontWeight = fontWeight;
    }
  },

  // Obtener estilos de fuente para Material-UI
  getFontStyles: (fontFamily, fontWeight = '400') => ({
    fontFamily: `"${fontFamily}", sans-serif`,
    fontWeight: fontWeight
  }),

  // Subir fuente personalizada (archivo)
  uploadCustomFont: async (file) => {
    return new Promise((resolve, reject) => {
      // Validar que sea un archivo de fuente
      const validFontTypes = [
        'font/ttf',
        'font/otf', 
        'font/woff',
        'font/woff2',
        'application/font-woff',
        'application/font-woff2',
        'application/x-font-ttf',
        'application/x-font-otf'
      ];
      
      const validExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!file || (!validFontTypes.includes(file.type) && !validExtensions.includes(fileExtension))) {
        reject(new Error('Archivo no válido. Debe ser una fuente (TTF, OTF, WOFF, WOFF2).'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const fontData = e.target.result;
        
        // Crear @font-face rule
        const fontName = file.name.replace(/\.[^/.]+$/, '');
        const fontFace = `
          @font-face {
            font-family: '${fontName}';
            src: url(${fontData});
            font-display: swap;
          }
        `;

        // Agregar al documento
        const style = document.createElement('style');
        style.textContent = fontFace;
        document.head.appendChild(style);

        resolve({
          name: fontName,
          family: fontName,
          url: fontData
        });
      };

      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  },

  // Obtener fuentes cargadas
  getLoadedFonts: () => {
    const links = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
    return Array.from(links).map(link => {
      const href = link.href;
      const match = href.match(/family=([^:&]+)/);
      return match ? match[1].replace(/\+/g, ' ') : null;
    }).filter(Boolean);
  }
};

export default fontUploader;
