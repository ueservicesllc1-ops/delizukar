import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Alert,
  TextField
} from '@mui/material';
import {
  Close,
  Print,
  GetApp,
  LocalShipping,
  CheckCircle,
  Pending,
  Email
} from '@mui/icons-material';
import { collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import emailjs from '@emailjs/browser';

const OrdersManager = ({ open, onClose }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [creatingForOrderId, setCreatingForOrderId] = useState(null);
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [labelData, setLabelData] = useState(null);
  const [testEmailDialog, setTestEmailDialog] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [addressDetailsDialog, setAddressDetailsDialog] = useState(false);
  const [addressDetails, setAddressDetails] = useState(null);

  useEffect(() => {
    if (open) {
      loadOrders();
    }
  }, [open]);

  // Inicializar EmailJS
  useEffect(() => {
    emailjs.init({
      publicKey: 'TbgeNq-PEAHvSqjzR'
    });
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const ordersRef = collection(db, 'orders');
      
      // Primero obtener todos los pedidos
      const allOrdersSnapshot = await getDocs(ordersRef);
      
      // Filtrar solo los pagados
      const paidOrders = [];
      allOrdersSnapshot.forEach((doc) => {
        const orderData = doc.data();
        console.log(`📋 Pedido ${doc.id}: paymentStatus = ${orderData.paymentStatus}, status = ${orderData.status}`);
        if (orderData.paymentStatus === 'paid') {
          paidOrders.push({
            id: doc.id,
            ...orderData
          });
        } else {
          // Eliminar pedidos de prueba (no pagados)
          console.log(`🗑️ Eliminando pedido de prueba: ${doc.id}`);
          deleteDoc(doc(db, 'orders', doc.id));
        }
      });
      
      // Ordenar por fecha descendente
      paidOrders.sort((a, b) => {
        const aDate = a.createdAt?.seconds || 0;
        const bDate = b.createdAt?.seconds || 0;
        return bDate - aDate;
      });
      
      console.log(`📦 Cargados ${paidOrders.length} pedidos pagados`);
      setOrders(paidOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      alert('Por favor ingresa un email válido');
      return;
    }

    try {
      setSendingTestEmail(true);
      
      // 1. Obtener datos del email del backend
      const baseUrl = process.env.NODE_ENV === 'production' ? window.location.origin : '';
      const response = await fetch(`${baseUrl}/api/send-test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testEmail
        })
      });

      const result = await response.json();

      if (response.ok && result.success && result.emailData) {
        // 2. Enviar email con EmailJS
        await emailjs.send(
          'service_7biylnb',
          'template_poovxvk',
          {
            to_email: result.emailData.to_email,
            to_name: result.emailData.to_name,
            order_id: result.emailData.order_id,
            tracking_code: result.emailData.tracking_code,
            tracking_url: result.emailData.tracking_url,
            label_url: result.emailData.label_url
          }
        );
        
        alert('✅ Email de prueba enviado exitosamente a ' + testEmail);
        setTestEmailDialog(false);
        setTestEmail('');
      } else {
        alert('❌ Error al enviar email: ' + (result.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error enviando email de prueba:', error);
      alert('❌ Error al enviar email: ' + error.message);
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleCreateShipment = async (order) => {
    // Prevenir múltiples clics
    if (creatingLabel || creatingForOrderId === order.id) {
      console.log('⏳ Ya se está creando un envío, esperando...');
      return;
    }
    
    setSelectedOrder(order);
    setCreatingLabel(true);
    setCreatingForOrderId(order.id);
    
    try {
      console.log('🚚 Creando envío para pedido:', order.id);
      console.log('🔵 [OrdersManager] Order data being sent:', JSON.stringify(order, null, 2));
      
      // Enviar datos completos del pedido al backend
      const baseUrl = process.env.NODE_ENV === 'production' ? window.location.origin : '';
      const response = await fetch(`${baseUrl}/api/create-shipment-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: order.id,
          order: order // Enviar el objeto completo del pedido
        })
      });

      console.log('🔵 [OrdersManager] Response status:', response.status);
      
      const result = await response.json();
      console.log('🔵 [OrdersManager] Response data:', result);

      // Si hay error, mostrar detalles de la dirección
      if (!response.ok || !result.success) {
        console.log('❌ Error creando shipment, mostrando detalles de dirección...');
        
        // Extraer datos de la dirección del pedido
        const customerInfo = order.customerInfo || {};
        const address = customerInfo.address || {};
        
        // Mostrar diálogo con detalles
        setAddressDetails({
          original: {
            name: `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`,
            street: address.line1 || '',
            city: address.city || '',
            state: address.state || '',
            zip: address.postal_code || '',
            country: address.country || 'US'
          },
          error: result.error || 'Error desconocido',
          orderId: order.id
        });
        setAddressDetailsDialog(true);
        return;
      }

      if (response.ok && result.success) {
        setLabelData({
          tracking_code: result.data.trackingCode,
          id: result.data.orderId,
          postage_label: {
            label_url: result.data.labelUrl
          }
        });
        setLabelDialogOpen(true);
        
        // Enviar email con EmailJS si hay datos de email
        if (result.data.emailData) {
          try {
            await emailjs.send(
              'service_7biylnb',
              'template_poovxvk',
              result.data.emailData
            );
            console.log('✅ Email enviado al cliente');
          } catch (emailError) {
            console.error('❌ Error enviando email:', emailError);
          }
        }
        
        // Actualizar el estado del pedido en Firestore
        const orderRef = doc(db, 'orders', order.id);
        await updateDoc(orderRef, {
          status: 'shipped',
          trackingCode: result.data.trackingCode,
          labelUrl: result.data.labelUrl,
          shippedAt: new Date().toISOString(),
          emailSent: result.data.emailData ? true : false
        });
        
        // Recargar órdenes
        loadOrders();
      } else {
        alert(result.error || 'Error al crear la etiqueta de envío');
      }
    } catch (error) {
      console.error('Error creating shipment:', error);
      alert('Error al crear la etiqueta de envío: ' + error.message);
    } finally {
      setCreatingLabel(false);
      setCreatingForOrderId(null);
      setSelectedOrder(null);
    }
  };

  const handlePrintLabel = () => {
    if (labelData?.postage_label?.label_url) {
      window.open(labelData.postage_label.label_url, '_blank');
    }
  };

  const handleDownloadLabel = () => {
    if (labelData?.postage_label?.label_url) {
      const link = document.createElement('a');
      link.href = labelData.postage_label.label_url;
      link.download = `label-${labelData.tracking_code}.pdf`;
      link.click();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'shipped':
        return 'success';
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'shipped':
        return <CheckCircle />;
      case 'pending':
        return <Pending />;
      default:
        return <LocalShipping />;
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }
        }}
        sx={{
          zIndex: 9999 // Asegurar que esté por encima del header
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#C8626D', 
          color: 'white', 
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LocalShipping sx={{ fontSize: 24, color: 'white' }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
              Gestión de Pedidos y Envíos
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Email />}
              onClick={() => setTestEmailDialog(true)}
              sx={{
                borderColor: 'white',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Email de Prueba
            </Button>
            <IconButton
              onClick={onClose}
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, backgroundColor: '#fafafa' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#C8626D' }} />
            </Box>
          ) : orders.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <LocalShipping sx={{ fontSize: 64, color: '#C8626D', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#C8626D', mb: 2, fontWeight: 600 }}>
                No hay pedidos registrados
              </Typography>
              <Typography variant="body1" sx={{ color: '#666' }}>
                Los pedidos aparecerán aquí cuando se completen las compras.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Pedido ID</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Seguimiento</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.id.substring(0, 8)}...</TableCell>
                      <TableCell>
                        {order.customerInfo?.firstName} {order.customerInfo?.lastName}
                      </TableCell>
                      <TableCell>
                        {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        ${order.total?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(order.status)}
                          label={order.status || 'pending'}
                          color={getStatusColor(order.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {order.trackingCode || '-'}
                      </TableCell>
                      <TableCell align="center">
                        {(order.status === 'pending' || !order.status || order.status === 'processing') && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<LocalShipping />}
                            onClick={() => handleCreateShipment(order)}
                            disabled={creatingLabel || creatingForOrderId === order.id}
                            sx={{
                              backgroundColor: '#C8626D',
                              '&:hover': { backgroundColor: '#b8555a' }
                            }}
                          >
                            {creatingForOrderId === order.id ? 'Creando...' : 'Crear Envío'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para mostrar etiqueta */}
      <Dialog
        open={labelDialogOpen}
        onClose={() => setLabelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          zIndex: 1500 // Asegurar que esté por encima del modal de pedidos
        }}
      >
        <DialogTitle sx={{ backgroundColor: '#C8626D', color: 'white' }}>
          Etiqueta de Envío Generada
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {labelData && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Etiqueta generada exitosamente
              </Alert>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Código de seguimiento:</strong> {labelData.tracking_code}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>ID de etiqueta:</strong> {labelData.id}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={handlePrintLabel}
            sx={{ borderColor: '#C8626D', color: '#C8626D' }}
          >
            Imprimir
          </Button>
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={handleDownloadLabel}
            sx={{ borderColor: '#C8626D', color: '#C8626D' }}
          >
            Descargar PDF
          </Button>
          <Button
            variant="contained"
            onClick={() => setLabelDialogOpen(false)}
            sx={{ backgroundColor: '#C8626D', '&:hover': { backgroundColor: '#b8555a' } }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para enviar email de prueba */}
      <Dialog
        open={testEmailDialog}
        onClose={() => !sendingTestEmail && setTestEmailDialog(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          zIndex: 16000
        }}
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

      {/* Dialog para detalles de dirección */}
      <Dialog
        open={addressDetailsDialog}
        onClose={() => setAddressDetailsDialog(false)}
        maxWidth="md"
        fullWidth
        sx={{
          zIndex: 16000
        }}
      >
        <DialogTitle sx={{ backgroundColor: '#d32f2f', color: 'white' }}>
          ⚠️ Error al Crear Envío - Detalles de Dirección
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Error: {addressDetails?.error}
            </Typography>
          </Alert>
          
          {addressDetails && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                📋 Pedido ID: {addressDetails.orderId}
              </Typography>
              
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 700, color: '#C8626D' }}>
                Dirección Original (desde Firestore):
              </Typography>
              <Box sx={{ 
                backgroundColor: '#f5f5f5', 
                p: 2, 
                borderRadius: 1,
                mb: 2
              }}>
                <Typography variant="body1"><strong>Nombre:</strong> {addressDetails.original.name}</Typography>
                <Typography variant="body1"><strong>Calle:</strong> {addressDetails.original.street}</Typography>
                <Typography variant="body1"><strong>Ciudad:</strong> {addressDetails.original.city}</Typography>
                <Typography variant="body1"><strong>Estado:</strong> {addressDetails.original.state}</Typography>
                <Typography variant="body1"><strong>Zip:</strong> {addressDetails.original.zip}</Typography>
                <Typography variant="body1"><strong>País:</strong> {addressDetails.original.country}</Typography>
              </Box>

              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 700, color: '#1976d2' }}>
                ℹ️ Información para EasyPost:
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Esta es la dirección exacta que estamos enviando a EasyPost.
                  Revisa los logs del servidor (consola de terminal) para ver:
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  • Dirección corregida por EasyPost (si aplica)<br/>
                  • Código de estado de verificación<br/>
                  • Respuesta completa de la API de EasyPost
                </Typography>
              </Alert>

              <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: '#666' }}>
                💡 <strong>Sugerencia:</strong> Abre la consola de terminal donde corre el servidor Node.js 
                para ver los logs detallados con el prefijo <code>🔍 [Address Debug]</code> y 
                <code>📍 DIRECCIÓN EXACTA A ENVIAR A EASYPOST:</code>
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            onClick={() => setAddressDetailsDialog(false)}
            sx={{ 
              backgroundColor: '#C8626D', 
              '&:hover': { backgroundColor: '#b8555a' } 
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OrdersManager;
