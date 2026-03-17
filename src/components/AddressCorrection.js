import React, { useState } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  Chip,
  Divider,
  CircularProgress
} from '@mui/material';
import { LocationOn, CheckCircle, Warning, Edit } from '@mui/icons-material';
import shippoService from '../services/shippoService';
import useIphone16 from '../hooks/useIphone16';
import { useLanguage } from '../context/LanguageContext';

const ADDRESS_CORRECTION_TRANSLATIONS = {
  es: {
    title: 'Validación de Dirección',
    validating: 'Validando dirección...',
    needsCorrection: 'La dirección necesita corrección',
    validAddress: 'Dirección Válida',
    enteredAddress: 'Dirección Ingresada:',
    correctedAddress: 'Dirección Corregida:',
    residential: 'Residencial',
    commercial: 'Comercial',
    suggestions: 'Sugerencias:',
    suggestionAvailable: 'Sugerencia disponible',
    useOriginal: 'Usar Original',
    useCorrected: 'Usar Corregida',
    continue: 'Continuar',
    errorValidation: 'Error al validar la dirección',
    cannotValidate: 'La dirección no pudo ser validada'
  },
  en: {
    title: 'Address Validation',
    validating: 'Validating address...',
    needsCorrection: 'Address needs correction',
    validAddress: 'Valid Address',
    enteredAddress: 'Entered Address:',
    correctedAddress: 'Corrected Address:',
    residential: 'Residential',
    commercial: 'Commercial',
    suggestions: 'Suggestions:',
    suggestionAvailable: 'Suggestion available',
    useOriginal: 'Use Original',
    useCorrected: 'Use Corrected',
    continue: 'Continue',
    errorValidation: 'Error validating address',
    cannotValidate: 'Address could not be validated'
  }
};

