import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Switch,
  Card,
  CardContent,
  Grid,
  IconButton,
  Divider,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Close,
  Save,
  Widgets,
  Visibility,
  VisibilityOff,
  Storefront,
  LocalShipping,
  LocalOffer,
  FitnessCenter,
  Inventory2,
  RestartAlt,
  CheckCircle2
} from '@mui/icons-material';
import { usePopupsVisibility, DEFAULT_POPUPS_VISIBILITY } from '../context/PopupsVisibilityContext';

const PopupsVisibilityManager = ({ open, onClose }) => {
  const { visibility, updateVisibility, loading } = usePopupsVisibility();
  const [formState, setFormState] = useState(DEFAULT_POPUPS_VISIBILITY);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (open) {
      setFormState(visibility);
      setAlert(null);
    }
  }, [open, visibility]);

  const handleToggle = (key) => {
    setFormState((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setAlert(null);
    try {
      await updateVisibility(formState);
      setAlert({ type: 'success', message: '¡Configuración de visibilidad guardada exitosamente!' });
      setTimeout(() => {
        if (typeof onClose === 'function') onClose();
      }, 900);
    } catch (err) {
      console.error('Error guardando visibilidad:', err);
      setAlert({ type: 'error', message: 'Error al guardar cambios: ' + (err.message || 'Error desconocido') });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setFormState(DEFAULT_POPUPS_VISIBILITY);
    setAlert({ type: 'info', message: 'Valores restablecidos a los valores por defecto (Recuerda hacer clic en Guardar).' });
  };

  const items = [
    {
      key: 'showCookieBoxPromo',
      title: 'Popup Inferior Derecho ("Arma tu caja de galletas")',
      badge: 'Esquina Inferior',
      icon: <Inventory2 sx={{ color: '#c8626d', fontSize: '2rem' }} />,
      desc: 'Muestra u oculta la tarjeta flotante emergente que sale abajo a la derecha de la pantalla con la promoción "¡Arma tu caja de galletas estilo NY! Mínimo 4 Galletas".'
    },
    {
      key: 'showPickupFlyer',
      title: 'Cartilla de Recogida Local (Pickup) en Cabecera',
      badge: 'Header Izquierda',
      icon: <Storefront sx={{ color: '#c8626d', fontSize: '2rem' }} />,
      desc: 'Muestra u oculta la cartilla/flyer flotante en el Header que permite a los clientes seleccionar recogida local en Clifton, NJ.'
    },
    {
      key: 'showShippingFlyer',
      title: 'Cartilla de Envíos Nacionales (Shipping) en Cabecera',
      badge: 'Header Derecha',
      icon: <LocalShipping sx={{ color: '#c8626d', fontSize: '2rem' }} />,
      desc: 'Muestra u oculta la cartilla/flyer flotante en el Header para ordenar con envío a domicilio a todo Estados Unidos.'
    },
    {
      key: 'showCookieWeightChip',
      title: 'Chip Flotante de Peso de Galletas',
      badge: 'Banner Principal',
      icon: <FitnessCenter sx={{ color: '#c8626d', fontSize: '2rem' }} />,
      desc: 'Muestra u oculta el chip animado que flota sobre el banner de inicio ("Entre 180g y 200g de puro antojo en cada galleta").'
    },
    {
      key: 'showPopupHero',
      title: 'Popup Hero (Promociones / Ofertas al Entrar)',
      badge: 'Modal Central',
      icon: <LocalOffer sx={{ color: '#c8626d', fontSize: '2rem' }} />,
      desc: 'Muestra u oculta la ventana emergente central que se abre automáticamente cuando los clientes entran a la tienda online.'
    },
    {
      key: 'showExperienceModal',
      title: 'Modal de Selección de Experiencia (Pickup / Shipping)',
      badge: 'Selector de Modalidad',
      icon: <Widgets sx={{ color: '#c8626d', fontSize: '2rem' }} />,
      desc: 'Muestra u oculta el diálogo emergente para que los usuarios seleccionen entre Recogida Local o Envío a Domicilio.'
    }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: '#c8626d',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Widgets sx={{ fontSize: '1.8rem' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Control de Popups y Elementos Flotantes
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Activa o desactiva qué elementos y ventanas emergentes verán los clientes
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, backgroundColor: '#fcf8f8' }}>
        {alert && (
          <Alert severity={alert.type} sx={{ mb: 2.5, borderRadius: '10px' }} onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: '#c8626d' }} />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {items.map((item) => {
              const isChecked = Boolean(formState[item.key]);
              return (
                <Grid item xs={12} key={item.key}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: '12px',
                      border: isChecked ? '1.5px solid #c8626d' : '1px solid #e0e0e0',
                      backgroundColor: isChecked ? '#ffffff' : '#f5f5f5',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#c8626d',
                        boxShadow: '0 4px 14px rgba(200, 98, 109, 0.15)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1 }}>
                          <Box sx={{ mt: 0.5 }}>{item.icon}</Box>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#333' }}>
                                {item.title}
                              </Typography>
                              <Chip
                                label={item.badge}
                                size="small"
                                sx={{
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  backgroundColor: isChecked ? '#fff0f2' : '#e0e0e0',
                                  color: isChecked ? '#c8626d' : '#666'
                                }}
                              />
                              <Chip
                                icon={isChecked ? <Visibility sx={{ fontSize: '1rem !important' }} /> : <VisibilityOff sx={{ fontSize: '1rem !important' }} />}
                                label={isChecked ? 'Visible' : 'Oculto'}
                                size="small"
                                color={isChecked ? 'success' : 'default'}
                                variant={isChecked ? 'filled' : 'outlined'}
                                sx={{ fontSize: '0.72rem', fontWeight: 600 }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.4 }}>
                              {item.desc}
                            </Typography>
                          </Box>
                        </Box>
                        <Switch
                          checked={isChecked}
                          onChange={() => handleToggle(item.key)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#c8626d',
                              '&:hover': { backgroundColor: 'rgba(200, 98, 109, 0.08)' }
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#c8626d'
                            }
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, backgroundColor: '#ffffff', justifyContent: 'space-between', borderTop: '1px solid #eee' }}>
        <Button
          onClick={handleResetDefaults}
          startIcon={<RestartAlt />}
          sx={{ color: '#666', textTransform: 'none', fontWeight: 600 }}
        >
          Valores por defecto
        </Button>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              borderColor: '#ccc',
              color: '#555',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
            sx={{
              backgroundColor: '#c8626d',
              color: 'white',
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              '&:hover': { backgroundColor: '#b5555a' }
            }}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default PopupsVisibilityManager;
