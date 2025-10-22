import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Chip,
  Rating,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  AddShoppingCart,
  Favorite,
  FavoriteBorder,
  Star
} from '@mui/icons-material';
import { useStore } from '../context/StoreContext';

const FeaturedProducts = () => {
  const { featuredProducts, addToCart } = useStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <Box sx={{ py: 8, backgroundColor: '#fafafa' }}>
      <Container maxWidth="lg">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <motion.div variants={itemVariants}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2rem', md: '3rem' },
                  fontWeight: 800,
                  color: '#EC8C8D',
                  mb: 2,
                  fontFamily: 'Playfair Display, serif'
                }}
              >
                Galletas Destacadas
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: '#666',
                  maxWidth: '600px',
                  mx: 'auto',
                  lineHeight: 1.6
                }}
              >
                Descubre nuestras galletas más populares, horneadas con ingredientes premium 
                y el sabor auténtico de Nueva York
              </Typography>
            </motion.div>
          </Box>

          <Grid container spacing={4}>
            {featuredProducts.map((product, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={product.id}>
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                <Card
                  sx={{
                    height: '450px',
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
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="350"
                        image={product.image}
                        alt={product.name}
                        sx={{
                          objectFit: 'contain',
                          backgroundColor: '#f8f8f8',
                          transition: 'transform 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.05)'
                          }
                        }}
                      />
                      
                      {/* Badges */}
                      <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {product.isNew && (
                          <Chip
                            label="Nuevo"
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
                            label="Más Vendido"
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

                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          mb: 1,
                          color: '#EC8C8D',
                          fontSize: '1.1rem'
                        }}
                      >
                        {product.name}
                      </Typography>

                      {/* Rating */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Rating
                          value={product.rating}
                          precision={0.1}
                          readOnly
                          size="small"
                          sx={{ color: '#FFD700' }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ ml: 1, color: '#666', fontSize: '0.85rem' }}
                        >
                          ({product.reviews})
                        </Typography>
                      </Box>

                      {/* Precio */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: '#8B4513',
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
                    </CardContent>

                    <CardActions sx={{ p: 1.5, pt: 0 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<AddShoppingCart />}
                        onClick={() => addToCart(product)}
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
                      >
                        Agregar al Carrito
                      </Button>
                    </CardActions>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* Botón para ver más productos */}
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outlined"
                size="large"
                href="/productos"
                sx={{
                  borderColor: '#8B4513',
                  color: '#8B4513',
                  px: 4,
                  py: 1.5,
                  borderRadius: '25px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  '&:hover': {
                    backgroundColor: '#8B4513',
                    color: 'white',
                    borderColor: '#8B4513',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(139, 69, 19, 0.3)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Ver Todas las Galletas
              </Button>
            </motion.div>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default FeaturedProducts;
