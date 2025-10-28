import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Alert, CircularProgress, Grid, Card, CardContent, IconButton, Chip, Divider
} from '@mui/material';
import { Close, Email, Person, CalendarToday, CheckCircle, Cancel } from '@mui/icons-material';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

const SubscriptionManager = ({ open, onClose }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (open) {
      loadSubscriptions();
    }
  }, [open]);

  const loadSubscriptions = async () => {
    setLoading(true);
    setError('');
    try {
      const subscriptionsRef = collection(db, 'emailSubscriptions');
      const q = query(subscriptionsRef, orderBy('subscribedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const loadedSubscriptions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSubscriptions(loadedSubscriptions);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
      setError('Error al cargar las suscripciones.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubscription = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta suscripción?')) {
      try {
        await deleteDoc(doc(db, 'emailSubscriptions', id));
        setSuccess('Suscripción eliminada correctamente.');
        loadSubscriptions();
      } catch (err) {
        console.error('Error deleting subscription:', err);
        setError('Error al eliminar la suscripción.');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #c8626d 0%, #be8782 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Email />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Gestión de Suscriptores</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}><Close /></IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* Estadísticas */}
        <Box sx={{ mb: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#c8626d', fontWeight: 600 }}>
            📊 Estadísticas de Suscripciones
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 2, backgroundColor: '#c8626d', color: 'white', textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {subscriptions.length}
                </Typography>
                <Typography variant="body2">
                  Total Suscriptores
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 2, backgroundColor: '#be8782', color: 'white', textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {subscriptions.filter(sub => {
                    const subDate = new Date(sub.subscribedAt);
                    const now = new Date();
                    const diffTime = Math.abs(now - subDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 30;
                  }).length}
                </Typography>
                <Typography variant="body2">
                  Últimos 30 días
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 2, backgroundColor: '#b5555a', color: 'white', textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {subscriptions.filter(sub => {
                    const subDate = new Date(sub.subscribedAt);
                    const now = new Date();
                    const diffTime = Math.abs(now - subDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 7;
                  }).length}
                </Typography>
                <Typography variant="body2">
                  Últimos 7 días
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <CircularProgress />
          </Box>
        ) : subscriptions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Email sx={{ fontSize: 64, color: '#c8626d', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#c8626d', mb: 2, fontWeight: 600 }}>
              No hay suscriptores aún
            </Typography>
            <Typography variant="body1" sx={{ color: '#666' }}>
              Los suscriptores aparecerán aquí cuando se suscriban desde el footer.
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: '#c8626d', fontWeight: 600 }}>
              📧 Lista de Suscriptores ({subscriptions.length})
            </Typography>
            
            <Grid container spacing={2}>
              {subscriptions.map((subscription, index) => (
                <Grid item xs={12} sm={6} md={4} key={subscription.id}>
                  <Card sx={{ 
                    p: 2, 
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)', 
                    borderRadius: '10px',
                    border: '1px solid #e0e0e0',
                    '&:hover': {
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                    }
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Email sx={{ color: '#c8626d', fontSize: '1.2rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#c8626d' }}>
                          #{index + 1}
                        </Typography>
                      </Box>
                      <IconButton 
                        onClick={() => handleDeleteSubscription(subscription.id)}
                        size="small"
                        sx={{ color: '#f44336' }}
                      >
                        <Cancel />
                      </IconButton>
                    </Box>
                    
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1, color: '#333' }}>
                      {subscription.email}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CalendarToday sx={{ fontSize: '0.9rem', color: '#666' }} />
                      <Typography variant="caption" sx={{ color: '#666' }}>
                        {formatDate(subscription.subscribedAt)}
                      </Typography>
                    </Box>
                    
                    <Chip
                      label="Activo"
                      color="success"
                      size="small"
                      icon={<CheckCircle />}
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            backgroundColor: '#c8626d',
            '&:hover': { backgroundColor: '#be8782' },
            px: 3
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubscriptionManager;
