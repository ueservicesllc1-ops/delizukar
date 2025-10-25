import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  IconButton,
  TextField,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Close, Edit, Save, Cancel } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { fontUploader } from '../utils/fontUploader';
import { db, storage } from '../firebase/config';
import { collection, addDoc, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import RichTextEditor from './RichTextEditor';

const PagesManager = ({ open, onClose }) => {
  const [availableFonts, setAvailableFonts] = useState([
    'Playfair Display',
    'Roboto',
    'Montserrat',
    'Open Sans',
    'Lato',
    'Poppins',
    'Source Sans Pro',
    'Raleway',
    'Nunito',
    'Inter'
  ]);

  // Cargar fuentes disponibles al abrir el modal
  useEffect(() => {
    if (open) {
      loadAvailableFonts();
      loadPagesFromFirestore();
    }
  }, [open]);

  const loadAvailableFonts = async () => {
    try {
      // Obtener fuentes predefinidas
      const predefinedFonts = fontUploader.availableFonts.map(font => font.name);
      
      // Obtener fuentes subidas desde Firestore
      const fontsCollection = collection(db, 'fonts');
      const snapshot = await getDocs(fontsCollection);
      const customFontNames = [];
      
      snapshot.forEach((doc) => {
        const fontData = doc.data();
        customFontNames.push(fontData.name);
      });
      
      // Combinar todas las fuentes
      const allFonts = [...new Set([...predefinedFonts, ...customFontNames])];
      setAvailableFonts(allFonts);
      
      console.log('Fuentes disponibles en PagesManager:', allFonts);
    } catch (error) {
      console.error('Error cargando fuentes:', error);
    }
  };

  const loadPagesFromFirestore = async () => {
    try {
      const pagesCollection = collection(db, 'pages');
      const snapshot = await getDocs(pagesCollection);
      const savedPagesData = {};
      
      snapshot.forEach((doc) => {
        savedPagesData[doc.id] = doc.data();
      });
      
      if (Object.keys(savedPagesData).length > 0) {
        setPages(prevPages => {
          const updatedPages = prevPages.map(page => {
            const savedData = savedPagesData[page.id];
            if (savedData) {
              return {
                ...page,
                title: savedData.title,
                content: savedData.content,
                titleFont: savedData.titleFont,
                contentFont: savedData.contentFont,
                imageUrl: savedData.imageUrl || ''
              };
            }
            return page;
          });
          console.log('Páginas cargadas desde Firestore:', updatedPages);
          return updatedPages;
        });
      }
    } catch (error) {
      console.error('Error cargando páginas desde Firestore:', error);
    }
  };

  const [pages, setPages] = useState([
    {
      id: 'terms',
      title: 'Términos y Condiciones',
      content: 'Contenido de términos y condiciones estará disponible próximamente',
      route: '/terms',
      titleFont: 'Playfair Display',
      contentFont: 'Roboto'
    },
    {
      id: 'terms-service',
      title: 'Términos de Servicio',
      content: 'Contenido de términos de servicio estará disponible próximamente',
      route: '/terms-service',
      titleFont: 'Playfair Display',
      contentFont: 'Roboto'
    },
    {
      id: 'faq',
      title: 'Preguntas Frecuentes',
      content: 'Contenido de preguntas frecuentes estará disponible próximamente',
      route: '/faq',
      titleFont: 'Playfair Display',
      contentFont: 'Roboto'
    },
    {
      id: 'allergy',
      title: 'Avisos de Alergias',
      content: 'Contenido de avisos de alergias estará disponible próximamente',
      route: '/allergy',
      titleFont: 'Playfair Display',
      contentFont: 'Roboto'
    },
    {
      id: 'shipping',
      title: 'Política de Envíos',
      content: 'Contenido de política de envíos estará disponible próximamente',
      route: '/shipping',
      titleFont: 'Playfair Display',
      contentFont: 'Roboto'
    },
    {
      id: 'cookie-care',
      title: 'Instrucciones de Cuidado de Galletas',
      content: 'Contenido de instrucciones de cuidado de galletas estará disponible próximamente',
      route: '/cookie-care',
      titleFont: 'Playfair Display',
      contentFont: 'Roboto'
    },
    {
      id: 'nosotros',
      title: 'Our History',
      content: 'Write your story here. Share how DeliZuKar began, your passion for New York-style cookies, the ingredients you love, and the values behind your brand.',
      route: '/nosotros',
      titleFont: 'Playfair Display',
      contentFont: 'Roboto',
      imageUrl: ''
    },
    {
      id: 'contacto',
      title: 'Contact Us',
      content: "We'd love to hear from you. Send us a message and we'll get back to you.",
      route: '/contacto',
      titleFont: 'Playfair Display',
      contentFont: 'Roboto'
    }
  ]);

  const [editingPage, setEditingPage] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTitleFont, setEditTitleFont] = useState('');
  const [editContentFont, setEditContentFont] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  // Cargar fuentes subidas cuando se abra el modal de edición
  useEffect(() => {
    if (editingPage) {
      const uploadedFonts = JSON.parse(localStorage.getItem('uploadedFonts') || '[]');
      console.log('Cargando fuentes subidas para vista previa:', uploadedFonts);
      
      // Cargar todas las fuentes subidas al documento
      uploadedFonts.forEach(font => {
        const fontFace = `
          @font-face {
            font-family: '${font.name}';
            src: url(${font.url});
            font-display: swap;
          }
        `;
        const style = document.createElement('style');
        style.textContent = fontFace;
        document.head.appendChild(style);
        console.log('Fuente cargada para vista previa:', font.name);
      });
    }
  }, [editingPage]);

  const handleEdit = (page) => {
    setEditingPage(page);
    setEditTitle(page.title);
    setEditContent(page.content);
    setEditTitleFont(page.titleFont);
    setEditContentFont(page.contentFont);
    setEditImageUrl(page.imageUrl || '');
  };

  const handleSave = async () => {
    if (editingPage) {
      try {
        const updatedPages = pages.map(page => 
          page.id === editingPage.id 
            ? { ...page, title: editTitle, content: editContent, titleFont: editTitleFont, contentFont: editContentFont, imageUrl: editImageUrl }
            : page
        );
        
        setPages(updatedPages);
        
        // Guardar en Firestore
        const pageData = {
          title: editTitle,
          content: editContent,
          titleFont: editTitleFont,
          contentFont: editContentFont,
          imageUrl: editImageUrl || '',
          updatedAt: new Date()
        };
        
        await setDoc(doc(db, 'pages', editingPage.id), pageData);
        console.log('Página guardada en Firestore:', editingPage.id, pageData);
        
        setEditingPage(null);
        setEditTitle('');
        setEditContent('');
        setEditTitleFont('');
        setEditContentFont('');
        setEditImageUrl('');
      } catch (error) {
        console.error('Error guardando página en Firestore:', error);
        alert('Error al guardar la página. Inténtalo de nuevo.');
      }
    }
  };

  const handleCancel = () => {
    setEditingPage(null);
    setEditTitle('');
    setEditContent('');
    setEditTitleFont('');
    setEditContentFont('');
    setEditImageUrl('');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        zIndex: 9999999,
        '& .MuiDialog-paper': {
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          maxHeight: '90vh',
          zIndex: 9999999
        },
        '& .MuiBackdrop-root': {
          zIndex: 9999998
        }
      }}
      BackdropProps={{
        sx: {
          zIndex: 9999998
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pb: 2
      }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#EC8C8D' }}>
          Gestión de Páginas
        </Typography>
        <IconButton onClick={onClose} sx={{ color: '#666' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {pages.map((page, index) => (
            <Grid item xs={12} md={6} key={page.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    borderRadius: '15px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    '&:hover': {
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: '#EC8C8D',
                          mb: 1,
                          fontFamily: `"${page.titleFont}", serif`
                        }}
                      >
                        {page.title}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(page)}
                        sx={{
                          color: '#c8626d',
                          '&:hover': {
                            backgroundColor: '#c8626d20'
                          }
                        }}
                      >
                        <Edit />
                      </IconButton>
                    </Box>
                    
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#666',
                        mb: 2,
                        lineHeight: 1.5,
                        fontFamily: `"${page.contentFont}", sans-serif`,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {page.content}
                    </Typography>
                    
                    <Chip
                      label={page.route}
                      size="small"
                      sx={{
                        backgroundColor: '#c8626d20',
                        color: '#c8626d',
                        fontWeight: 500
                      }}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Modal de edición */}
        {editingPage && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }}
          >
            <Card
              sx={{
                width: '90%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                p: 3
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#EC8C8D' }}>
                  Editar Página
                </Typography>
                <IconButton onClick={handleCancel} sx={{ color: '#666' }}>
                  <Close />
                </IconButton>
              </Box>

              <TextField
                fullWidth
                label="Título"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                sx={{ mb: 3 }}
              />

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Fuente del Título</InputLabel>
                <Select
                  value={editTitleFont}
                  onChange={(e) => setEditTitleFont(e.target.value)}
                  label="Fuente del Título"
                >
                  {availableFonts.map((font) => (
                    <MenuItem key={font} value={font} sx={{ fontFamily: `"${font}", sans-serif` }}>
                      {font}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#666', fontWeight: 600 }}>
                  Contenido
                </Typography>
                <RichTextEditor
                  value={editContent}
                  onChange={setEditContent}
                  placeholder="Escribe el contenido de la página aquí..."
                  minHeight={200}
                />
              </Box>

              {editingPage?.id === 'nosotros' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                    Imagen (derecha)
                  </Typography>
                  <Button component="label" variant="outlined" sx={{ mr: 2 }}>
                    Seleccionar Imagen
                    <input type="file" hidden accept="image/*" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const path = `pages/nosotros/${Date.now()}_${file.name}`;
                        const r = ref(storage, path);
                        await uploadBytes(r, file);
                        const url = await getDownloadURL(r);
                        setEditImageUrl(url);
                      } catch (err) {
                        console.error(err);
                        alert('Error subiendo la imagen');
                      }
                    }} />
                  </Button>
                  {editImageUrl && (
                    <Box sx={{ mt: 2, borderRadius: 2, overflow: 'hidden', maxHeight: 160 }}>
                      <img src={editImageUrl} alt="Preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    </Box>
                  )}
                </Box>
              )}

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Fuente del Contenido</InputLabel>
                <Select
                  value={editContentFont}
                  onChange={(e) => setEditContentFont(e.target.value)}
                  label="Fuente del Contenido"
                >
                  {availableFonts.map((font) => (
                    <MenuItem key={font} value={font} sx={{ fontFamily: `"${font}", sans-serif` }}>
                      {font}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Vista previa de las fuentes */}
              <Box sx={{ mb: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
                <Typography variant="h6" sx={{ mb: 1, color: '#EC8C8D' }}>
                  Vista Previa:
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: editTitleFont ? `"${editTitleFont}", serif` : 'Playfair Display, serif',
                    color: '#EC8C8D',
                    mb: 2,
                    fontWeight: 600,
                    whiteSpace: 'pre-line'
                  }}
                >
                  {editTitle || 'Título de ejemplo'}
                </Typography>
                <Box
                  sx={{
                    fontFamily: editContentFont ? `"${editContentFont}", sans-serif` : 'Roboto, sans-serif',
                    color: '#666',
                    lineHeight: 1.5,
                    '& p': {
                      margin: '0 0 8px 0',
                      '&:last-child': {
                        marginBottom: 0
                      }
                    },
                    '& ul, & ol': {
                      margin: '8px 0',
                      paddingLeft: '20px'
                    },
                    '& li': {
                      margin: '4px 0'
                    }
                  }}
                  dangerouslySetInnerHTML={{
                    __html: editContent || 'Contenido de ejemplo para mostrar cómo se verá el texto con la fuente seleccionada.'
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  onClick={handleCancel}
                  sx={{
                    color: '#666',
                    textTransform: 'none'
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  variant="contained"
                  sx={{
                    backgroundColor: '#c8626d',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#b5555a'
                    }
                  }}
                >
                  Guardar
                </Button>
              </Box>
            </Card>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, justifyContent: 'flex-end' }}>
        <Button onClick={onClose} sx={{ color: '#666', textTransform: 'none' }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PagesManager;
