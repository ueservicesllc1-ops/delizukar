import React, { useState } from 'react';
import { 
  Button, 
  Box, 
  Typography, 
  CircularProgress, 
  TextField, 
  Grid,
  Card
} from '@mui/material';
import { useStore } from '../context/StoreContext';
import toast from 'react-hot-toast';

const SimpleCheckout = () => {
  const { cart, getCartTotal } = useStore();
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: ''
  });

  const handleInputChange = (field) => (e) => {
    setCardData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simular procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Payment processed successfully');
      // Aquí irías a la página de éxito
    } catch (error) {
      toast.error('Error processing payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ p: 1.5, maxWidth: 'none' }}>
      <Typography variant="h6" sx={{ mb: 1, color: '#c8626d', fontWeight: 600 }}>
        Información de Pago
      </Typography>
      
      <Typography variant="h6" sx={{ mb: 2, color: '#c8626d', fontWeight: 600 }}>
        Total: ${getCartTotal().toFixed(2)}
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={1.5}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nombre en la Tarjeta"
              value={cardData.nameOnCard}
              onChange={handleInputChange('nameOnCard')}
              size="small"
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Número de Tarjeta"
              value={cardData.cardNumber}
              onChange={handleInputChange('cardNumber')}
              size="small"
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              <TextField
                label="MM/AA"
                value={cardData.expiryDate}
                onChange={handleInputChange('expiryDate')}
                size="small"
                sx={{ width: '115px' }}
                required
              />
              <TextField
                label="CVV"
                value={cardData.cvv}
                onChange={handleInputChange('cvv')}
                size="small"
                sx={{ width: '115px' }}
                required
              />
            </Box>
          </Grid>
        </Grid>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{
            mt: 2,
            backgroundColor: '#C8626D',
            color: 'white',
            '&:hover': {
              backgroundColor: '#c8626d'
            }
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Pagar Ahora'}
        </Button>

        <Box sx={{ mt: 2, p: 1, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
            Tarjetas aceptadas: Visa, Mastercard, American Express, Discover
          </Typography>
        </Box>
        
        <Box sx={{ mt: 1, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
            Tarjetas de Prueba: Visa: 4242 4242 4242 4242 | Mastercard: 5555 5555 5555 4444
          </Typography>
        </Box>
      </Box>
    </Card>
  );
};

export default SimpleCheckout;
