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
      subtitle: 'Añade un Mensaje de Regalo + Tarjeta Premium por solo $9.00',
      description: 'Haz que tu detalle sea aún más especial con una de nuestras tarjetas exclusivas y un mensaje personalizado.',
      addGift: 'Sí, añadir regalo',
      noGift: 'No, gracias',
      step2Title: 'Personaliza tu tarjeta',
      chooseCard: '1. Elige tu diseño',
      fillDetails: '2. Completa los detalles',
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
      subtitle: 'Add a Gift Message + Premium Card for only $9.00',
      description: 'Make your gift even more special with one of our exclusive cards and a personalized message.',
      addGift: 'Yes, add gift',
      noGift: 'No, thanks',
      step2Title: 'Customize your card',
      chooseCard: '1. Choose your design',
      fillDetails: '2. Fill in the details',
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
    subtitle: 'Añade un Mensaje de Regalo + Tarjeta Premium por solo $9.00',
    description: 'Haz que tu detalle sea aún más especial con una de nuestras tarjetas exclusivas y un mensaje personalizado.',
    addGift: 'Sí, añadir regalo',
    noGift: 'No, gracias',
    step2Title: 'Personaliza tu tarjeta',
    chooseCard: '1. Elige tu diseño',
    fillDetails: '2. Completa los detalles',
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
                  {/* Card Selection */}
                  <Grid item xs={12} md={5}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                      {t.chooseCard}
                    </Typography>
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: 2,
                      maxHeight: 400,
                      overflowY: 'auto',
                      pr: 1
                    }}>
                      {giftProducts.length > 0 ? giftProducts.map(card => (
                        <Card 
                          key={card.id}
                          onClick={() => setSelectedCardId(card.id)}
                          sx={{ 
                            cursor: 'pointer',
                            borderRadius: '12px',
                            border: `2px solid ${selectedCardId === card.id || (!selectedCardId && card.id === giftProducts[0].id) ? '#c8626d' : 'transparent'}`,
                            position: 'relative',
                            transition: 'all 0.2s ease',
                            '&:hover': { transform: 'scale(1.02)' },
                            height: '140px', // Fixed height for consistency
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          <Box sx={{ height: 100, overflow: 'hidden' }}>
                            <img 
                              src={card.image} 
                              alt={card.name} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                          </Box>
                          <CardContent sx={{ p: 1, textAlign: 'center', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem', lineHeight: 1.1 }} noWrap>
                              {card[`name_${language}`] || card.name}
                            </Typography>
                          </CardContent>
                          {(selectedCardId === card.id || (!selectedCardId && card.id === giftProducts[0].id)) && (
                            <CheckCircle sx={{ position: 'absolute', top: 4, right: 4, color: '#c8626d', fontSize: 20, bgcolor: 'white', borderRadius: '50%' }} />
                          )}
                        </Card>
                      )) : (
                        // Fallback if no products found in database with category regalo
                        [1, 2, 3, 4].map(i => (
                          <Card 
                            key={i}
                            onClick={() => setSelectedCardId(i)}
                            sx={{ 
                              cursor: 'pointer',
                              borderRadius: '12px',
                              border: `2px solid ${selectedCardId === i ? '#c8626d' : 'transparent'}`,
                              bgcolor: i === 1 ? '#fff5f5' : i === 2 ? '#f5fff5' : i === 3 ? '#f5f5ff' : '#fff9f5',
                              height: '140px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Typography variant="caption">Card Design {i}</Typography>
                            {selectedCardId === i && <CheckCircle sx={{ position: 'absolute', top: 4, right: 4, color: '#c8626d', fontSize: 20 }} />}
                          </Card>
                        ))
                      )}
                    </Box>
                  </Grid>

                  {/* Form Details */}
                  <Grid item xs={12} md={7}>
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
