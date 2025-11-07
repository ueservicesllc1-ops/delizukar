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
  TextField,
  Tabs,
  Tab
} from '@mui/material';
import {
  Close,
  Print,
  GetApp,
  LocalShipping,
  CheckCircle,
  Pending,
  Email,
  Receipt
} from '@mui/icons-material';
import { collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import emailjs from '@emailjs/browser';
import ShippoShippingElements from './ShippoShippingElements';

const OrdersManager = ({ open, onClose, initialTab = 'all' }) => {
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
  const [shippoElementsOpen, setShippoElementsOpen] = useState(false);
  const [shippoOrderData, setShippoOrderData] = useState(null);
  const [currentTab, setCurrentTab] = useState(initialTab);

  useEffect(() => {
    if (open) {
      loadOrders();
      setCurrentTab(initialTab);
    }
  }, [open, initialTab]);

  // Inicializar EmailJS
  useEffect(() => {
    const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
    if (publicKey) {
      emailjs.init({
        publicKey: publicKey
      });
      console.log('✅ EmailJS inicializado con publicKey');
    } else {
      console.warn('⚠️ REACT_APP_EMAILJS_PUBLIC_KEY no está configurada');
    }
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const ordersRef = collection(db, 'orders');
      
      // Primero obtener todos los pedidos
      const allOrdersSnapshot = await getDocs(ordersRef);
      
      // Filtrar solo los pagados
      const paidOrders = [];
      const allOrders = [];
      allOrdersSnapshot.forEach((docSnap) => {
        const orderData = docSnap.data();
        allOrders.push({ id: docSnap.id, ...orderData });
        console.log(`📋 Pedido ${docSnap.id}:`, {
          paymentStatus: orderData.paymentStatus,
          status: orderData.status,
          total: orderData.total,
          customerEmail: orderData.customerInfo?.email,
          createdAt: orderData.createdAt
        });
        
        if (orderData.paymentStatus === 'paid') {
          paidOrders.push({
            id: docSnap.id,
            ...orderData
          });
          console.log(`✅ Pedido ${docSnap.id} agregado (paymentStatus = paid)`);
        } else {
          // Eliminar pedidos de prueba (no pagados)
          console.log(`🗑️ Eliminando pedido de prueba: ${docSnap.id} (paymentStatus = ${orderData.paymentStatus})`);
          deleteDoc(doc(db, 'orders', docSnap.id)).catch(err => {
            console.error(`❌ Error eliminando pedido ${docSnap.id}:`, err);
          });
        }
      });
      
      console.log(`📊 Resumen: ${allOrders.length} pedidos totales, ${paidOrders.length} pedidos pagados`);
      
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
        const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_7biylnb';
        const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_poovxvk';
        const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
        
        if (!publicKey) {
          throw new Error('REACT_APP_EMAILJS_PUBLIC_KEY no está configurada');
        }
        
        await emailjs.send(
          serviceId,
          templateId,
          {
            to_email: result.emailData.to_email,
            to_name: result.emailData.to_name,
            order_id: result.emailData.order_id,
            tracking_code: result.emailData.tracking_code,
            tracking_url: result.emailData.tracking_url,
            label_url: result.emailData.label_url
          },
          {
            publicKey: publicKey
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

  // Preparar datos del pedido para Shippo Shipping Elements
  // Formato según: https://docs.goshippo.com/docs/shippingelements/install/
  const prepareOrderDataForShippo = (order) => {
    const customerInfo = order.customerInfo || {};
    const address = customerInfo.address || {};
    const cartItems = order.cartItems || [];
    
    // Calcular peso total basado en los productos (100 gramos = 0.22 lb por galleta)
    const totalWeight = cartItems.reduce((total, item) => {
      return total + ((item.quantity || 1) * 0.22); // 0.22 lb por galleta (100g)
    }, 0);
    const finalWeight = Math.max(0.22, Math.round(totalWeight * 100) / 100); // Mínimo 0.22 lb (1 galleta), redondeado a 2 decimales
    
    // Calcular total del pedido
    const orderTotal = cartItems.reduce((total, item) => {
      return total + ((parseFloat(item.price) || 0) * (item.quantity || 1));
    }, 0);
    
    return {
      address_from: {
        name: 'Delizukar',
        street1: '123 Delizukar St',
        city: 'Miami',
        state: 'FL',
        zip: '33101',
        country: 'US',
        email: 'envios@delizukar.com',
        phone: ''
      },
      address_to: {
        name: `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim(),
        street1: address.line1 || '',
        city: address.city || '',
        state: address.state || '',
        zip: address.postal_code || '',
        country: address.country || 'US',
        email: customerInfo.email || '',
        phone: customerInfo.phone || ''
      },
      parcels: [{
        length: '10',
        width: '10',
        height: '10',
        distance_unit: 'in',
        weight: String(finalWeight),
        mass_unit: 'lb'
      }],
      cartItems: cartItems, // Incluir cartItems para que el widget use datos reales
      orderTotal: orderTotal, // Incluir total para referencia
      order_number: order.id || order.sessionId || undefined
    };
  };

  // Abrir widget de Shippo Shipping Elements
  const handleOpenShippoElements = (order) => {
    const orderData = prepareOrderDataForShippo(order);
    setShippoOrderData(orderData);
    setShippoElementsOpen(true);
  };

  // Callback cuando se cierra el widget de Shippo
  const handleShippoElementsClose = (labelData) => {
    setShippoElementsOpen(false);
    setShippoOrderData(null);
    
    if (labelData) {
      // Si se compró una etiqueta, actualizar el pedido
      console.log('✅ Etiqueta comprada desde Shippo Elements:', labelData);
      // Recargar órdenes para ver los cambios
      loadOrders();
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

      // Si hay error, verificar si es error de método de pago
      if (!response.ok || !result.success) {
        console.log('❌ Error creando shipment:', result);
        console.log('🔍 Verificando si es error de método de pago...');
        console.log('   result.data:', result.data);
        console.log('   result.data?.pendingPayment:', result.data?.pendingPayment);
        console.log('   result.error:', result.error);
        console.log('   result.message:', result.message);
        
        // Si es error de método de pago, mostrar modal con información del shipment
        // Verificar tanto result.data.pendingPayment como el mensaje de error
        const errorText = (result.error || result.message || '').toLowerCase();
        const isPaymentMethodError = (result.data && result.data.pendingPayment) || 
                                     errorText.includes('payment method') || 
                                     errorText.includes('método de pago') ||
                                     errorText.includes('billing') ||
                                     errorText.includes('no se pudo procesar el pago') ||
                                     errorText.includes('transacción se creó pero no se obtuvo información') ||
                                     errorText.includes('you are required to have a valid payment method');
        
        console.log('🔍 isPaymentMethodError:', isPaymentMethodError);
        console.log('🔍 result.data?.shipmentId:', result.data?.shipmentId);
        
        // Si es error de método de pago Y tiene información del shipment, mostrar modal
        if (isPaymentMethodError && result.data && result.data.shipmentId) {
          console.log('⚠️ Shipment creado pero falló el pago por falta de método de pago');
          console.log('📋 Mostrando modal con información del shipment');
          
          setLabelData({
            id: order.id,
            shipmentId: result.data.shipmentId,
            rateId: result.data.rateId,
            shippoUrl: result.data.shippoUrl,
            carrier: result.data.carrier,
            service: result.data.service,
            shippingCost: result.data.shippingCost,
            pendingPayment: true,
            error: result.error || result.message || 'Error al pagar la etiqueta',
            message: result.message || 'No se pudo procesar el pago porque no hay un método de pago válido en Shippo. Ve a Shippo para agregar un método de pago y pagar la etiqueta manualmente.'
          });
          setLabelDialogOpen(true);
          
          // Guardar información del shipment en Firestore
          const orderRef = doc(db, 'orders', order.id);
          await updateDoc(orderRef, {
            shippoShipmentId: result.data.shipmentId,
            shippoRateId: result.data.rateId,
            shippoUrl: result.data.shippoUrl,
            selectedCarrier: result.data.carrier,
            selectedService: result.data.service,
            shippingCost: result.data.shippingCost,
            status: 'pending',
            updatedAt: new Date().toISOString()
          });
          
          return;
        }
        
        // Si no es error de método de pago, mostrar error genérico
        const errorMessage = result.message || result.error || 'Error al crear la etiqueta';
        console.error('❌ Error genérico (no es de método de pago):', errorMessage);
        alert('❌ Error: ' + errorMessage);
        return;
      }

      if (response.ok && result.success) {
        // Etiqueta pagada exitosamente
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
            const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_7biylnb';
            const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_poovxvk';
            const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
            
            if (!publicKey) {
              console.error('❌ REACT_APP_EMAILJS_PUBLIC_KEY no está configurada');
            } else {
              await emailjs.send(
                serviceId,
                templateId,
                result.data.emailData,
                {
                  publicKey: publicKey
                }
              );
              console.log('✅ Email enviado al cliente');
            }
          } catch (emailError) {
            console.error('❌ Error enviando email:', emailError);
            console.error('   Status:', emailError.status);
            console.error('   Text:', emailError.text);
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

  // Filtrar órdenes según la pestaña activa
  const getFilteredOrders = () => {
    if (currentTab === 'labels') {
      // Solo órdenes con etiquetas compradas (status: 'shipped' y trackingCode)
      return orders.filter(order => 
        order.status === 'shipped' && 
        (order.trackingCode || order.labelUrl)
      );
    }
    return orders; // Todas las órdenes
  };

  const filteredOrders = getFilteredOrders();

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
        
        <DialogContent sx={{ p: 0, backgroundColor: '#fafafa' }}>
          {/* Pestañas */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: 'white' }}>
            <Tabs 
              value={currentTab} 
              onChange={(e, newValue) => setCurrentTab(newValue)}
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  minHeight: 64
                },
                '& .Mui-selected': {
                  color: '#C8626D'
                }
              }}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab 
                icon={<LocalShipping />} 
                iconPosition="start"
                label="Todas las Órdenes" 
                value="all"
                sx={{ color: currentTab === 'all' ? '#C8626D' : '#666' }}
              />
              <Tab 
                icon={<Receipt />} 
                iconPosition="start"
                label={`Etiquetas Compradas (${orders.filter(o => o.status === 'shipped' && (o.trackingCode || o.labelUrl)).length})`} 
                value="labels"
                sx={{ color: currentTab === 'labels' ? '#C8626D' : '#666' }}
              />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#C8626D' }} />
              </Box>
            ) : filteredOrders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                {currentTab === 'labels' ? (
                  <>
                    <Receipt sx={{ fontSize: 64, color: '#C8626D', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#C8626D', mb: 2, fontWeight: 600 }}>
                      No hay etiquetas compradas
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#666' }}>
                      Las etiquetas compradas aparecerán aquí cuando uses el botón "Auto" para crear envíos.
                    </Typography>
                  </>
                ) : (
                  <>
                    <LocalShipping sx={{ fontSize: 64, color: '#C8626D', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#C8626D', mb: 2, fontWeight: 600 }}>
                      No hay pedidos registrados
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#666' }}>
                      Los pedidos aparecerán aquí cuando se completen las compras.
                    </Typography>
                  </>
                )}
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
                      {currentTab === 'labels' && <TableCell>Etiqueta</TableCell>}
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOrders.map((order) => (
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
                        {order.trackingCode ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                              {order.trackingCode}
                            </Typography>
                            {order.trackingUrl && (
                              <Button
                                size="small"
                                href={order.trackingUrl}
                                target="_blank"
                                sx={{ mt: 0.5, fontSize: '0.7rem', p: 0 }}
                              >
                                Rastrear
                              </Button>
                            )}
                          </Box>
                        ) : '-'}
                      </TableCell>
                      {currentTab === 'labels' && (
                        <TableCell>
                          {order.labelUrl ? (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Print />}
                                onClick={() => {
                                  setLabelData({
                                    tracking_code: order.trackingCode,
                                    id: order.id,
                                    postage_label: {
                                      label_url: order.labelUrl
                                    }
                                  });
                                  setLabelDialogOpen(true);
                                }}
                                sx={{
                                  borderColor: '#C8626D',
                                  color: '#C8626D',
                                  '&:hover': {
                                    borderColor: '#b8555a',
                                    backgroundColor: '#C8626D10'
                                  }
                                }}
                              >
                                Ver/Imprimir
                              </Button>
                            </Box>
                          ) : '-'}
                        </TableCell>
                      )}
                      <TableCell align="center">
                        {currentTab === 'labels' ? (
                          // En la pestaña de etiquetas, mostrar botón para ver/imprimir
                          order.labelUrl && (
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<Print />}
                              onClick={() => {
                                setLabelData({
                                  tracking_code: order.trackingCode,
                                  id: order.id,
                                  postage_label: {
                                    label_url: order.labelUrl
                                  }
                                });
                                setLabelDialogOpen(true);
                              }}
                              sx={{
                                backgroundColor: '#C8626D',
                                '&:hover': { backgroundColor: '#b8555a' }
                              }}
                            >
                              Ver Etiqueta
                            </Button>
                          )
                        ) : (
                          // En la pestaña de todas las órdenes, mostrar botones Auto/Widget
                          (order.status === 'pending' || !order.status || order.status === 'processing') && (
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
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
                                {creatingForOrderId === order.id ? 'Creando...' : 'Auto'}
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<LocalShipping />}
                                onClick={() => handleOpenShippoElements(order)}
                                disabled={shippoElementsOpen}
                                sx={{
                                  borderColor: '#C8626D',
                                  color: '#C8626D',
                                  '&:hover': { 
                                    borderColor: '#b8555a',
                                    backgroundColor: '#C8626D10'
                                  }
                                }}
                              >
                                Widget
                              </Button>
                            </Box>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialog para mostrar etiqueta */}
      <Dialog
        open={labelDialogOpen}
        onClose={() => setLabelDialogOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{
          zIndex: 17001, // Muy alto para estar por encima de todo
          '& .MuiDialog-paper': {
            zIndex: 17001
          },
          '& .MuiBackdrop-root': {
            zIndex: 17000
          }
        }}
        BackdropProps={{
          sx: {
            zIndex: 17000
          }
        }}
      >
        <DialogTitle sx={{ backgroundColor: '#C8626D', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalShipping />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {labelData?.pendingPayment ? '⚠️ Shipment Creado - Pendiente de Pago' : '✅ Etiqueta de Envío Generada'}
            </Typography>
          </Box>
          <IconButton
            onClick={() => setLabelDialogOpen(false)}
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
        {labelData && (
          <Box>
            {labelData.pendingPayment ? (
              // Shipment creado, pendiente de pago
              <>
                <Alert severity="error" sx={{ mb: 3 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                    ❌ Error: Falta método de pago en Shippo
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>El pago no pudo realizarse porque falta un método de pago válido en tu cuenta de Shippo.</strong>
                  </Typography>
                  <Typography variant="body2">
                    El shipment se creó correctamente, pero necesitas agregar un método de pago en Shippo para poder pagar la etiqueta de envío. Haz clic en el botón "Ir a Shippo" para agregar tu método de pago y completar el pago manualmente.
                  </Typography>
                </Alert>
                
                <Box sx={{ 
                  backgroundColor: '#f5f5f5', 
                  p: 2, 
                  borderRadius: '8px', 
                  mb: 3,
                  border: '1px solid #e0e0e0'
                }}>
                  <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                    <strong>Información del Shipment:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                    <strong>Shipment ID:</strong> {labelData.shipmentId}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                    <strong>Carrier:</strong> {labelData.carrier}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                    <strong>Servicio:</strong> {labelData.service}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                    <strong>Costo:</strong> ${labelData.shippingCost}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    <strong>ID de pedido:</strong> {labelData.id}
                  </Typography>
                </Box>

                <Box sx={{ 
                  backgroundColor: '#fff3cd', 
                  p: 2, 
                  borderRadius: '8px',
                  border: '1px solid #ffc107',
                  mb: 3
                }}>
                  <Typography variant="body2" sx={{ color: '#856404', mb: 1, fontWeight: 600 }}>
                    📋 Instrucciones para completar el pago:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#856404', fontSize: '0.9rem', mb: 1 }}>
                    <strong>Paso 1:</strong> Haz clic en el botón <strong>"Ir a Shippo"</strong> que aparece abajo
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#856404', fontSize: '0.9rem', mb: 1 }}>
                    <strong>Paso 2:</strong> En Shippo, ve a la sección de <strong>"Billing"</strong> o <strong>"Payment Methods"</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#856404', fontSize: '0.9rem', mb: 1 }}>
                    <strong>Paso 3:</strong> Agrega tu tarjeta de crédito o método de pago
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#856404', fontSize: '0.9rem', mb: 1 }}>
                    <strong>Paso 4:</strong> Regresa al shipment y selecciona el rate para pagar la etiqueta
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#856404', fontSize: '0.9rem' }}>
                    <strong>Paso 5:</strong> Una vez pagada, la etiqueta estará disponible para imprimir
                  </Typography>
                </Box>
              </>
            ) : (
              // Etiqueta ya pagada
              <>
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                    ¡Etiqueta creada exitosamente!
                  </Typography>
                  <Typography variant="body2">
                    La etiqueta está lista para imprimir. El cliente recibirá un email con el código de seguimiento.
                  </Typography>
                </Alert>
                
                <Box sx={{ 
                  backgroundColor: '#f5f5f5', 
                  p: 2, 
                  borderRadius: '8px', 
                  mb: 3,
                  border: '1px solid #e0e0e0'
                }}>
                  <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                    <strong>Código de seguimiento:</strong>
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 2, color: '#C8626D', fontFamily: 'monospace', fontWeight: 600 }}>
                    {labelData.tracking_code}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    <strong>ID de pedido:</strong> {labelData.id}
                  </Typography>
                </Box>

                <Box sx={{ 
                  backgroundColor: '#e8f4fd', 
                  p: 2, 
                  borderRadius: '8px',
                  border: '1px solid #b3d9ff'
                }}>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    <strong>📋 Instrucciones:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                    1. Haz clic en <strong>"Imprimir"</strong> para abrir la etiqueta en una nueva ventana<br/>
                    2. O haz clic en <strong>"Descargar PDF"</strong> para guardarla en tu computadora<br/>
                    3. Imprime la etiqueta y pégala en el paquete
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
        {labelData?.pendingPayment ? (
          // Botones para shipment pendiente de pago
          <>
            <Button
              variant="contained"
              startIcon={<LocalShipping />}
              onClick={() => {
                if (labelData.shippoUrl) {
                  window.open(labelData.shippoUrl, '_blank');
                }
              }}
              size="large"
              sx={{ 
                backgroundColor: '#C8626D', 
                '&:hover': { backgroundColor: '#b8555a' },
                minWidth: '150px'
              }}
            >
              🔗 Ir a Shippo
            </Button>
            <Button
              variant="text"
              onClick={() => setLabelDialogOpen(false)}
              sx={{ color: '#666' }}
            >
              Cerrar
            </Button>
          </>
        ) : (
          // Botones para etiqueta pagada
          <>
            <Button
              variant="contained"
              startIcon={<Print />}
              onClick={handlePrintLabel}
              size="large"
              sx={{ 
                backgroundColor: '#C8626D', 
                '&:hover': { backgroundColor: '#b8555a' },
                minWidth: '150px'
              }}
            >
              🖨️ Imprimir Etiqueta
            </Button>
            <Button
              variant="outlined"
              startIcon={<GetApp />}
              onClick={handleDownloadLabel}
              size="large"
              sx={{ 
                borderColor: '#C8626D', 
                color: '#C8626D',
                '&:hover': { 
                  borderColor: '#b8555a',
                  backgroundColor: '#C8626D10'
                },
                minWidth: '150px'
              }}
            >
              📥 Descargar PDF
            </Button>
            <Button
              variant="text"
              onClick={() => setLabelDialogOpen(false)}
              sx={{ color: '#666' }}
            >
              Cerrar
            </Button>
          </>
        )}
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
                ℹ️ Información para Shippo:
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Esta es la dirección exacta que estamos enviando a Shippo.
                  Revisa los logs del servidor (consola de terminal) para ver:
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  • Dirección corregida por Shippo (si aplica)<br/>
                  • Código de estado de verificación<br/>
                  • Respuesta completa de la API de Shippo
                </Typography>
              </Alert>

              <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: '#666' }}>
                💡 <strong>Sugerencia:</strong> Abre la consola de terminal donde corre el servidor Node.js 
                para ver los logs detallados con el prefijo <code>🔍 [Address Debug]</code> y 
                <code>📍 DIRECCIÓN EXACTA A ENVIAR A SHIPPO:</code>
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

      {/* Widget de Shippo Shipping Elements */}
      <ShippoShippingElements
        open={shippoElementsOpen}
        onClose={handleShippoElementsClose}
        orderData={shippoOrderData}
      />
    </>
  );
};

export default OrdersManager;
