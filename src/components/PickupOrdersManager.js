import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Tooltip,
  MenuItem,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Close,
  Refresh,
  CheckCircle,
  DoneAll,
  Cancel,
  EditCalendar,
  Send,
  Print,
  Storefront,
  Search,
  Warning,
  AccessTime,
  Phone,
  Email
} from '@mui/icons-material';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  getApiBase,
  formatPickupDate,
  formatPickupTime,
  printPickupTicket
} from '../utils/pickup';

const STATUS_CONFIG = {
  scheduled: { label: 'Agendado', color: 'info' },
  ready: { label: 'Listo para recoger', color: 'warning' },
  picked_up: { label: 'Entregado', color: 'success' },
  cancelled: { label: 'Cancelado', color: 'error' },
  no_show: { label: 'No se presentó', color: 'default' }
};

const PickupOrdersManager = ({ open, onClose }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0); // 0: Todas, 1: Hoy, 2: Próximas, 3: Listas para recoger, 4: Pasadas/Entregadas, 5: Reprogramar
  const [actionLoading, setActionLoading] = useState(null);
  const [alert, setAlert] = useState(null);

  // Modal para reprogramar
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [orderToReschedule, setOrderToReschedule] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState({ date: '', time: '' });
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!open) return;
    loadOrders();
  }, [open]);

  const loadOrders = async () => {
    setLoading(true);
    setAlert(null);
    try {
      const snap = await getDocs(collection(db, 'orders'));
      const list = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.fulfillmentType === 'pickup' || d.pickup) {
          list.push({ id: docSnap.id, ...d });
        }
      });

      // Ordenar por fecha y hora de recogida
      list.sort((a, b) => {
        const dateA = `${a.pickup?.date || ''} ${a.pickup?.time || ''}`;
        const dateB = `${b.pickup?.date || ''} ${b.pickup?.time || ''}`;
        return dateB.localeCompare(dateA);
      });

      setOrders(list);
    } catch (err) {
      console.error('Error cargando órdenes de pickup:', err);
      setAlert({ severity: 'error', text: 'Error al cargar pedidos: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  // Filtrado
  const todayStr = new Date().toISOString().slice(0, 10);

  const filteredOrders = orders.filter((order) => {
    const pickup = order.pickup || {};
    const status = pickup.status || 'scheduled';
    const date = pickup.date || '';

    // Filtro por tab
    if (tab === 1 && date !== todayStr) return false;
    if (tab === 2 && (date <= todayStr || status === 'picked_up' || status === 'cancelled')) return false;
    if (tab === 3 && status !== 'ready') return false;
    if (tab === 4 && status !== 'picked_up' && status !== 'cancelled' && status !== 'no_show') return false;
    if (tab === 5 && !pickup.needsReschedule) return false;

    // Filtro por texto
    if (!search.trim()) return true;
    const queryStr = search.toLowerCase().trim();
    const code = (pickup.code || '').toLowerCase();
    const name = `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.toLowerCase();
    const email = (order.customerInfo?.email || '').toLowerCase();
    const phone = (order.customerInfo?.phone || '').toLowerCase();
    const id = (order.id || '').toLowerCase();

    return code.includes(queryStr) || name.includes(queryStr) || email.includes(queryStr) || phone.includes(queryStr) || id.includes(queryStr);
  });

  // Cambiar estado (Listo, Entregado, Cancelado, No se presentó)
  const handleUpdateStatus = async (orderId, newStatus) => {
    setActionLoading(orderId);
    setAlert(null);
    try {
      const res = await fetch(`${getApiBase()}/api/pickup/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al actualizar estado');
      }

      setAlert({
        severity: 'success',
        text: `Pedido actualizado a "${STATUS_CONFIG[newStatus]?.label || newStatus}". ${newStatus === 'ready' ? '📧 Se notificó al cliente por correo.' : ''}`
      });
      await loadOrders();
    } catch (err) {
      console.error('Error actualizando estado:', err);
      setAlert({ severity: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  // Reenviar ticket
  const handleResendTicket = async (orderId) => {
    setActionLoading(orderId);
    setAlert(null);
    try {
      const res = await fetch(`${getApiBase()}/api/pickup/orders/${orderId}/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al reenviar ticket');
      }
      setAlert({ severity: 'success', text: '📧 Ticket reenviado correctamente al correo del cliente.' });
    } catch (err) {
      console.error('Error reenviando ticket:', err);
      setAlert({ severity: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  // Abrir reprogramación
  const handleOpenReschedule = async (order) => {
    setOrderToReschedule(order);
    setSelectedSlot({ date: order.pickup?.date || '', time: order.pickup?.time || '' });
    setRescheduleDialogOpen(true);
    setLoadingSlots(true);
    try {
      const res = await fetch(`${getApiBase()}/api/pickup/availability?admin=1`);
      const data = await res.json();
      setAvailableSlots(data.slots || []);
    } catch (err) {
      console.error('Error obteniendo disponibilidad:', err);
      setAlert({ severity: 'error', text: 'Error obteniendo horarios disponibles.' });
    } finally {
      setLoadingSlots(false);
    }
  };

  // Confirmar reprogramación
  const handleConfirmReschedule = async () => {
    if (!orderToReschedule || !selectedSlot.date || !selectedSlot.time) return;
    setActionLoading(orderToReschedule.id);
    setAlert(null);
    try {
      const res = await fetch(`${getApiBase()}/api/pickup/orders/${orderToReschedule.id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedSlot)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al reprogramar pedido');
      }

      setAlert({
        severity: 'success',
        text: `¡Pedido ${orderToReschedule.pickup?.code} reprogramado para el ${selectedSlot.date} a las ${selectedSlot.time}! Se envió correo al cliente.`
      });
      setRescheduleDialogOpen(false);
      await loadOrders();
    } catch (err) {
      console.error('Error al reprogramar:', err);
      setAlert({ severity: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#c8626d', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Storefront />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Gestión de Órdenes de Recogida en Tienda (Pickup)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={loadOrders} sx={{ color: '#fff' }} size="small" title="Recargar">
              <Refresh />
            </IconButton>
            <IconButton onClick={onClose} sx={{ color: '#fff' }} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1, backgroundColor: '#fdf6f7' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                textColor="inherit"
                variant="scrollable"
                scrollButtons="auto"
                TabIndicatorProps={{ style: { backgroundColor: '#c8626d' } }}
              >
                <Tab label={`Todas (${orders.length})`} />
                <Tab label={`Hoy (${orders.filter((o) => o.pickup?.date === todayStr).length})`} />
                <Tab label="Próximas" />
                <Tab label={`Listas (${orders.filter((o) => o.pickup?.status === 'ready').length})`} />
                <Tab label="Entregadas / Historial" />
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span>Reprogramar</span>
                      {orders.filter((o) => o.pickup?.needsReschedule).length > 0 && (
                        <Chip
                          label={orders.filter((o) => o.pickup?.needsReschedule).length}
                          size="small"
                          color="error"
                          sx={{ height: 18, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  }
                />
              </Tabs>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                placeholder="Buscar por código (DLZ-...), cliente, email o teléfono..."
                size="small"
                fullWidth
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ color: '#999', mr: 1, fontSize: 20 }} />
                }}
              />
            </Grid>
          </Grid>
        </Box>

        <DialogContent sx={{ p: 2 }}>
          {alert && (
            <Alert severity={alert.severity} sx={{ mb: 2 }} onClose={() => setAlert(null)}>
              {alert.text}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
              <CircularProgress sx={{ color: '#c8626d' }} />
            </Box>
          ) : filteredOrders.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 6 }}>
              <Storefront sx={{ fontSize: 60, color: '#ccc', mb: 1 }} />
              <Typography variant="h6" sx={{ color: '#888' }}>
                No hay órdenes de recogida en esta sección
              </Typography>
              <Typography variant="body2" sx={{ color: '#aaa' }}>
                {search ? 'No se encontraron resultados para tu búsqueda.' : 'Las nuevas órdenes de recogida aparecerán aquí.'}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#fafafa' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Código / Ticket</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Fecha y Hora</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Cliente</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Productos</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const pickup = order.pickup || {};
                    const status = pickup.status || 'scheduled';
                    const statusConf = STATUS_CONFIG[status] || { label: status, color: 'default' };
                    const isBusy = actionLoading === order.id;

                    return (
                      <TableRow key={order.id} hover sx={{ backgroundColor: pickup.needsReschedule ? '#fffbf2' : 'inherit' }}>
                        {/* Código */}
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#c8626d', letterSpacing: 1 }}>
                            {pickup.code || 'SIN CÓDIGO'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#888' }}>
                            ID: #{order.id?.slice(0, 8)}
                          </Typography>
                          {pickup.needsReschedule && (
                            <Box sx={{ mt: 0.5 }}>
                              <Chip
                                icon={<Warning fontSize="small" />}
                                label="Requiere reprogramar"
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            </Box>
                          )}
                        </TableCell>

                        {/* Fecha y hora */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTime fontSize="small" sx={{ color: '#888' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {pickup.date ? formatPickupDate(pickup.date, 'es') : 'Sin fecha'}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: '#555', display: 'block', ml: 2.5 }}>
                            {pickup.time ? formatPickupTime(pickup.time) : 'Sin hora'}
                          </Typography>
                        </TableCell>

                        {/* Cliente */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {order.customerInfo?.firstName} {order.customerInfo?.lastName}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#666', fontSize: '0.78rem' }}>
                            <Email sx={{ fontSize: 13 }} />
                            <span>{order.customerInfo?.email || 'N/A'}</span>
                          </Box>
                          {order.customerInfo?.phone && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#666', fontSize: '0.78rem' }}>
                              <Phone sx={{ fontSize: 13 }} />
                              <span>{order.customerInfo?.phone}</span>
                            </Box>
                          )}
                        </TableCell>

                        {/* Productos */}
                        <TableCell>
                          <Typography variant="caption" sx={{ color: '#555' }}>
                            {(order.cartItems || [])
                              .map((item) => `${item.quantity}x ${item.name}`)
                              .join(', ')}
                          </Typography>
                        </TableCell>

                        {/* Total */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#c8626d' }}>
                            ${parseFloat(order.total || 0).toFixed(2)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#888' }}>
                            {order.paymentMethod || 'PayPal'}
                          </Typography>
                        </TableCell>

                        {/* Estado */}
                        <TableCell>
                          <Chip label={statusConf.label} color={statusConf.color} size="small" sx={{ fontWeight: 600 }} />
                        </TableCell>

                        {/* Acciones */}
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {status === 'scheduled' && (
                              <Tooltip title="Marcar como LISTO para recoger (envía correo al cliente)">
                                <span>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="warning"
                                    startIcon={<CheckCircle />}
                                    disabled={isBusy}
                                    onClick={() => handleUpdateStatus(order.id, 'ready')}
                                    sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.3 }}
                                  >
                                    Listo
                                  </Button>
                                </span>
                              </Tooltip>
                            )}

                            {status === 'ready' && (
                              <Tooltip title="Marcar como ENTREGADO">
                                <span>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    startIcon={<DoneAll />}
                                    disabled={isBusy}
                                    onClick={() => handleUpdateStatus(order.id, 'picked_up')}
                                    sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.3 }}
                                  >
                                    Entregar
                                  </Button>
                                </span>
                              </Tooltip>
                            )}

                            <Tooltip title="Reprogramar fecha y hora">
                              <IconButton
                                size="small"
                                color="primary"
                                disabled={isBusy}
                                onClick={() => handleOpenReschedule(order)}
                              >
                                <EditCalendar fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Reenviar ticket al correo">
                              <IconButton
                                size="small"
                                color="info"
                                disabled={isBusy}
                                onClick={() => handleResendTicket(order.id)}
                              >
                                <Send fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Imprimir ticket">
                              <IconButton
                                size="small"
                                sx={{ color: '#c8626d' }}
                                onClick={() => printPickupTicket({ order, orderId: order.id, language: order.language || 'es' })}
                              >
                                <Print fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            {status !== 'cancelled' && status !== 'picked_up' && (
                              <Tooltip title="Cancelar recogida">
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={isBusy}
                                  onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                                >
                                  <Cancel fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO PARA REPROGRAMAR */}
      <Dialog
        open={rescheduleDialogOpen}
        onClose={() => setRescheduleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#c8626d', color: '#fff' }}>
          Reprogramar Recogida · {orderToReschedule?.pickup?.code}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {orderToReschedule && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Cliente: <strong>{orderToReschedule.customerInfo?.firstName} {orderToReschedule.customerInfo?.lastName}</strong> ({orderToReschedule.customerInfo?.email})
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Horario actual: <strong>{orderToReschedule.pickup?.date} a las {orderToReschedule.pickup?.time}</strong>
              </Typography>
            </Box>
          )}

          {loadingSlots ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress sx={{ color: '#c8626d' }} />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="Seleccionar nueva fecha y hora"
                value={selectedSlot.date && selectedSlot.time ? `${selectedSlot.date}|${selectedSlot.time}` : ''}
                onChange={(e) => {
                  const [date, time] = e.target.value.split('|');
                  setSelectedSlot({ date, time });
                }}
                fullWidth
                helperText="Horarios generados según el horario comercial configurado en Config. Pickup"
              >
                {availableSlots.map((slot) => (
                  <MenuItem key={`${slot.date}-${slot.time}`} value={`${slot.date}|${slot.time}`}>
                    📅 {formatPickupDate(slot.date, 'es')} — {formatPickupTime(slot.time)} (Disponibles: {slot.remaining})
                  </MenuItem>
                ))}
              </TextField>

              <Typography variant="caption" sx={{ color: '#888' }}>
                Al confirmar, se reservará la nueva franja, se liberará la anterior y se enviará un correo con el nuevo ticket al cliente.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRescheduleDialogOpen(false)} sx={{ color: '#666' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmReschedule}
            disabled={!selectedSlot.date || !selectedSlot.time}
            sx={{ backgroundColor: '#c8626d', '&:hover': { backgroundColor: '#b0525d' } }}
          >
            Confirmar y Notificar al Cliente
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PickupOrdersManager;
