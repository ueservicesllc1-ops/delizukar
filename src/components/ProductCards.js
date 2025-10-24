import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Grid, Card, CardContent, CardActions, Button, Chip, Rating, IconButton, Dialog, DialogContent, Typography } from '@mui/material';
import { Close, AddShoppingCart, FavoriteBorder, AccountBalanceWallet, ShoppingBag } from '@mui/icons-material';
import { useStore } from '../context/StoreContext';
import ProductImage from './ProductImage';
import { useTranslation } from 'react-i18next';

const ProductCards = ({ products: propProducts, showAll = false }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const { addToCart, products } = useStore();
  
  const displayProducts = showAll ? products : (() => {
    const bestSellers = products.filter(product => product.bestSeller);
    // Si hay menos de 2 bestSellers, tomar los primeros productos disponibles
    if (bestSellers.length < 2) {
      return products.slice(0, 4);
    }
    return bestSellers.slice(0, 4);
  })();
  
  console.log('ProductCards - products:', products);
  console.log('ProductCards - displayProducts:', displayProducts);

  return (
    <>
      <Grid container spacing={4}>
        {displayProducts.map((product, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={product.id}>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
            >
              <Card
                className="product-card-mobile"
                onClick={() => { setSelected(product); setOpen(true); }}
                sx={{
                  height: '360px',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
                    transform: 'translateY(-5px)'
                  }
                }}
              >
                {/* Imagen del producto */}
                <Box className="product-image-container" sx={{ position: 'relative', overflow: 'hidden' }}>
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      height={280}
                      sx={{
                        transition: 'transform 0.3s ease',
                        transform: 'translateY(-20px)',
                        '&:hover': {
                          transform: 'translateY(-20px) scale(1.05)'
                        }
                      }}
                    />
                  
                  {/* Badges */}
                  <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {product.isNew && (
                      <Chip
                        label={t('product.new', 'New')}
                        size="small"
                        sx={{
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                    )}
                    {product.isBestSeller && (
                      <Chip
                        label={t('product.bestSeller', 'Best Seller')}
                        size="small"
                        sx={{
                          backgroundColor: '#FF6B35',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                    )}
                  </Box>

                  {/* Botón de favoritos */}
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,1)'
                      }
                    }}
                  >
                    <FavoriteBorder />
                  </IconButton>
                </Box>

                <CardContent className="product-card-content-mobile" sx={{ flexGrow: 0, p: 1.5, transform: 'translateY(-10px)' }}>
                    <Typography
                      variant="h6"
                      className="product-title-mobile"
                      sx={{
                        fontWeight: 600,
                        mb: 0.5,
                        color: '#333',
                        fontSize: '1rem',
                        transform: 'translateY(5px)',
                        fontFamily: '"Asap", sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {product.name}
                    </Typography>

                    {/* Precio y Rating */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5, mt: 1, transform: 'translateY(-10px)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="h6"
                          className="product-price-mobile"
                          sx={{
                            fontWeight: 700,
                            color: '#c8626d',
                            fontSize: '1.3rem'
                          }}
                        >
                          ${product.price}
                        </Typography>
                        {product.originalPrice && (
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#999',
                              textDecoration: 'line-through',
                              fontSize: '1rem'
                            }}
                          >
                            ${product.originalPrice}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating
                          value={product.rating}
                          precision={0.1}
                          readOnly
                          size="small"
                          sx={{ color: '#FFD700' }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ ml: 0.5, color: '#666', fontSize: '0.8rem' }}
                        >
                          ({product.reviews})
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>

                <CardActions sx={{ p: 1, pt: 0, mt: -2, transform: 'translateY(-10px)' }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<ShoppingBag />}
                    sx={{
                      backgroundColor: '#c8626d',
                      color: 'white',
                      py: 0.5,
                      borderRadius: '15px',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      '&:hover': {
                        backgroundColor: '#b25763',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(139, 69, 19, 0.3)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                  >
                    {t('product.addToCart', 'Add to Cart')}
                  </Button>
                </CardActions>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Popup de producto */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
        PaperProps={{
          sx: {
            borderRadius: '20px',
            backgroundColor: '#fafafa',
            border: '1px solid #e0e0e0',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
            sx={{ 
              position: 'absolute', 
              top: 8, 
              right: 8, 
              zIndex: 1, 
              backgroundColor: 'rgba(200, 98, 109, 0.1)',
              color: '#c8626d',
              '&:hover': {
                backgroundColor: 'rgba(200, 98, 109, 0.2)'
              }
            }}
          >
            <Close />
          </IconButton>
          {selected && (
            <Grid container>
              <Grid item xs={12} md={6}>
                <Box sx={{ height: '100%', minHeight: { xs: 240, md: 420 }, overflow: 'hidden' }}>
                  <img
                    src={selected.image}
                    alt={selected.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: { xs: 2, md: 3 } }}>
                  <Box component="h5" sx={{ 
                    fontWeight: 700, 
                    mb: 1, 
                    color: '#333',
                    fontFamily: '"Asap", sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {selected.name}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Rating value={selected.rating} precision={0.1} readOnly size="small" sx={{ color: '#FFD700' }} />
                    <Box component="span" sx={{ ml: 1, color: '#666' }}>({selected.reviews} {t('cart.reviews', 'reviews')})</Box>
                  </Box>
                  <Box component="h6" sx={{ fontWeight: 700, color: '#c8626d', mb: 2 }}>
                    ${selected.price}
                  </Box>
                  <Box component="p" sx={{ color: '#666', lineHeight: 1.6, mb: 3 }}>
                    {selected.description || 
                      (selected.name && selected.name.toLowerCase().includes('ferrero') 
                        ? t('product.ferreroDescription', 'NY-style cookie with Ferrero Rocher...')
                        : t('product.defaultDescription', 'Delicious {name} with premium ingredients...', { name: selected.name })
                      )
                    }
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<ShoppingBag />}
                    sx={{
                      backgroundColor: '#c8626d',
                      textTransform: 'none',
                      fontWeight: 700,
                      py: 1.5,
                      '&:hover': { backgroundColor: '#b25763' }
                    }}
                    onClick={() => {
                      addToCart(selected);
                      setOpen(false);
                    }}
                  >
                    {t('product.addToCart', 'Add to Cart')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductCards;
