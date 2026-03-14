import React, { useMemo } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Check, Close } from '@mui/icons-material';
import { useLanguage } from '../context/LanguageContext';

const TEXTS = {
  es: {
    stats: 'Más de 10,000+ galletas hechas',
    happy: '& más de 2,500+ clientes felices & no solo confiamos en nuestra palabra...',
    evil: 'Evil Corporate',
    or: 'o',
    benefits: 'BENEFICIOS',
    delizukar: 'DELIZUKAR',
    evilCorporate: 'EVIL CORPORATE',
    cleanIngredients: 'Ingredientes limpios',
    bakedFresh: 'Horneado fresco tras tu pedido',
    realButter: 'Mantequilla real y chocolate premium',
    smallBatches: 'Hecho a mano en pequeños lotes',
    satisfaction: '100% Garantía de satisfacción'
  },
  en: {
    stats: 'Over 10,000+ Cookies Made',
    happy: '& over 2,500+ happy customers & don\'t just take our word for it....',
    evil: 'Evil Corporate',
    or: 'or',
    benefits: 'BENEFITS',
    delizukar: 'DELIZUKAR',
    evilCorporate: 'EVIL CORPORATE',
    cleanIngredients: 'Clean ingredients',
    bakedFresh: 'Baked Fresh After You Order',
    realButter: 'Real Butter & Premium Chocolate',
    smallBatches: 'Handmade in Small Batches',
    satisfaction: '100% Satisfaction Guarantee'
  }
};

const ComparisonTable = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { language } = useLanguage();

  const t = useMemo(() => TEXTS[language] || TEXTS.es, [language]);

  const rows = [
    { benefit: t.cleanIngredients, delizukar: true, corporate: false },
    { benefit: t.bakedFresh, delizukar: true, corporate: false },
    { benefit: t.realButter, delizukar: true, corporate: false },
    { benefit: t.smallBatches, delizukar: true, corporate: false },
    { benefit: t.satisfaction, delizukar: true, corporate: false },
  ];

  return (
    <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
      {/* Header removido por petición del usuario */}

      <TableContainer component={Paper} elevation={0} sx={{ 
        borderRadius: '20px', 
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        border: '1px solid #eee',
        maxWidth: '800px',
        mx: 'auto'
      }}>
        <Table sx={{ minWidth: { xs: 280, md: 500 } }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#c8626d' }}>
              <TableCell sx={{ color: 'white', fontWeight: 800, py: 3, fontSize: '0.9rem', letterSpacing: '1px' }}>{t.benefits}</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 800, py: 3, fontSize: '0.9rem', letterSpacing: '1px' }}>{t.delizukar}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index} sx={{ 
                '&:last-child td, &:last-child th': { border: 0 },
                backgroundColor: 'white'
              }}>
                <TableCell component="th" scope="row" sx={{ 
                  fontWeight: 600, 
                  color: '#444', 
                  py: 3,
                  fontSize: { xs: '0.85rem', md: '1.1rem' }
                }}>
                  {row.benefit}
                </TableCell>
                <TableCell align="center">
                  <Check sx={{ color: '#4CAF50', fontSize: { xs: 20, md: 28 } }} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default ComparisonTable;
