import React, { useState, useMemo } from 'react';
import { 
  Dialog, DialogContent, Typography, Box, TextField, 
  Button, Grid, Card, CardContent, IconButton, 
  Divider, alpha, useTheme 
} from '@mui/material';
import { Close, CardGiftcard, ChevronRight, CheckCircle } from '@mui/icons-material';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const GiftMessageModal = ({ open, onClose, onConfirm, onSkip }) => {
  const { language } = useLanguage();
  const theme = useTheme();
  const { products } = useStore();

  const [step, setStep] = useState(1); // 1: Ask if want gift, 2: Choose card & message
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [form, setForm] = useState({
    to: '',
    from: '',
    message: ''
  });

  const giftProducts = useMemo(() => 
    products.filter(p => p.category === 'regalo' && p.active !== false),
  [products]);

  const selectedProduct = useMemo(() => 
    giftProducts.find(p => p.id === selectedCardId) || giftProducts[0],
  [giftProducts, selectedCardId]);

  const t = {
    es: {
      title: '¿Es un regalo?',
      subtitle: 'Añade un Mensaje de Regalo + Tarjeta Premium por solo $7.00',
      description: 'Haz que tu detalle sea aún más especial con una de nuestras tarjetas exclusivas y un mensaje personalizado.',
      addGift: 'Sí, añadir regalo',
      noGift: 'No, gracias',
      step2Title: 'Personaliza tu tarjeta',
      fillDetails: 'Completa los detalles',
      to: 'Para:',
      from: 'De:',
      message: 'Mensaje (máx. 250 caracteres):',
      finish: 'Añadir y continuar',
      back: 'Atrás',
      placeholderTo: 'Nombre de quien recibe',
      placeholderFrom: 'Tu nombre',
      placeholderMessage: 'Escribe tu mensaje aquí...'
    },
    en: {
      title: 'Is this a gift?',
      subtitle: 'Add a Gift Message + Premium Card for only $7.00',
      description: 'Make your gift even more special with one of our exclusive cards and a personalized message.',
      addGift: 'Yes, add gift',
      noGift: 'No, thanks',
      step2Title: 'Customize your card',
      fillDetails: 'Complete the details',
      to: 'To:',
      from: 'From:',
      message: 'Message (max. 250 chars):',
      finish: 'Add and continue',
      back: 'Back',
      placeholderTo: 'Recipient name',
      placeholderFrom: 'Your name',
      placeholderMessage: 'Write your message here...'
    }
  }[language] || {
    title: '¿Es un regalo?',
    subtitle: 'Añade un Mensaje de Regalo + Tarjeta Premium por solo $7.00',
    description: 'Haz que tu detalle sea aún más especial con una de nuestras tarjetas exclusivas y un mensaje personalizado.',
    addGift: 'Sí, añadir regalo',
    noGift: 'No, gracias',
    step2Title: 'Personaliza tu tarjeta',
    fillDetails: 'Completa los detalles',
    to: 'Para:',
    from: 'De:',
    message: 'Mensaje (máx. 250 caracteres):',
    finish: 'Añadir y continuar',
    back: 'Atrás',
    placeholderTo: 'Nombre de quien recibe',
    placeholderFrom: 'Tu nombre',
    placeholderMessage: 'Escribe tu mensaje aquí...'
  };

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  const handleFinish = () => {
    onConfirm({
      product: selectedProduct,
      details: form
    });
    setStep(1);
    setForm({ to: '', from: '', message: '' });
    setSelectedCardId(null);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => setStep(1), 300);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '24px', overflow: 'hidden' }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <IconButton 
          onClick={handleClose}
          sx={{ position: 'absolute', right: 16, top: 16, zIndex: 10, bgcolor: 'rgba(255,255,255,0.8)' }}
        >
          <Close />
        </IconButton>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ p: { xs: 3, md: 6 }, textAlign: 'center' }}>
                <Box sx={{ 
                  width: 80, height: 80, bgcolor: alpha('#c8626d', 0.1), 
                  borderRadius: '50%', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', mx: 'auto', mb: 3 
                }}>
                  <CardGiftcard sx={{ fontSize: 40, color: '#c8626d' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#333' }}>
                  {t.title}
                </Typography>
                <Typography variant="h6" sx={{ color: '#c8626d', fontWeight: 600, mb: 2 }}>
                  {t.subtitle}
                </Typography>
                <Typography sx={{ color: 'text.secondary', mb: 4, maxWidth: 500, mx: 'auto' }}>
                  {t.description}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center' }}>
                  <Button 
                    variant="contained" 
                    size="large"
                    onClick={handleNext}
                    sx={{ 
                      bgcolor: '#c8626d', borderRadius: '30px', px: 4, py: 1.5,
                      '&:hover': { bgcolor: '#b25763' }
                    }}
                  >
                    {t.addGift}
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="large"
                    onClick={onSkip}
                    sx={{ borderRadius: '30px', px: 4, py: 1.5, borderColor: '#ccc', color: '#666' }}
                  >
                    {t.noGift}
                  </Button>
                </Box>
              </Box>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, color: '#333' }}>
                  {t.step2Title}
                </Typography>
                
                <Grid container spacing={4}>
                  {/* Form Details */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                      {t.fillDetails}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField 
                          fullWidth 
                          label={t.to} 
                          placeholder={t.placeholderTo}
                          value={form.to}
                          onChange={(e) => setForm({...form, to: e.target.value})}
                          variant="outlined"
                          InputProps={{ sx: { borderRadius: '12px' } }}
                        />
                        <TextField 
                          fullWidth 
                          label={t.from} 
                          placeholder={t.placeholderFrom}
                          value={form.from}
                          onChange={(e) => setForm({...form, from: e.target.value})}
                          variant="outlined"
                          InputProps={{ sx: { borderRadius: '12px' } }}
                        />
                      </Box>
                      <TextField 
                        fullWidth 
                        multiline 
                        rows={4} 
                        label={t.message} 
                        placeholder={t.placeholderMessage}
                        value={form.message}
                        onChange={(e) => setForm({...form, message: e.target.value.substring(0, 250)})}
                        variant="outlined"
                        InputProps={{ sx: { borderRadius: '12px' } }}
                        helperText={`${form.message.length}/250`}
                      />
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button onClick={handleBack} sx={{ color: 'text.secondary' }}>
                    {t.back}
                  </Button>
                  <Button 
                    variant="contained" 
                    size="large"
                    onClick={handleFinish}
                    disabled={!form.to || !form.from || !form.message}
                    sx={{ 
                      bgcolor: '#c8626d', borderRadius: '30px', px: 4,
                      '&:hover': { bgcolor: '#b25763' }
                    }}
                  >
                    {t.finish}
                  </Button>
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default GiftMessageModal;
