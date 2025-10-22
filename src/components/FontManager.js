import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Divider
} from '@mui/material';
import {
  FontDownload,
  Upload,
  Close,
  Check,
  Refresh
} from '@mui/icons-material';
import { fontUploader } from '../utils/fontUploader';
import { storage, db } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, getDocs, doc, deleteDoc } from 'firebase/firestore';

const FontManager = ({ open, onClose, onFontSelect }) => {
  const [selectedFont, setSelectedFont] = useState('');
  const [customFont, setCustomFont] = useState(null);
  const [uploadedFonts, setUploadedFonts] = useState([]);
  const [previewText, setPreviewText] = useState('DeliZuKar: your heart\'s Wi-Fi');

  useEffect(() => {
    // Cargar fuentes predefinidas al abrir
    if (open) {
      fontUploader.loadFonts(['playfair-display', 'roboto', 'montserrat', 'poppins']);
      
      // Cargar fuentes subidas desde Firestore
      loadUploadedFontsFromFirestore();
    }
  }, [open]);

  const loadUploadedFontsFromFirestore = async () => {
    try {
      const fontsCollection = collection(db, 'fonts');
      const snapshot = await getDocs(fontsCollection);
      const fonts = [];
      
      snapshot.forEach((doc) => {
        fonts.push({ id: doc.id, ...doc.data() });
      });
      
      setUploadedFonts(fonts);
      console.log('Fuentes cargadas desde Firestore:', fonts);
    } catch (error) {
      console.error('Error cargando fuentes desde Firestore:', error);
    }
  };

  const handleFontSelect = (font) => {
    setSelectedFont(font.id);
    if (onFontSelect) {
      onFontSelect(font);
    }
  };

  const handleCustomFontUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
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
        alert('Archivo no válido. Debe ser una fuente (TTF, OTF, WOFF, WOFF2).');
        return;
      }

      // Leer dataURL para guardarlo y evitar CORS al usarlo directamente
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result);
        reader.onerror = () => reject(new Error('Error leyendo el archivo como dataURL'));
        reader.readAsDataURL(file);
      });

      // Subir archivo a Firebase Storage
      const fileName = `fonts/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      // Configurar metadatos para permitir acceso público
      const uploadResult = await uploadBytes(storageRef, file, {
        customMetadata: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
      
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // Crear @font-face rule y agregar al documento
      const fontName = file.name.replace(/\.[^/.]+$/, '');
      const fontFace = `
        @font-face {
          font-family: '${fontName}';
          src: url(${dataUrl});
          font-display: swap;
        }
      `;
      const style = document.createElement('style');
      style.setAttribute('data-font', fontName);
      style.textContent = fontFace;
      document.head.appendChild(style);

      // Guardar metadatos en Firestore
      const fontData = {
        name: fontName,
        url: downloadURL,
        dataUrl: dataUrl,
        fileName: file.name,
        uploadedAt: new Date(),
        size: file.size,
        type: file.type
      };

      const docRef = await addDoc(collection(db, 'fonts'), fontData);
      console.log('Fuente guardada en Firestore con ID:', docRef.id);

      // Actualizar estado local
      const newFont = { id: docRef.id, ...fontData };
      setUploadedFonts(prev => [...prev, newFont]);
      
      // Seleccionar la fuente recién subida
      setCustomFont(newFont);
      setSelectedFont(''); // Limpiar selección de fuentes predefinidas
      
      // Aplicar la fuente a la vista previa
      const previewElement = document.getElementById('font-preview');
      if (previewElement) {
        fontUploader.applyFont(previewElement, newFont.name);
      }
      
    } catch (error) {
      console.error('Error al subir fuente:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const applyFontToPreview = (fontFamily) => {
    const previewElement = document.getElementById('font-preview');
    if (previewElement) {
      fontUploader.applyFont(previewElement, fontFamily);
    }
  };

  const getFontStyles = (font) => {
    return fontUploader.getFontStyles(font.name, '400');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FontDownload sx={{ color: '#8B4513' }} />
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#eb8b8b' }}>
                Gestión de Fuentes
              </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#666' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Preview de fuente */}
        <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#eb8b8b' }}>
                Vista Previa
              </Typography>
          <Box
            id="font-preview"
            sx={{
              p: 3,
              backgroundColor: '#f8f9fa',
              borderRadius: '15px',
              border: '2px dashed #ddd',
              textAlign: 'center',
              minHeight: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography
              variant="h4"
              sx={{
                color: '#8B4513',
                fontWeight: 600,
                fontFamily: selectedFont ? fontUploader.availableFonts.find(f => f.id === selectedFont)?.name : 'inherit'
              }}
            >
              {previewText}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Fuentes predefinidas */}
        <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#eb8b8b' }}>
                Fuentes Disponibles
              </Typography>
          <Grid container spacing={2}>
            {fontUploader.availableFonts.map((font) => (
              <Grid item xs={12} sm={6} md={4} key={font.id}>
                <motion.div
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedFont === font.id ? '2px solid #8B4513' : '2px solid transparent',
                      borderRadius: '15px',
                      '&:hover': {
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                      }
                    }}
                    onClick={() => handleFontSelect(font)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: `"${font.name}", sans-serif`,
                          fontWeight: 600,
                          color: '#333',
                          mb: 1
                        }}
                      >
                        {font.name}
                      </Typography>
                      <Chip
                        label={font.category}
                        size="small"
                        sx={{
                          backgroundColor: '#8B451320',
                          color: '#8B4513',
                          fontWeight: 500
                        }}
                      />
                      {selectedFont === font.id && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                          <Check sx={{ color: '#8B4513', fontSize: '1.2rem' }} />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Subir fuente personalizada */}
        <Box>
              <Typography variant="h6" sx={{ mb: 2, color: '#eb8b8b' }}>
                Subir Fuente Personalizada
              </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<Upload />}
              sx={{
                borderColor: '#8B4513',
                color: '#8B4513',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#8B451320',
                  borderColor: '#8B4513'
                }
              }}
            >
              Seleccionar Archivo
              <input
                type="file"
                hidden
                accept=".ttf,.otf,.woff,.woff2"
                onChange={handleCustomFontUpload}
              />
            </Button>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Formatos soportados: TTF, OTF, WOFF, WOFF2
            </Typography>
          </Box>

          {/* Fuentes subidas */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#eb8b8b' }}>
                Fuentes Subidas ({uploadedFonts.length})
              </Typography>
              <Button
                size="small"
                onClick={() => {
                  console.log('Estado actual de uploadedFonts:', uploadedFonts);
                  setUploadedFonts([...uploadedFonts]); // Forzar re-render
                }}
                sx={{ color: '#8B4513', textTransform: 'none' }}
              >
                Refrescar
              </Button>
            </Box>
            {uploadedFonts.length > 0 ? (
              <Grid container spacing={2}>
                {console.log('Renderizando fuentes:', uploadedFonts)}
                {uploadedFonts.map((font, index) => {
                  console.log(`Renderizando fuente ${index}:`, font);
                  return (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: customFont?.name === font.name ? '2px solid #8B4513' : '2px solid transparent',
                        borderRadius: '15px',
                        '&:hover': {
                          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                        }
                      }}
                      onClick={() => setCustomFont(font)}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontFamily: `"${font.name}", sans-serif`,
                            fontWeight: 600,
                            color: '#333',
                            mb: 1
                          }}
                        >
                          {font.name}
                        </Typography>
                        <Chip
                          label="Personalizada"
                          size="small"
                          sx={{
                            backgroundColor: '#be878220',
                            color: '#be8782',
                            fontWeight: 500
                          }}
                        />
                        {customFont?.name === font.name && (
                          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                            <Check sx={{ color: '#8B4513', fontSize: '1.2rem' }} />
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  );
                })}
              </Grid>
            ) : (
              <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                No hay fuentes subidas aún
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={onClose}
          sx={{
            color: '#666',
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={() => {
            const selectedFontData = selectedFont 
              ? fontUploader.availableFonts.find(f => f.id === selectedFont)
              : customFont;
            if (onFontSelect && selectedFontData) {
              onFontSelect(selectedFontData);
            }
            onClose();
          }}
          variant="contained"
          sx={{
            backgroundColor: '#8B4513',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            '&:hover': {
              backgroundColor: '#A0522D'
            }
          }}
        >
          Aplicar Fuente
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FontManager;
