import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Payment, LocalShipping, Refresh, Search } from '@mui/icons-material';
import paypalService from '../services/paypalService';
import PayPalTracking from './PayPalTracking';
import { toast } from 'react-hot-toast';

const PayPalAdmin = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchPaymentId, setSearchPaymentId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundData, setRefundData] = useState({
    amount: '',
    note: '',
  });

  // Load payments (this would typically come from your backend)
  const loadPayments = async () => {
    try {
      setLoading(true);
      // In a real app, you would fetch this from your backend
      // For now, we'll show a message
      setPayments([]);
    } catch (error) {
      console.error('Error loading payments:', error);
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchPayment = async () => {
    if (!searchPaymentId.trim()) {
      toast.error('Please enter a payment ID');
      return;
    }

    try {
      setLoading(true);
      const paymentDetails = await paypalService.getPaymentDetails(searchPaymentId);
      setPayments([paymentDetails]);
      setError(null);
    } catch (error) {
      console.error('Error searching payment:', error);
      setError('Payment not found or error occurred');
      toast.error('Payment not found');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTracking = (orderId) => {
    setSelectedOrder(orderId);
    setTrackingDialogOpen(true);
  };

  const handleOpenRefund = (paymentId, amount) => {
    setRefundData({
      paymentId,
      amount: amount.toString(),
      note: '',
    });
    setRefundDialogOpen(true);
  };

  const handleCreateRefund = async () => {
    try {
      setLoading(true);
      await paypalService.createRefund(refundData.paymentId, {
        amount: refundData.amount,
        note: refundData.note,
      });
      
      toast.success('Refund created successfully!');
      setRefundDialogOpen(false);
      setRefundData({ amount: '', note: '' });
      
      // Reload payments
      if (searchPaymentId) {
        await handleSearchPayment();
      }
    } catch (error) {
      console.error('Error creating refund:', error);
      toast.error('Failed to create refund');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={3}>
            <Payment sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5">
              PayPal Payment Management
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Search Payment */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Search Payment
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Payment ID"
                  value={searchPaymentId}
                  onChange={(e) => setSearchPaymentId(e.target.value)}
                  placeholder="Enter PayPal payment ID"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSearchPayment}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <Search />}
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Payments Table */}
          {payments.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Payment Details
              </Typography>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Payment ID</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {payment.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={payment.status}
                            color={getStatusColor(payment.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {formatCurrency(
                            payment.amount?.value || 0,
                            payment.amount?.currency_code || 'USD'
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(payment.create_time).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<LocalShipping />}
                              onClick={() => handleOpenTracking(payment.id)}
                            >
                              Tracking
                            </Button>
                            {payment.status === 'COMPLETED' && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => handleOpenRefund(
                                  payment.id,
                                  payment.amount?.value || 0
                                )}
                              >
                                Refund
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {payments.length === 0 && !loading && (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                Search for a payment to view details
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Tracking Dialog */}
      <Dialog
        open={trackingDialogOpen}
        onClose={() => setTrackingDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Package Tracking</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <PayPalTracking
              orderId={selectedOrder}
              onTrackingAdded={() => {
                toast.success('Tracking information updated!');
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrackingDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog
        open={refundDialogOpen}
        onClose={() => setRefundDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Refund</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Refund Amount"
                type="number"
                value={refundData.amount}
                onChange={(e) => setRefundData(prev => ({
                  ...prev,
                  amount: e.target.value
                }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Refund Note"
                multiline
                rows={3}
                value={refundData.note}
                onChange={(e) => setRefundData(prev => ({
                  ...prev,
                  note: e.target.value
                }))}
                placeholder="Reason for refund..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateRefund}
            variant="contained"
            color="error"
            disabled={loading || !refundData.amount}
          >
            {loading ? 'Processing...' : 'Create Refund'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PayPalAdmin;
