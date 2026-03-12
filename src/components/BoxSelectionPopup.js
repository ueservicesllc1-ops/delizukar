import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, 
  IconButton, Stack, Typography, Button, Box, alpha 
} from '@mui/material';
import { Close, AutoFixHigh, TouchApp } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import GiftMessageModal from './GiftMessageModal';
import toast from 'react-hot-toast';

const TEXTS = {
  en: {
    selectionTitle: 'How do you want to build your box?',
    surprise: 'Surprise me',
    surpriseNote: 'We will choose the best mix for you.',
    chooseMyself: 'Choose myself',
    added: 'Box added to cart successfully'
  },
  es: {
    selectionTitle: '¿Cómo quieres armar tu caja?',
    surprise: 'Sorpréndeme',
    surpriseNote: 'Nosotros elegiremos por ti.',
    chooseMyself: 'Elegir yo mismo',
    added: 'Caja agregada al carrito con éxito'
  }
};

const BoxSelectionPopup = ({ open, onClose, selectedBox }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addToCart } = useStore();
  const t = TEXTS[language] || TEXTS.es;

  const [showGiftModal, setShowGiftModal] = React.useState(false);
  const [pendingBox, setPendingBox] = React.useState(null);

  const handleManual = () => {
    onClose();
    navigate(`/armar-caja/${selectedBox.id}`);
  };

  const handleSurprise = () => {
    onClose();
    
    // Crear el item de caja sorpresa
    const surpriseBox = {
      ...selectedBox,
      id: `${selectedBox.id}-${Date.now()}`,
      baseId: selectedBox.id,
      description_extra: language === 'es' ? 'Selección Sorpresa (Delizukar elige por ti)' : 'Surprise Selection (Delizukar chooses for you)'
    };
    
    setPendingBox(surpriseBox);
    setShowGiftModal(true);
  };

  const handleGiftConfirm = (giftData) => {
    if (pendingBox) {
      addToCart(pendingBox);
      
      const giftItem = {
        ...giftData.product,
        id: `${giftData.product.id}-${Date.now()}`,
        giftDetails: giftData.details,
        description_extra: `Para: ${giftData.details.to} - De: ${giftData.details.from} - Mensaje: ${giftData.details.message}`
      };
      
      addToCart(giftItem);
      toast.success(t.added);
      setShowGiftModal(false);
      navigate('/carrito');
    }
  };

  const handleGiftSkip = () => {
    if (pendingBox) {
      addToCart(pendingBox);
      toast.success(t.added);
      setShowGiftModal(false);
      navigate('/carrito');
    }
  };

  if (!selectedBox) return null;

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '24px', p: 1 }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 800, pt: 3 }}>
          {t.selectionTitle}
          <IconButton
            onClick={onClose}
            sx={{ position: 'absolute', right: 16, top: 16, color: 'grey.500' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pb: 4 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<AutoFixHigh />}
              onClick={handleSurprise}
              sx={{
                py: 2,
                borderRadius: '20px',
                backgroundColor: '#c8626d',
                display: 'flex',
                flexDirection: 'column',
                height: 'auto',
                gap: 0.5,
                '&:hover': { backgroundColor: '#b25763' }
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, textTransform: 'none' }}>
                {t.surprise}
              </Typography>
              <Typography variant="caption" sx={{ textTransform: 'none', opacity: 0.9, fontWeight: 400 }}>
                {t.surpriseNote}
              </Typography>
            </Button>

            <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
              <Typography variant="caption" sx={{ px: 2, color: 'text.secondary', fontWeight: 600 }}>
                O
              </Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
            </Box>

            <Button
              variant="outlined"
              fullWidth
              size="large"
              startIcon={<TouchApp />}
              onClick={handleManual}
              sx={{
                py: 2,
                borderRadius: '20px',
                borderColor: '#c8626d',
                color: '#c8626d',
                fontWeight: 800,
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#b25763',
                  backgroundColor: alpha('#c8626d', 0.05)
                }
              }}
            >
              {t.chooseMyself}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <GiftMessageModal 
        open={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        onConfirm={handleGiftConfirm}
        onSkip={handleGiftSkip}
      />
    </>
  );
};

export default BoxSelectionPopup;
