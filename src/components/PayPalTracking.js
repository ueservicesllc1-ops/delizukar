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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { LocalShipping, TrackChanges, CheckCircle } from '@mui/icons-material';
import paypalService from '../services/paypalService';
import { toast } from 'react-hot-toast';

const PayPalTracking = ({ orderId, onTrackingAdded }) => {
  const [trackingData, setTrackingData] = useState({
    captureId: '',
    trackingNumber: '',
    trackingType: 'EXTERNAL',
    status: 'SHIPPED',
    carrier: 'OTHER',
    carrierNameOther: '',
    trackingUrl: '',
    notifyBuyer: true,
  });
  
  const [existingTracking, setExistingTracking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load existing tracking information
  useEffect(() => {
    if (orderId) {
      loadTrackingInfo();
    }
  }, [orderId]);

  const loadTrackingInfo = async () => {
    try {
      setLoading(true);
      const trackingInfo = await paypalService.getTrackingInfo(orderId);
      setExistingTracking(trackingInfo);
    } catch (error) {
      console.error('Error loading tracking info:', error);
      setError('Failed to load tracking information');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setTrackingData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddTracking = async () => {
    if (!trackingData.captureId || !trackingData.trackingNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await paypalService.addTrackingToOrder(orderId, trackingData);
      
      toast.success('Tracking information added successfully!');
      
      // Reload tracking info
      await loadTrackingInfo();
      
      // Reset form
      setTrackingData({
        captureId: '',
        trackingNumber: '',
        trackingType: 'EXTERNAL',
        status: 'SHIPPED',
        carrier: 'OTHER',
        carrierNameOther: '',
        trackingUrl: '',
        notifyBuyer: true,
      });
      
      if (onTrackingAdded) {
        onTrackingAdded(result);
      }
    } catch (error) {
      console.error('Error adding tracking:', error);
      setError(error.message || 'Failed to add tracking information');
      toast.error('Failed to add tracking information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SHIPPED':
        return 'primary';
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getCarrierName = (carrier, carrierNameOther) => {
    if (carrier === 'OTHER' && carrierNameOther) {
      return carrierNameOther;
    }
    return carrier;
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={3}>
            <LocalShipping sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5">
              Package Tracking
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Add New Tracking */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Add Tracking Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Capture ID"
                  value={trackingData.captureId}
                  onChange={(e) => handleInputChange('captureId', e.target.value)}
                  required
                  helperText="The PayPal capture ID for this order"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tracking Number"
                  value={trackingData.trackingNumber}
                  onChange={(e) => handleInputChange('trackingNumber', e.target.value)}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  value={trackingData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  SelectProps={{ native: true }}
                >
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Carrier"
                  value={trackingData.carrier}
                  onChange={(e) => handleInputChange('carrier', e.target.value)}
                  SelectProps={{ native: true }}
                >
                  <option value="DHL">DHL</option>
                  <option value="FEDEX">FedEx</option>
                  <option value="UPS">UPS</option>
                  <option value="USPS">USPS</option>
                  <option value="OTHER">Other</option>
                </TextField>
              </Grid>
              
              {trackingData.carrier === 'OTHER' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Carrier Name"
                    value={trackingData.carrierNameOther}
                    onChange={(e) => handleInputChange('carrierNameOther', e.target.value)}
                    required
                  />
                </Grid>
              )}
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tracking URL (Optional)"
                  value={trackingData.trackingUrl}
                  onChange={(e) => handleInputChange('trackingUrl', e.target.value)}
                  placeholder="https://example.com/track/123456"
                />
              </Grid>
            </Grid>
            
            <Box mt={2}>
              <Button
                variant="contained"
                onClick={handleAddTracking}
                disabled={loading || !trackingData.captureId || !trackingData.trackingNumber}
                startIcon={loading ? <CircularProgress size={20} /> : <TrackChanges />}
              >
                {loading ? 'Adding...' : 'Add Tracking'}
              </Button>
            </Box>
          </Box>

          {/* Existing Tracking Information */}
          {existingTracking.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Existing Tracking Information
              </Typography>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tracking Number</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Carrier</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Updated</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {existingTracking.map((tracker, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {tracker.tracking_number}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={tracker.status}
                            color={getStatusColor(tracker.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {getCarrierName(tracker.carrier, tracker.carrier_name_other)}
                        </TableCell>
                        <TableCell>
                          {new Date(tracker.create_time).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(tracker.update_time).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {existingTracking.length === 0 && !loading && (
            <Box textAlign="center" py={4}>
              <CheckCircle sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No tracking information available yet
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PayPalTracking;
