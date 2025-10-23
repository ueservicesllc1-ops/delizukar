import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton
} from '@mui/material';
import { AccountBalance, TrendingUp, TrendingDown, Refresh, Close } from '@mui/icons-material';

const StripeBalance = ({ open, onClose }) => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/balance`);
      const data = await response.json();
      
      if (data.balance) {
        setBalance(data.balance);
      } else {
        setError('No se pudo obtener la información del balance');
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Error al obtener el balance de Stripe');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const formatAmount = (amount, currency) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Button onClick={fetchBalance} sx={{ ml: 2 }}>
          Reintentar
        </Button>
      </Alert>
    );
  }

  if (!balance) {
    return (
      <Alert severity="warning">
        No hay información de balance disponible
      </Alert>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AccountBalance sx={{ color: '#c8626d', mr: 1, fontSize: '1.5rem' }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#c8626d' }}>
            Balance de Stripe
          </Typography>
        </Box>
        <Box>
          <Button
            startIcon={<Refresh />}
            onClick={fetchBalance}
            sx={{ mr: 2, textTransform: 'none' }}
          >
            Actualizar
          </Button>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box>

      <Grid container spacing={3}>
        {/* Balance Disponible */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ color: '#4CAF50', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Disponible
                </Typography>
                <Chip 
                  label="Listo para retirar" 
                  color="success" 
                  size="small" 
                  sx={{ ml: 'auto' }}
                />
              </Box>
              
              {balance.available.length > 0 ? (
                balance.available.map((item, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#4CAF50' }}>
                      {formatAmount(item.amount, item.currency)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {item.currency.toUpperCase()} • {item.sourceTypes.card || 0} tarjetas, {item.sourceTypes.bank_account || 0} bancos
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body1" sx={{ color: '#666' }}>
                  No hay fondos disponibles
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Balance Pendiente */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingDown sx={{ color: '#FF9800', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Pendiente
                </Typography>
                <Chip 
                  label="En proceso" 
                  color="warning" 
                  size="small" 
                  sx={{ ml: 'auto' }}
                />
              </Box>
              
              {balance.pending.length > 0 ? (
                balance.pending.map((item, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#FF9800' }}>
                      {formatAmount(item.amount, item.currency)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {item.currency.toUpperCase()} • {item.sourceTypes.card || 0} tarjetas, {item.sourceTypes.bank_account || 0} bancos
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body1" sx={{ color: '#666' }}>
                  No hay fondos pendientes
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Información del Balance
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Total Disponible:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {balance.available.reduce((sum, item) => sum + item.amount, 0).toFixed(2)} USD
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Total Pendiente:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {balance.pending.reduce((sum, item) => sum + item.amount, 0).toFixed(2)} USD
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              Balance Total:
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#c8626d' }}>
              {(
                balance.available.reduce((sum, item) => sum + item.amount, 0) +
                balance.pending.reduce((sum, item) => sum + item.amount, 0)
              ).toFixed(2)} USD
            </Typography>
          </Box>
        </CardContent>
      </Card>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default StripeBalance;
