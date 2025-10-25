import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Dashboard,
  LocalShipping,
  Security,
  Notifications,
  Analytics,
} from '@mui/icons-material';
import PayPalAdvancedTracking from './PayPalAdvancedTracking';
import PayPalNotifications from './PayPalNotifications';
import PayPalTracking from './PayPalTracking';
import PayPalAdmin from './PayPalAdmin';

const PayPalTrackingDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = [
    {
      label: 'Dashboard',
      icon: <Dashboard />,
      component: <PayPalAdmin />,
    },
    {
      label: 'Advanced Tracking',
      icon: <LocalShipping />,
      component: <PayPalAdvancedTracking />,
    },
    {
      label: 'Basic Tracking',
      icon: <LocalShipping />,
      component: <PayPalTracking />,
    },
    {
      label: 'Notifications',
      icon: <Notifications />,
      component: <PayPalNotifications />,
    },
  ];

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1">
              PayPal Tracking Management
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>PayPal Tracking API Benefits:</strong> Faster fund access, seller protection, 
              and automatic customer notifications. Based on the official 
              <a href="https://developer.paypal.com/docs/tracking/tracking-api/" target="_blank" rel="noopener noreferrer">
                PayPal Tracking API documentation
              </a>.
            </Typography>
          </Alert>

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  label={tab.label}
                  icon={tab.icon}
                  iconPosition="start"
                />
              ))}
            </Tabs>
          </Box>

          <Box sx={{ mt: 3 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              tabs[activeTab].component
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PayPalTrackingDashboard;
