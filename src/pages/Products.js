import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Box, Container, Typography, Grid, Card, CardContent, CardActions, Button, Chip, Rating, IconButton, TextField, InputAdornment, Dialog, DialogContent, Skeleton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { Search, AddShoppingCart, Favorite, FavoriteBorder, AccountBalanceWallet, ShoppingBag } from '@mui/icons-material';
import { useStore } from '../context/StoreContext';
import ProductImageCarousel from '../components/ProductImageCarousel';
import ProductImage from '../components/ProductImage';
import AfterpayMessaging from '../components/AfterpayMessaging';
import { useLanguage } from '../context/LanguageContext';

const TEXTS = {
  es: {
    title: 'Nuestras Galletas',
    addToCart: 'Agregar al carrito',
    nuevo: 'Nuevo',
    masVendido: 'Más vendido',
    stock: 'Stock:',
    units: 'unidades',
    agotado: 'Agotado',
    stockBajo: 'Stock bajo',
    stockMedio: 'Stock medio',
    enStock: 'En stock',
    reseñas: 'reseñas',
    cerrar: 'Cerrar',
    stockDisponible: 'Stock disponible:',
    unidades: 'unidades'
  },
  en: {
    title: 'Our Cookies',
    addToCart: 'Add to cart',
    nuevo: 'New',
    masVendido: 'Best seller',
    stock: 'Stock:',
    units: 'units',
    agotado: 'Out of stock',
    stockBajo: 'Low stock',
    stockMedio: 'Medium stock',
    enStock: 'In stock',
    reseñas: 'reviews',
    cerrar: 'Close',
    stockDisponible: 'Stock available:',
    unidades: 'units'
  },
  fr: {
    title: 'Nos biscuits',
    addToCart: 'Ajouter au panier',
    nuevo: 'Nouveau',
    masVendido: 'Meilleure vente',
    stock: 'Stock :',
    units: 'unités',
    agotado: 'Rupture de stock',
    stockBajo: 'Stock bas',
    stockMedio: 'Stock moyen',
    enStock: 'En stock',
    reseñas: 'avis',
    cerrar: 'Fermer',
    stockDisponible: 'Stock disponible :',
    unidades: 'unités'
  },
  pt: {
    title: 'Nossos cookies',
    addToCart: 'Adicionar ao carrinho',
    nuevo: 'Novo',
    masVendido: 'Mais vendido',
    stock: 'Estoque:',
    units: 'unidades',
    agotado: 'Esgotado',
    stockBajo: 'Estoque baixo',
    stockMedio: 'Estoque médio',
    enStock: 'Em estoque',
    reseñas: 'avaliações',
    cerrar: 'Fechar',
    stockDisponible: 'Estoque disponível:',
    unidades: 'unidades'
  }
};

const Products = () => {
  const { language } = useLanguage();
  const { categories, products, addToCart, productsLoading } = useStore();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const translatedTexts = useMemo(
    () => TEXTS[language] || TEXTS.es,
    [language]
  );

  return (
    <Box className="products-page-mobile" sx={{ 
      py: 4, 
      pt: { xs: 6, sm: 18, md: 18 }, 
      backgroundColor: '#fafafa', 
      minHeight: '100vh' 
    }}>
      <Container maxWidth="xl" sx={{ maxWidth: '1400px' }}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            sx={{
              fontFamily: 'BrittanySignature',
              fontSize: { xs: '2.4rem', md: '3rem' },
              mt: { xs: 0, md: 2.5 },
              color: '#c8626d'
            }}
          >
            {translatedTexts.title}
          </Typography>
        </Box>

        {/* Grid de productos */}
        <Grid container spacing={3} className="products-grid-mobile" sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(3, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))'
          },
          gap: { xs: 2, md: 3, lg: 3.5 }
        }}>
          {productsLoading ? (
            // Skeleton loading mientras cargan los productos
            Array.from({ length: 8 }).map((_, index) => (
              <Box key={index}>
                <Card sx={{ width: '100%', height: '320px', display: 'flex', flexDirection: 'column' }}>
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
              </Box>
            ))
          ) : (
            products.map((product, index) => (
            <Box key={product.id}>
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
                    width: '100%',
                    maxWidth: '100%',
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
                          label={translatedTexts.nuevo}
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
                          label={translatedTexts.masVendido}
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
                        {translatedTexts.stock} {product.inventory || 0} {translatedTexts.units}
                      </Typography>
                      <Chip
                        label={
                          (product.inventory || 0) === 0 ? translatedTexts.agotado :
                          (product.inventory || 0) < 10 ? translatedTexts.stockBajo :
                          (product.inventory || 0) < 50 ? translatedTexts.stockMedio : translatedTexts.enStock
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
                      {translatedTexts.addToCart}
                    </Button>
                  </CardActions>
                </Card>
              </motion.div>
            </Box>
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
              aria-label={translatedTexts.cerrar}
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
                      <Typography variant="body2" sx={{ ml: 1, color: '#666' }}>({selected.reviews} {translatedTexts.reseñas})</Typography>
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
                        {translatedTexts.stockDisponible} {selected.inventory || 0} {translatedTexts.unidades}
                      </Typography>
                      <Chip
                        label={
                          (selected.inventory || 0) === 0 ? translatedTexts.agotado :
                          (selected.inventory || 0) < 10 ? translatedTexts.stockBajo :
                          (selected.inventory || 0) < 50 ? translatedTexts.stockMedio : translatedTexts.enStock
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
                          ? 'Galleta estilo NY con Ferrero Rocher, chips de chocolate oscuro y avellanas tostadas—intensa, elegante y adictiva.'
                          : `Deliciosas ${selected.name} con ingredientes premium. Galletas estilo Nueva York perfectamente horneadas para disfrutar o compartir.`
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
                      {translatedTexts.addToCart}
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
