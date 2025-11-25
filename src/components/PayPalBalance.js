import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  CreditCard,
  Receipt
} from '@mui/icons-material';

const PayPalBalance = ({ open, onClose }) => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const fetchPayPalBalance = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Llamar al endpoint del backend para obtener el balance real de PayPal
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : '';
      
      const response = await fetch(`${baseUrl}/api/paypal/balance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Verificar el Content-Type antes de parsear JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Respuesta no es JSON:', text.substring(0, 200));
        throw new Error(`El servidor devolvió una respuesta no válida (${response.status}). Verifica que el servidor esté corriendo y que el endpoint /api/paypal/balance exista.`);
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Error al obtener el balance de PayPal');
      }

      if (data.balance) {
        setBalance({
          available: parseFloat(data.balance.available) || 0,
          pending: parseFloat(data.balance.pending) || 0,
          currency: data.balance.currency || 'USD',
          lastUpdated: data.balance.lastUpdated || new Date().toISOString(),
          note: data.balance.note
        });
      } else {
        throw new Error('No se recibieron datos de balance');
      }

      // Por ahora, las transacciones no están implementadas
      setTransactions([]);
    } catch (err) {
      console.error('Error fetching PayPal balance:', err);
      // Si el error es de parsing JSON, mostrar un mensaje más claro
      if (err.message.includes('JSON') || err.message.includes('<!DOCTYPE')) {
        setError('Error de conexión con el servidor. Verifica que el servidor esté corriendo en el puerto 5000.');
      } else {
        setError(err.message || 'Error al obtener el balance de PayPal');
      }
      // En caso de error, no establecer balance para que se muestre el mensaje de error
      setBalance(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchPayPalBalance();
    }
  }, [open]);

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'pending': return 'Pendiente';
      case 'failed': return 'Fallido';
      default: return status;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AccountBalance color="primary" />
          <Typography variant="h6">Balance PayPal</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {balance && !loading && (
          <Box>
            {/* Información sobre configuración o permisos */}
            {balance.note && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Nota:</strong> {balance.note}
                </Typography>
              </Alert>
            )}

            {/* Balance Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <AttachMoney color="success" />
                      <Typography variant="h6" color="success.main">
                        Disponible
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold">
                      {formatCurrency(balance.available)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Balance disponible para transferir
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <TrendingUp color="warning" />
                      <Typography variant="h6" color="warning.main">
                        Pendiente
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold">
                      {formatCurrency(balance.pending)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pagos en proceso
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <AccountBalance color="primary" />
                      <Typography variant="h6" color="primary.main">
                        Total
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold">
                      {formatCurrency(balance.available + balance.pending)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Balance total
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Recent Transactions */}
            <Typography variant="h6" gutterBottom>
              Transacciones Recientes
            </Typography>
            
            {transactions.length === 0 ? (
              <Card>
                <CardContent>
                  <Box textAlign="center" py={3}>
                    <Receipt sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No hay transacciones disponibles
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Las transacciones de PayPal aparecerán aquí una vez que se configure la integración completa.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              transactions.map((transaction) => (
                <Card key={transaction.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {transaction.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(transaction.date)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {transaction.id}
                        </Typography>
                      </Box>
                      
                      <Box textAlign="right">
                        <Typography 
                          variant="h6" 
                          fontWeight="bold"
                          color={transaction.type === 'refund' ? 'error.main' : 'success.main'}
                        >
                          {transaction.type === 'refund' ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </Typography>
                        <Chip 
                          label={getStatusText(transaction.status)}
                          color={getStatusColor(transaction.status)}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
        <Button 
          onClick={fetchPayPalBalance} 
          variant="contained"
          disabled={loading}
        >
          Actualizar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PayPalBalance;
