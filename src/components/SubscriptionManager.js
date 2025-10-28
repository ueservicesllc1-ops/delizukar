import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Alert, CircularProgress, Grid, Card, CardContent, IconButton, Chip, Divider,
  TextField, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Close, Email, Person, CalendarToday, CheckCircle, Cancel, Send } from '@mui/icons-material';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import emailjs from '@emailjs/browser';

const SubscriptionManager = ({ open, onClose }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [massEmailOpen, setMassEmailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailType, setEmailType] = useState('newsletter');
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailProgress, setEmailProgress] = useState({ sent: 0, total: 0 });

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
      
      console.log('📧 Suscriptores cargados desde Firebase:', loadedSubscriptions.length);
      console.log('📋 Lista de suscriptores:', loadedSubscriptions);
      
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

  const handleSendMassEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      setError('Por favor completa el asunto y el mensaje');
      return;
    }

    if (subscriptions.length === 0) {
      setError('No hay suscriptores para enviar el email');
      return;
    }

    console.log('📧 Iniciando envío masivo de emails...');
    console.log('👥 Suscriptores encontrados:', subscriptions.length);
    console.log('📝 Asunto:', emailSubject);
    console.log('📄 Mensaje:', emailMessage);
    console.log('🏷️ Tipo:', emailType);

    setSendingEmails(true);
    setError('');
    setSuccess('');
    setEmailProgress({ sent: 0, total: subscriptions.length });

    try {
      let sentCount = 0;
      let failedCount = 0;

      for (const subscription of subscriptions) {
        try {
          console.log(`📤 Enviando email a: ${subscription.email}`);
          
          const emailParams = {
            to_email: subscription.email,
            message: `Hola,

${emailMessage}

---
${emailType.charAt(0).toUpperCase() + emailType.slice(1)} de Delizukar

Para cancelar tu suscripción, visita: https://delizukar.com/unsubscribe?email=${subscription.email}`
          };
          
          console.log('📋 Parámetros del email:', emailParams);
          
          const result = await emailjs.send(
            'service_7biylnb',
            'template_ic9r7ln',
            {
              to_email: subscription.email,
              subject: emailSubject,
              company_name: 'DeliZuKar',
              email_type: emailType.charAt(0).toUpperCase() + emailType.slice(1),
              message: emailMessage,
              unsubscribe_link: `https://delizukar.com/unsubscribe?email=${subscription.email}`
            },
            'woa-DlbiNozuQWT44'
          );
          
          console.log(`✅ Email enviado exitosamente a ${subscription.email}:`, result);
          sentCount++;
          setEmailProgress({ sent: sentCount, total: subscriptions.length });
          
          // Pequeña pausa para evitar límites de rate
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (emailError) {
          console.error(`❌ Error enviando email a ${subscription.email}:`, emailError);
          console.error('Detalles del error:', {
            status: emailError.status,
            text: emailError.text,
            message: emailError.message
          });
          failedCount++;
        }
      }

      if (sentCount > 0) {
        setSuccess(`✅ Email enviado exitosamente a ${sentCount} suscriptores${failedCount > 0 ? ` (${failedCount} fallaron)` : ''}`);
      } else {
        setError('❌ No se pudo enviar ningún email');
      }

      // Limpiar formulario
      setEmailSubject('');
      setEmailMessage('');
      setEmailType('newsletter');
      setMassEmailOpen(false);

    } catch (error) {
      console.error('Error enviando emails masivos:', error);
      setError('Error al enviar los emails: ' + error.message);
    } finally {
      setSendingEmails(false);
      setEmailProgress({ sent: 0, total: 0 });
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#c8626d', fontWeight: 600 }}>
              📊 Estadísticas de Suscripciones
            </Typography>
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={() => setMassEmailOpen(true)}
              disabled={subscriptions.length === 0}
              sx={{
                backgroundColor: '#c8626d',
                '&:hover': { backgroundColor: '#be8782' },
                '&:disabled': { backgroundColor: '#ccc' }
              }}
            >
              Enviar Email Masivo
            </Button>
          </Box>
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

      {/* Modal de Envío Masivo */}
      <Dialog open={massEmailOpen} onClose={() => !sendingEmails && setMassEmailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #c8626d 0%, #be8782 100%)', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Send />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Enviar Email Masivo</Typography>
          </Box>
          <IconButton onClick={() => !sendingEmails && setMassEmailOpen(false)} sx={{ color: 'white' }} disabled={sendingEmails}>
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
            Enviarás este email a <strong>{subscriptions.length}</strong> suscriptores registrados.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Tipo de Email</InputLabel>
                <Select
                  value={emailType}
                  onChange={(e) => setEmailType(e.target.value)}
                  label="Tipo de Email"
                  disabled={sendingEmails}
                >
                  <MenuItem value="newsletter">📰 Newsletter</MenuItem>
                  <MenuItem value="promotion">🎉 Promoción</MenuItem>
                  <MenuItem value="announcement">📢 Anuncio</MenuItem>
                  <MenuItem value="update">🔄 Actualización</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Asunto del Email"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                disabled={sendingEmails}
                placeholder="Ej: ¡Nuevos productos disponibles!"
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={8}
                label="Mensaje"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                disabled={sendingEmails}
                placeholder="Escribe tu mensaje aquí..."
                sx={{ mb: 2 }}
              />
            </Grid>

            {sendingEmails && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, backgroundColor: '#e8f5e8', borderRadius: '8px', textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 600, mb: 1 }}>
                    📧 Enviando emails... {emailProgress.sent} de {emailProgress.total}
                  </Typography>
                  <Box sx={{ width: '100%', backgroundColor: '#c8e6c9', borderRadius: '4px', height: '8px' }}>
                    <Box 
                      sx={{ 
                        backgroundColor: '#4caf50', 
                        height: '100%', 
                        borderRadius: '4px',
                        width: `${(emailProgress.sent / emailProgress.total) * 100}%`,
                        transition: 'width 0.3s ease'
                      }} 
                    />
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
          <Button
            onClick={() => setMassEmailOpen(false)}
            variant="outlined"
            disabled={sendingEmails}
            sx={{ mr: 2 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSendMassEmail}
            variant="contained"
            disabled={sendingEmails || !emailSubject.trim() || !emailMessage.trim()}
            startIcon={sendingEmails ? <CircularProgress size={20} /> : <Send />}
            sx={{
              backgroundColor: '#c8626d',
              '&:hover': { backgroundColor: '#be8782' }
            }}
          >
            {sendingEmails ? 'Enviando...' : 'Enviar a Todos'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default SubscriptionManager;
