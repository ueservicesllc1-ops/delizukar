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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  LocalShipping,
  TrackChanges,
  CheckCircle,
  Cancel,
  Update,
  Add,
  Search,
  ExpandMore,
  Notifications,
  NotificationsOff,
  BatchTracking,
} from '@mui/icons-material';
import paypalService from '../services/paypalService';
import { toast } from 'react-hot-toast';

const PayPalAdvancedTracking = () => {
  const [trackingData, setTrackingData] = useState({
    transactionId: '',
    trackingNumber: '',
    trackingNumberType: 'CARRIER_PROVIDED',
    status: 'SHIPPED',
    shipmentDate: '',
    carrier: 'OTHER',
    carrierNameOther: '',
    notifyBuyer: true,
  });
  
  const [batchTrackers, setBatchTrackers] = useState([]);
  const [existingTracking, setExistingTracking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTransactionId, setSearchTransactionId] = useState('');
  const [searchTrackingNumber, setSearchTrackingNumber] = useState('');
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState(null);

  // Shipping statuses according to PayPal documentation
  const shippingStatuses = [
    { value: 'SHIPPED', label: 'Shipped', description: 'The item was shipped and is on the way' },
    { value: 'ON_HOLD', label: 'On Hold', description: 'The item is on hold (customs, etc.)' },
    { value: 'DELIVERED', label: 'Delivered', description: 'The item has been delivered' },
    { value: 'CANCELLED', label: 'Cancelled', description: 'The shipment was cancelled' },
  ];

  // Supported carriers
  const carriers = [
    'DHL', 'FEDEX', 'UPS', 'USPS', 'OTHER'
  ];

  const handleInputChange = (field, value) => {
    setTrackingData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddSingleTracking = async () => {
    if (!trackingData.transactionId || !trackingData.status) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await paypalService.addTrackingViaTrackingAPI(
        trackingData.transactionId, 
        trackingData
      );
      
      toast.success('Tracking information added successfully!');
      
      // Reset form
      setTrackingData({
        transactionId: '',
        trackingNumber: '',
        trackingNumberType: 'CARRIER_PROVIDED',
        status: 'SHIPPED',
        shipmentDate: '',
        carrier: 'OTHER',
        carrierNameOther: '',
        notifyBuyer: true,
      });
      
    } catch (error) {
      console.error('Error adding tracking:', error);
      setError(error.message || 'Failed to add tracking information');
      toast.error('Failed to add tracking information');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBatchTracking = async () => {
    if (batchTrackers.length === 0) {
      toast.error('Please add at least one tracker');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await paypalService.addBatchTracking(batchTrackers);
      
      toast.success(`Batch tracking added for ${result.tracker_identifiers?.length || 0} transactions!`);
      
      if (result.errors && result.errors.length > 0) {
        console.warn('Some trackers failed:', result.errors);
        toast.error(`${result.errors.length} trackers failed to process`);
      }
      
      setBatchTrackers([]);
      setBatchDialogOpen(false);
      
    } catch (error) {
      console.error('Error adding batch tracking:', error);
      setError(error.message || 'Failed to add batch tracking');
      toast.error('Failed to add batch tracking');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTracking = async () => {
    if (!searchTransactionId.trim()) {
      toast.error('Please enter a transaction ID');
      return;
    }

    try {
      setLoading(true);
      const trackingInfo = await paypalService.getTrackingInfo(
        searchTransactionId, 
        searchTrackingNumber || undefined
      );
      setExistingTracking([trackingInfo]);
      setError(null);
    } catch (error) {
      console.error('Error searching tracking:', error);
      setError('Tracking information not found');
      toast.error('Tracking information not found');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTracking = async () => {
    if (!selectedTracker) return;

    try {
      setLoading(true);
      await paypalService.updateTrackingInfo(
        selectedTracker.transaction_id,
        selectedTracker.tracking_number,
        {
          status: selectedTracker.status,
          carrier: selectedTracker.carrier,
          carrierNameOther: selectedTracker.carrier_name_other,
          notifyBuyer: selectedTracker.notify_buyer,
        }
      );
      
      toast.success('Tracking information updated successfully!');
      setUpdateDialogOpen(false);
      setSelectedTracker(null);
      
      // Refresh search results
      if (searchTransactionId) {
        await handleSearchTracking();
      }
    } catch (error) {
      console.error('Error updating tracking:', error);
      toast.error('Failed to update tracking information');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTracking = async (transactionId, trackingNumber) => {
    try {
      setLoading(true);
      await paypalService.cancelTracking(transactionId, trackingNumber);
      toast.success('Tracking cancelled successfully!');
      
      // Refresh search results
      if (searchTransactionId) {
        await handleSearchTracking();
      }
    } catch (error) {
      console.error('Error cancelling tracking:', error);
      toast.error('Failed to cancel tracking');
    } finally {
      setLoading(false);
    }
  };

  const addBatchTracker = () => {
    setBatchTrackers(prev => [...prev, {
      transactionId: '',
      trackingNumber: '',
      status: 'SHIPPED',
      carrier: 'OTHER',
      carrierNameOther: '',
      notifyBuyer: true,
    }]);
  };

  const removeBatchTracker = (index) => {
    setBatchTrackers(prev => prev.filter((_, i) => i !== index));
  };

  const updateBatchTracker = (index, field, value) => {
    setBatchTrackers(prev => prev.map((tracker, i) => 
      i === index ? { ...tracker, [field]: value } : tracker
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SHIPPED':
        return 'primary';
      case 'DELIVERED':
        return 'success';
      case 'ON_HOLD':
        return 'warning';
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
              PayPal Advanced Tracking Management
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Search Tracking */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Search Tracking Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Transaction ID"
                    value={searchTransactionId}
                    onChange={(e) => setSearchTransactionId(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tracking Number (Optional)"
                    value={searchTrackingNumber}
                    onChange={(e) => setSearchTrackingNumber(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    onClick={handleSearchTracking}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <Search />}
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Single Tracking */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Add Single Tracking</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Transaction ID"
                    value={trackingData.transactionId}
                    onChange={(e) => handleInputChange('transactionId', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tracking Number (Optional)"
                    value={trackingData.trackingNumber}
                    onChange={(e) => handleInputChange('trackingNumber', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={trackingData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                    >
                      {shippingStatuses.map(status => (
                        <MenuItem key={status.value} value={status.value}>
                          {status.label} - {status.description}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Carrier</InputLabel>
                    <Select
                      value={trackingData.carrier}
                      onChange={(e) => handleInputChange('carrier', e.target.value)}
                    >
                      {carriers.map(carrier => (
                        <MenuItem key={carrier} value={carrier}>
                          {carrier}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
                    type="date"
                    label="Shipment Date"
                    value={trackingData.shipmentDate}
                    onChange={(e) => handleInputChange('shipmentDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={trackingData.notifyBuyer}
                        onChange={(e) => handleInputChange('notifyBuyer', e.target.checked)}
                      />
                    }
                    label="Notify Buyer (Email notification)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    onClick={handleAddSingleTracking}
                    disabled={loading || !trackingData.transactionId}
                    startIcon={loading ? <CircularProgress size={20} /> : <Add />}
                  >
                    {loading ? 'Adding...' : 'Add Tracking'}
                  </Button>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Batch Tracking */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Batch Tracking (Up to 20 transactions)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle1">
                    Trackers: {batchTrackers.length}/20
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={addBatchTracker}
                    disabled={batchTrackers.length >= 20}
                    startIcon={<Add />}
                  >
                    Add Tracker
                  </Button>
                </Box>
                
                {batchTrackers.map((tracker, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="subtitle2">Tracker {index + 1}</Typography>
                        <IconButton onClick={() => removeBatchTracker(index)} color="error">
                          <Cancel />
                        </IconButton>
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Transaction ID"
                            value={tracker.transactionId}
                            onChange={(e) => updateBatchTracker(index, 'transactionId', e.target.value)}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Tracking Number"
                            value={tracker.trackingNumber}
                            onChange={(e) => updateBatchTracker(index, 'trackingNumber', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                              value={tracker.status}
                              onChange={(e) => updateBatchTracker(index, 'status', e.target.value)}
                            >
                              {shippingStatuses.map(status => (
                                <MenuItem key={status.value} value={status.value}>
                                  {status.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Carrier</InputLabel>
                            <Select
                              value={tracker.carrier}
                              onChange={(e) => updateBatchTracker(index, 'carrier', e.target.value)}
                            >
                              {carriers.map(carrier => (
                                <MenuItem key={carrier} value={carrier}>
                                  {carrier}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        {tracker.carrier === 'OTHER' && (
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Carrier Name"
                              value={tracker.carrierNameOther}
                              onChange={(e) => updateBatchTracker(index, 'carrierNameOther', e.target.value)}
                            />
                          </Grid>
                        )}
                        <Grid item xs={12} sm={6}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={tracker.notifyBuyer}
                                onChange={(e) => updateBatchTracker(index, 'notifyBuyer', e.target.checked)}
                              />
                            }
                            label="Notify Buyer"
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
                
                <Box mt={2}>
                  <Button
                    variant="contained"
                    onClick={handleAddBatchTracking}
                    disabled={loading || batchTrackers.length === 0}
                    startIcon={loading ? <CircularProgress size={20} /> : <BatchTracking />}
                  >
                    {loading ? 'Processing...' : `Add ${batchTrackers.length} Trackers`}
                  </Button>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Existing Tracking Results */}
          {existingTracking.length > 0 && (
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>
                Tracking Information
              </Typography>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Transaction ID</TableCell>
                      <TableCell>Tracking Number</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Carrier</TableCell>
                      <TableCell>Shipment Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {existingTracking.map((tracker, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {tracker.transaction_id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {tracker.tracking_number || 'N/A'}
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
                          {tracker.shipment_date || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title="Update Tracking">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedTracker(tracker);
                                  setUpdateDialogOpen(true);
                                }}
                              >
                                <Update />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancel Tracking">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleCancelTracking(
                                  tracker.transaction_id,
                                  tracker.tracking_number
                                )}
                              >
                                <Cancel />
                              </IconButton>
                            </Tooltip>
                          </Box>
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
                Search for tracking information to view details
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Update Tracking Dialog */}
      <Dialog
        open={updateDialogOpen}
        onClose={() => setUpdateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Tracking Information</DialogTitle>
        <DialogContent>
          {selectedTracker && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedTracker.status}
                    onChange={(e) => setSelectedTracker(prev => ({
                      ...prev,
                      status: e.target.value
                    }))}
                  >
                    {shippingStatuses.map(status => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label} - {status.description}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Carrier</InputLabel>
                  <Select
                    value={selectedTracker.carrier}
                    onChange={(e) => setSelectedTracker(prev => ({
                      ...prev,
                      carrier: e.target.value
                    }))}
                  >
                    {carriers.map(carrier => (
                      <MenuItem key={carrier} value={carrier}>
                        {carrier}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {selectedTracker.carrier === 'OTHER' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Carrier Name"
                    value={selectedTracker.carrier_name_other || ''}
                    onChange={(e) => setSelectedTracker(prev => ({
                      ...prev,
                      carrier_name_other: e.target.value
                    }))}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedTracker.notify_buyer || false}
                      onChange={(e) => setSelectedTracker(prev => ({
                        ...prev,
                        notify_buyer: e.target.checked
                      }))}
                    />
                  }
                  label="Notify Buyer"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateTracking}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PayPalAdvancedTracking;