const AddressCorrection = ({ 
  open, 
  onClose, 
  originalAddress, 
  onAddressCorrected 
}) => {
  const { language } = useLanguage();
  const translations = ADDRESS_CORRECTION_TRANSLATIONS[language] || ADDRESS_CORRECTION_TRANSLATIONS.es;
  const t = (key) => translations[key] || key;
  const [loading, setLoading] = useState(false);
  const [correctionResult, setCorrectionResult] = useState(null);
  const [error, setError] = useState(null);
  const isIphone16 = useIphone16();

  // Validar dirección cuando se abre el modal
  React.useEffect(() => {
    if (open && originalAddress) {
      validateAddress();
    }
  }, [open, originalAddress]);

  const validateAddress = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Corregir automáticamente Paterson de NY a NJ
      let correctedAddress = { ...originalAddress };
      if (correctedAddress.city && correctedAddress.city.toLowerCase().includes('paterson') && correctedAddress.state === 'NY') {
        correctedAddress.state = 'NJ';
        console.log('🔧 Auto-correcting Paterson from NY to NJ');
      }
      
      // Validar dirección con Shippo
      const result = await shippoService.validateAddress(correctedAddress);
      
      if (result.isValid || result.is_valid) {
        setCorrectionResult({
          success: true,
          address: result.validated_address || result.corrected_address || correctedAddress,
          corrected: result.was_corrected || result.corrected || false,
          original: correctedAddress,
          messages: result.validation_messages || []
        });
      } else {
        setCorrectionResult({
          success: false,
          address: correctedAddress,
          messages: result.validation_messages || [t('cannotValidate')]
        });
      }
    } catch (err) {
      console.error('❌ [AddressCorrection] Error validating address:', err);
      console.error('   Error message:', err.message);
      console.error('   Original error:', err.originalError);
      
      // Mostrar mensaje de error más descriptivo
      const errorMessage = err.message || t('errorValidation');
      setError(errorMessage);
      
      // También mostrar en la consola para debugging
      if (err.originalError) {
        console.error('   Detalles del error original:', err.originalError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUseCorrected = () => {
    if (correctionResult && correctionResult.corrected) {
      onAddressCorrected(correctionResult.corrected);
      onClose();
    }
  };

  const handleUseOriginal = () => {
    onAddressCorrected(originalAddress);
    onClose();
  };

  const getStatusIcon = () => {
    if (loading) return <CircularProgress size={20} />;
    if (correctionResult?.needsCorrection) return <Warning color="warning" />;
    return <CheckCircle color="success" />;
  };

  const getStatusText = () => {
    if (loading) return t('validating');
    if (correctionResult?.needsCorrection) return t('needsCorrection');
    return t('validAddress');
  };

  const getStatusColor = () => {
    if (loading) return 'info';
    if (correctionResult?.needsCorrection) return 'warning';
    return 'success';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={
        isIphone16
          ? {
              zIndex: 1000001,
              '& .MuiDialog-container': {
                alignItems: 'center'
              }
            }
          : undefined
      }
      PaperProps={{
        sx: {
          borderRadius: '16px',
          ...(isIphone16
            ? {
                position: 'relative',
                zIndex: 1000002
              }
            : {})
        }
      }}
      slotProps={
        isIphone16
          ? {
              root: { className: 'iphone-modal-elevated' },
              backdrop: { className: 'iphone-modal-backdrop' }
            }
          : undefined
      }
      BackdropProps={
        isIphone16
          ? {
              sx: {
                zIndex: 1000000,
                backgroundColor: 'rgba(0,0,0,0.45)'
              }
            }
          : undefined
      }
    >
      <DialogTitle sx={{ 
        backgroundColor: '#c8626d', 
        color: 'white',
        borderRadius: '16px 16px 0 0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationOn />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('title')}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Estado de validación */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {getStatusIcon()}
            <Typography variant="h6" color={getStatusColor()}>
              {getStatusText()}
            </Typography>
          </Box>
        </Box>

        {correctionResult && (
          <>
            {/* Dirección original */}
            <Card sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  {t('enteredAddress')}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {originalAddress.name}<br />
                  {originalAddress.street1}<br />
                  {originalAddress.city}, {originalAddress.state} {originalAddress.zip}<br />
                  {originalAddress.country}
                </Typography>
              </CardContent>
            </Card>

            {/* Dirección corregida */}
            {correctionResult.needsCorrection && (
              <Card sx={{ mb: 2, border: '1px solid #4CAF50', backgroundColor: '#f8fff8' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CheckCircle color="success" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                      {t('correctedAddress')}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {correctionResult.corrected.name}<br />
                    {correctionResult.corrected.street1}<br />
                    {correctionResult.corrected.city}, {correctionResult.corrected.state} {correctionResult.corrected.zip}<br />
                    {correctionResult.corrected.country}
                  </Typography>
                  
                  {/* Información adicional */}
                  <Box sx={{ mt: 2 }}>
                    <Chip 
                      label={correctionResult.isResidential ? t('residential') : t('commercial')} 
                      size="small" 
                      color={correctionResult.isResidential ? 'primary' : 'secondary'}
                    />
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Sugerencias y mensajes */}
            {correctionResult.suggestions && correctionResult.suggestions.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  {t('suggestions')}
                </Typography>
                {correctionResult.suggestions.map((suggestion, index) => (
                  <Alert key={index} severity="info" sx={{ mb: 1 }}>
                    {typeof suggestion === 'string' ? suggestion : suggestion.text || suggestion.message || t('suggestionAvailable')}
                  </Alert>
                ))}
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Botones de acción */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleUseOriginal}
                sx={{
                  borderColor: '#c8626d',
                  color: '#c8626d',
                  '&:hover': {
                    borderColor: '#b5555a',
                    backgroundColor: '#c8626d10'
                  }
                }}
              >
                {t('useOriginal')}
              </Button>
              
              {correctionResult.needsCorrection && (
                <Button
                  variant="contained"
                  onClick={handleUseCorrected}
                  startIcon={<Edit />}
                  sx={{
                    backgroundColor: '#4CAF50',
                    '&:hover': {
                      backgroundColor: '#45a049'
                    }
                  }}
                >
                  {t('useCorrected')}
                </Button>
              )}
              
              {!correctionResult.needsCorrection && (
                <Button
                  variant="contained"
                  onClick={handleUseOriginal}
                  sx={{
                    backgroundColor: '#c8626d',
                    '&:hover': {
                      backgroundColor: '#b5555a'
                    }
                  }}
                >
                  {t('continue')}
                </Button>
              )}
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddressCorrection;

