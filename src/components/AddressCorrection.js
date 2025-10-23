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

const AddressCorrection = ({ 
  open, 
  onClose, 
  originalAddress, 
  onAddressCorrected 
}) => {
  const [loading, setLoading] = useState(false);
  const [correctionResult, setCorrectionResult] = useState(null);
  const [error, setError] = useState(null);

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
      
      const result = await shippoService.correctAddress(correctedAddress);
      setCorrectionResult(result);
    } catch (err) {
      console.error('Error validating address:', err);
      setError('Error al validar la dirección');
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
    if (loading) return 'Validando dirección...';
    if (correctionResult?.needsCorrection) return 'Dirección necesita corrección';
    return 'Dirección válida';
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
      PaperProps={{
        sx: { borderRadius: '16px' }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: '#c8626d', 
        color: 'white',
        borderRadius: '16px 16px 0 0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationOn />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Validación de Dirección
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
                  Dirección Ingresada:
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
                      Dirección Corregida:
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
                      label={correctionResult.isResidential ? 'Residencial' : 'Comercial'} 
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
                  Sugerencias:
                </Typography>
                {correctionResult.suggestions.map((suggestion, index) => (
                  <Alert key={index} severity="info" sx={{ mb: 1 }}>
                    {typeof suggestion === 'string' ? suggestion : suggestion.text || suggestion.message || 'Sugerencia disponible'}
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
                Usar Original
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
                  Usar Corregida
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
                  Continuar
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

