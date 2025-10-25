import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Container, Typography, Grid, Card, CardContent, CardActions, Button, Chip, Rating, IconButton, TextField, InputAdornment, Dialog, DialogContent, Skeleton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { Search, AddShoppingCart, Favorite, FavoriteBorder, AccountBalanceWallet, ShoppingBag } from '@mui/icons-material';
import { useStore } from '../context/StoreContext';
import ProductImageCarousel from '../components/ProductImageCarousel';
import ProductImage from '../components/ProductImage';
import AfterpayMessaging from '../components/AfterpayMessaging';
import { useTranslation } from 'react-i18next';

const Products = () => {
  const { t } = useTranslation();
  const { categories, products, addToCart, productsLoading } = useStore();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  return (
    <Box className="products-page-mobile" sx={{ 
      py: 4, 
      pt: { xs: 6, sm: 18, md: 18 }, 
      backgroundColor: '#fafafa', 
      minHeight: '100vh' 
    }}>
      <Container maxWidth="xl" sx={{ maxWidth: '1400px' }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          
          


          {/* Filtros por categoría eliminados a solicitud */}
        </Box>

        {/* Grid de productos */}
        <Grid container spacing={3} justifyContent="center" className="products-grid-mobile">
          {productsLoading ? (
            // Skeleton loading mientras cargan los productos
            Array.from({ length: 8 }).map((_, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                <Card sx={{ width: '280px', height: '320px', display: 'flex', flexDirection: 'column' }}>
                  <Skeleton variant="rectangular" height={280} />
                  <CardContent>
                    <Skeleton variant="text" height={30} />
                    <Skeleton variant="text" height={20} />
                    <Skeleton variant="text" height={20} />
                  </CardContent>
                  <CardActions>
                    <Skeleton variant="rectangular" height={40} width="100%" />
                  </CardActions>
                </Card>
              </Grid>
            ))
          ) : (
            products.map((product, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={product.id}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <Card
                  className="product-card-mobile"
                  onClick={() => { 
                    console.log('Producto clickeado:', product);
                    setSelected(product); 
                    setOpen(true);
                    console.log('Abriendo dialog, open:', true);
                  }}
                  sx={{
                    width: '280px',
                    height: '320px',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
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
                      height={180}
                      width={160}
                      sx={{
                        transition: 'transform 0.3s ease',
                        transform: 'translateY(0px)',
                        '&:hover': {
                          transform: 'translateY(0px) scale(1.05)'
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

                  <CardContent sx={{ flexGrow: 0, p: 1.5, transform: 'translateY(-10px)' }}>
                    <Typography
                      variant="h6"
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
                          ({product.reviews} {t('cart.reviews', 'reviews')})
                        </Typography>
                      </Box>
                    </Box>

                    {/* Inventario */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, transform: 'translateY(-10px)' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#666',
                          fontSize: '0.8rem',
                          fontWeight: 500
                        }}
                      >
                        Stock: {product.inventory || 0} units
                      </Typography>
                      <Chip
                        label={
                          (product.inventory || 0) === 0 ? t('product.outOfStock', 'Out of Stock') :
                          (product.inventory || 0) < 10 ? t('product.lowStock', 'Low Stock') :
                          (product.inventory || 0) < 50 ? t('product.mediumStock', 'Medium Stock') : t('product.inStock', 'In Stock')
                        }
                        size="small"
                        sx={{
                          backgroundColor: 
                            (product.inventory || 0) === 0 ? '#7C281520' :
                            (product.inventory || 0) < 10 ? '#EB8B8B20' :
                            (product.inventory || 0) < 50 ? '#8D9A7D20' : '#C8626D20',
                          color: 
                            (product.inventory || 0) === 0 ? '#7C2815' :
                            (product.inventory || 0) < 10 ? '#EB8B8B' :
                            (product.inventory || 0) < 50 ? '#8D9A7D' : '#C8626D',
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 0.5, pt: 0, mt: -2, transform: 'translateY(-10px)' }}>
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
            ))
          )}
        </Grid>

        {/* Popup de producto */}
        <Dialog
          open={open}
          onClose={() => {
            console.log('Cerrando dialog');
            setOpen(false);
          }}
          maxWidth="md"
          fullWidth
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
          PaperProps={{
            sx: {
              borderRadius: '20px',
              minHeight: '600px',
              maxHeight: '90vh',
              backgroundColor: '#fafafa',
              border: '1px solid #e0e0e0',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
            }
          }}
        >
          <DialogContent sx={{ p: 0, position: 'relative' }}>
            <IconButton
              aria-label={t('cart.close', 'Close')}
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
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: '500px' }}>
                {/* Lado Izquierdo - Imagen */}
                <Box sx={{ flex: 1, height: '500px', overflow: 'hidden', position: 'relative' }}>
                  {selected.images && selected.images.length > 1 ? (
                    <ProductImageCarousel images={selected.images} />
                  ) : (
                    <img
                      src={selected.image}
                      alt={selected.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  )}
                </Box>
                
                {/* Lado Derecho - Información */}
                <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700, 
                      mb: 1, 
                      color: '#333',
                      fontFamily: '"Asap", sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {selected.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Rating value={selected.rating} precision={0.1} readOnly size="small" sx={{ color: '#FFD700' }} />
                      <Typography variant="body2" sx={{ ml: 1, color: '#666' }}>({selected.reviews} {t('cart.reviews', 'reviews')})</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#c8626d', mb: 2 }}>
                      ${selected.price}
                    </Typography>
                    
                    {/* Afterpay Messaging */}
                    {selected.price >= 1 && selected.price <= 4000 && (
                      <AfterpayMessaging amount={selected.price} />
                    )}
                    
                    {/* Información de inventario en el popup */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#666',
                          fontSize: '0.9rem',
                          fontWeight: 500
                        }}
                      >
                        {t('product.stockAvailable', 'Stock available')}: {selected.inventory || 0} {t('product.units', 'units')}
                      </Typography>
                      <Chip
                        label={
                          (selected.inventory || 0) === 0 ? t('product.outOfStock', 'Out of Stock') :
                          (selected.inventory || 0) < 10 ? t('product.lowStock', 'Low Stock') :
                          (selected.inventory || 0) < 50 ? t('product.mediumStock', 'Medium Stock') : t('product.inStock', 'In Stock')
                        }
                        size="small"
                        sx={{
                          backgroundColor: 
                            (selected.inventory || 0) === 0 ? '#7C281520' :
                            (selected.inventory || 0) < 10 ? '#EB8B8B20' :
                            (selected.inventory || 0) < 50 ? '#8D9A7D20' : '#C8626D20',
                          color: 
                            (selected.inventory || 0) === 0 ? '#7C2815' :
                            (selected.inventory || 0) < 10 ? '#EB8B8B' :
                            (selected.inventory || 0) < 50 ? '#8D9A7D' : '#C8626D',
                          fontWeight: 600,
                          fontSize: '0.8rem'
                        }}
                      />
                    </Box>
                    
                    <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.6, mb: 3 }}>
                      {selected.description || 
                        (selected.name && selected.name.toLowerCase().includes('ferrero') 
                          ? t('product.ferreroDescription', 'NY-style cookie with Ferrero Rocher...')
                          : t('product.defaultDescription', 'Delicious {name} with premium ingredients...', { name: selected.name })
                        )
                      }
                    </Typography>
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
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Products;
