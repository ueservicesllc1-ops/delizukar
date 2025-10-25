import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import {
  Security,
  Speed,
  Notifications,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import paypalService from '../services/paypalService';
import { toast } from 'react-hot-toast';

const PayPalNotifications = () => {
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    sellerProtection: true,
    fundRelease: true,
  });
  
  const [trackingBenefits, setTrackingBenefits] = useState({
    fasterFunds: false,
    sellerProtection: false,
    customerSatisfaction: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [benefits, setBenefits] = useState([]);

  useEffect(() => {
    loadBenefits();
  }, []);

  const loadBenefits = async () => {
    try {
      setLoading(true);
      // Simulate loading benefits from PayPal API
      const mockBenefits = [
        {
          id: 'faster_funds',
          title: 'Faster Fund Access',
          description: 'Tracking numbers help release held funds more quickly',
          status: 'active',
          icon: <Speed />,
          color: 'success',
        },
        {
          id: 'seller_protection',
          title: 'Seller Protection',
          description: 'Protection against "Item not Received" claims',
          status: 'active',
          icon: <Security />,
          color: 'primary',
        },
        {
          id: 'customer_notifications',
          title: 'Customer Notifications',
          description: 'Automatic email and push notifications to customers',
          status: 'active',
          icon: <Notifications />,
          color: 'info',
        },
      ];
      setBenefits(mockBenefits);
    } catch (error) {
      console.error('Error loading benefits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (type, value) => {
    setNotifications(prev => ({
      ...prev,
      [type]: value,
    }));
    
    toast.success(`${type.replace(/([A-Z])/g, ' $1').toLowerCase()} ${value ? 'enabled' : 'disabled'}`);
  };

  const handleAddTrackingWithBenefits = async (transactionId, trackingData) => {
    try {
      setLoading(true);
      
      // Add tracking with all benefits enabled
      const enhancedTrackingData = {
        ...trackingData,
        notifyBuyer: notifications.emailNotifications,
        // Additional parameters for seller protection
        trackingNumberType: 'CARRIER_PROVIDED',
        shipmentDate: new Date().toISOString().split('T')[0],
      };
      
      const result = await paypalService.addTrackingViaTrackingAPI(
        transactionId,
        enhancedTrackingData
      );
      
      // Show benefits activated
      toast.success('Tracking added with all benefits activated!');
      
      // Update benefits status
      setTrackingBenefits({
        fasterFunds: true,
        sellerProtection: true,
        customerSatisfaction: true,
      });
      
      return result;
    } catch (error) {
      console.error('Error adding tracking with benefits:', error);
      toast.error('Failed to add tracking with benefits');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getBenefitStatus = (benefitId) => {
    switch (benefitId) {
      case 'faster_funds':
        return trackingBenefits.fasterFunds;
      case 'seller_protection':
        return trackingBenefits.sellerProtection;
      case 'customer_notifications':
        return trackingBenefits.customerSatisfaction;
      default:
        return false;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={3}>
            <Security sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5">
              PayPal Seller Protection & Notifications
            </Typography>
          </Box>

          {/* Benefits Overview */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Tracking Benefits
            </Typography>
            <Grid container spacing={2}>
              {benefits.map((benefit) => (
                <Grid item xs={12} sm={6} md={4} key={benefit.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      border: getBenefitStatus(benefit.id) ? '2px solid' : '1px solid',
                      borderColor: getBenefitStatus(benefit.id) ? 'success.main' : 'divider',
                    }}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Box sx={{ color: `${benefit.color}.main`, mr: 1 }}>
                          {benefit.icon}
                        </Box>
                        <Typography variant="h6">
                          {benefit.title}
                        </Typography>
                        {getBenefitStatus(benefit.id) && (
                          <CheckCircle sx={{ ml: 'auto', color: 'success.main' }} />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {benefit.description}
                      </Typography>
                      <Box mt={2}>
                        <Chip
                          label={getBenefitStatus(benefit.id) ? 'Active' : 'Inactive'}
                          color={getBenefitStatus(benefit.id) ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Notification Settings */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Notification Settings
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Notifications sx={{ mr: 1, color: 'info.main' }} />
                      <Typography variant="h6">Email Notifications</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      Send email notifications to customers when tracking information is updated
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.emailNotifications}
                          onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                        />
                      }
                      label="Enable Email Notifications"
                    />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Notifications sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">Push Notifications</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      Send push notifications through PayPal app (based on customer settings)
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.pushNotifications}
                          onChange={(e) => handleNotificationChange('pushNotifications', e.target.checked)}
                        />
                      }
                      label="Enable Push Notifications"
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Seller Protection Information */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Seller Protection Benefits
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Alert severity="info" icon={<Info />}>
                  <Typography variant="subtitle2" gutterBottom>
                    Faster Fund Access
                  </Typography>
                  <Typography variant="body2">
                    When funds are on hold, providing tracking numbers helps PayPal release funds more quickly upon delivery confirmation.
                  </Typography>
                </Alert>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Alert severity="success" icon={<CheckCircle />}>
                  <Typography variant="subtitle2" gutterBottom>
                    Seller Protection
                  </Typography>
                  <Typography variant="body2">
                    Essential for determining seller protection eligibility. Helps resolve "Item not Received" claims automatically.
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </Box>

          {/* Best Practices */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Best Practices
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Practice</TableCell>
                    <TableCell>Benefit</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Typography variant="subtitle2">
                        Add tracking immediately after shipment
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Faster fund release, better customer experience
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label="Recommended" color="success" size="small" />
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell>
                      <Typography variant="subtitle2">
                        Use supported carriers (DHL, FedEx, UPS, USPS)
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Better tracking integration and customer notifications
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label="Recommended" color="success" size="small" />
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell>
                      <Typography variant="subtitle2">
                        Enable buyer notifications
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Reduces customer inquiries, improves satisfaction
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label="Recommended" color="success" size="small" />
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell>
                      <Typography variant="subtitle2">
                        Update status when delivered
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Triggers automatic fund release, closes disputes
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label="Critical" color="error" size="small" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Action Buttons */}
          <Box mt={3} display="flex" gap={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Security />}
              onClick={() => {
                setTrackingBenefits({
                  fasterFunds: true,
                  sellerProtection: true,
                  customerSatisfaction: true,
                });
                toast.success('All seller protection benefits activated!');
              }}
            >
              Activate All Benefits
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Info />}
              onClick={() => {
                toast.info('Seller protection is automatically enabled when you add tracking information');
              }}
            >
              Learn More
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PayPalNotifications;
