import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ThemeProvider,
  createTheme
} from '@mui/material';
import {
  LocalShipping,
  CheckCircle,
  Pending,
  Close,
  Email
} from '@mui/icons-material';
import axios from 'axios';

// Crear tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#C8626D',
    },
  },
});

const API_URL = 'http://localhost:5000';

function App() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingShipment, setCreatingShipment] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [testEmailDialog, setTestEmailDialog] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  // Cargar pedidos al iniciar
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/orders`);
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      showSnackbar('Error al cargar pedidos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShipment = async (orderId) => {
    try {
      setCreatingShipment(orderId);
      
      const response = await axios.post(`${API_URL}/api/create-shipment`, {
        orderId
      });

      if (response.data.success) {
        showSnackbar('Envío creado exitosamente y email enviado al cliente', 'success');
        // Recargar la lista de pedidos
        await loadOrders();
      } else {
        showSnackbar(response.data.error || 'Error al crear envío', 'error');
      }
    } catch (error) {
      console.error('Error creando envío:', error);
      showSnackbar(error.response?.data?.error || 'Error al crear envío', 'error');
    } finally {
      setCreatingShipment(null);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSendTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      showSnackbar('Por favor ingresa un email válido', 'error');
      return;
    }

    try {
      setSendingTestEmail(true);
      
      const response = await axios.post(`${API_URL}/api/send-test-email`, {
        email: testEmail
      });

      if (response.data.success) {
        showSnackbar('Email de prueba enviado exitosamente', 'success');
        setTestEmailDialog(false);
        setTestEmail('');
      } else {
        showSnackbar(response.data.error || 'Error al enviar email', 'error');
      }
    } catch (error) {
      console.error('Error enviando email de prueba:', error);
      showSnackbar(error.response?.data?.error || 'Error al enviar email', 'error');
    } finally {
      setSendingTestEmail(false);
    }
  };

  const getStatusChip = (order) => {
    if (order.tracking_code) {
      return (
        <Chip
          icon={<CheckCircle />}
          label="Enviado"
          color="success"
          size="small"
        />
      );
    }
    return (
      <Chip
        icon={<Pending />}
        label="Pendiente"
        color="warning"
        size="small"
      />
    );
  };

  return (
    <ThemeProvider theme={theme}>
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: '#C8626D', mb: 1 }}>
          📦 Gestión de Envíos
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Administra tus pedidos y crea envíos automáticos
        </Typography>
        
        {/* Botón para enviar email de prueba */}
        <Button
          variant="outlined"
          startIcon={<Email />}
          onClick={() => setTestEmailDialog(true)}
          sx={{
            borderColor: '#C8626D',
            color: '#C8626D',
            '&:hover': {
              borderColor: '#b8555a',
              backgroundColor: 'rgba(200, 98, 109, 0.1)'
            }
          }}
        >
          Enviar Email de Prueba
        </Button>
      </Box>

      {/* Tabla de pedidos */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#C8626D' }} />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead sx={{ backgroundColor: '#C8626D' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>ID Pedido</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Cliente</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Estado</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Tracking</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, textAlign: 'center' }}>
                  Acción
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  sx={{
                    '&:nth-of-type(odd)': {
                      backgroundColor: '#fafafa'
                    },
                    '&:hover': {
                      backgroundColor: '#f5f5f5'
                    }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {order.id}
                    </Typography>
                  </TableCell>
                  <TableCell>{order.nombre}</TableCell>
                  <TableCell>{order.email}</TableCell>
                  <TableCell>
                    {getStatusChip(order)}
                  </TableCell>
                  <TableCell>
                    {order.tracking_code ? (
                      <Typography
                        variant="body2"
                        component="a"
                        href={`https://track.easypost.com/d/${order.tracking_code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: '#C8626D',
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {order.tracking_code}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {!order.tracking_code ? (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<LocalShipping />}
                        onClick={() => handleCreateShipment(order.id)}
                        disabled={creatingShipment === order.id}
                        sx={{
                          backgroundColor: '#C8626D',
                          '&:hover': {
                            backgroundColor: '#b8555a'
                          }
                        }}
                      >
                        {creatingShipment === order.id ? (
                          <>
                            <CircularProgress size={16} sx={{ mr: 1 }} />
                            Creando...
                          </>
                        ) : (
                          'Crear Envío'
                        )}
                      </Button>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Envío creado
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Dialog para email de prueba */}
      <Dialog
        open={testEmailDialog}
        onClose={() => !sendingTestEmail && setTestEmailDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#C8626D', color: 'white' }}>
          Enviar Email de Prueba
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Ingresa el correo donde quieres recibir el email de prueba del envío.
          </Alert>
          <TextField
            autoFocus
            margin="dense"
            label="Correo electrónico"
            type="email"
            fullWidth
            variant="outlined"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="tu@email.com"
            disabled={sendingTestEmail}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setTestEmailDialog(false)}
            disabled={sendingTestEmail}
            sx={{ color: '#666' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSendTestEmail}
            disabled={sendingTestEmail || !testEmail}
            variant="contained"
            sx={{
              backgroundColor: '#C8626D',
              '&:hover': { backgroundColor: '#b8555a' }
            }}
          >
            {sendingTestEmail ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Enviando...
              </>
            ) : (
              'Enviar'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    </ThemeProvider>
  );
}

export default App;
