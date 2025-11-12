import React from 'react';
import { motion } from 'framer-motion';
import { Box, Container, Typography, Grid, Card, CardMedia, CardContent, Button, Rating, Chip, IconButton } from '@mui/material';
import { AddShoppingCart, Favorite, Share, ArrowBack, AccountBalanceWallet, ShoppingBag } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const TEXTS = {
  es: {
    backToProducts: 'Volver a productos',
    new: 'Nuevo',
    bestSeller: 'Más vendido',
    reviews: 'reseñas',
    ingredients: 'Ingredientes:',
    nutrition: 'Información nutricional (por porción):',
    calories: 'Calorías',
    fat: 'Grasa',
    carbs: 'Carbohidratos',
    protein: 'Proteína',
    addToCart: 'Agregar al carrito'
  },
  en: {
    backToProducts: 'Back to products',
    new: 'New',
    bestSeller: 'Best seller',
    reviews: 'reviews',
    ingredients: 'Ingredients:',
    nutrition: 'Nutrition facts (per serving):',
    calories: 'Calories',
    fat: 'Fat',
    carbs: 'Carbs',
    protein: 'Protein',
    addToCart: 'Add to cart'
  },
  fr: {
    backToProducts: 'Retour aux produits',
    new: 'Nouveau',
    bestSeller: 'Meilleure vente',
    reviews: 'avis',
    ingredients: 'Ingrédients :',
    nutrition: 'Informations nutritionnelles (par portion) :',
    calories: 'Calories',
    fat: 'Matières grasses',
    carbs: 'Glucides',
    protein: 'Protéines',
    addToCart: 'Ajouter au panier'
  },
  pt: {
    backToProducts: 'Voltar aos produtos',
    new: 'Novo',
    bestSeller: 'Mais vendido',
    reviews: 'avaliações',
    ingredients: 'Ingredientes:',
    nutrition: 'Informação nutricional (por porção):',
    calories: 'Calorias',
    fat: 'Gordura',
    carbs: 'Carboidratos',
    protein: 'Proteína',
    addToCart: 'Adicionar ao carrinho'
  }
};

const ProductDetail = () => {
  const { language } = useLanguage();
  const texts = TEXTS[language] || TEXTS.es;
  const { id } = useParams();
  const navigate = useNavigate();

  // Datos de ejemplo para la galleta
  const product = {
    id: 1,
    name: "Chocolate Chip Clásicas",
    price: 12.99,
    originalPrice: 15.99,
    rating: 4.8,
    reviews: 124,
    images: [
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    ],
    category: "NY Style Cookies",
    isNew: true,
    isBestSeller: true,
    description: "Las galletas de chocolate chip más auténticas de Nueva York. Horneadas con ingredientes premium y el sabor tradicional que todos amamos.",
    ingredients: ["Harina de trigo", "Chocolate negro", "Mantequilla", "Azúcar", "Huevos", "Vainilla"],
    nutrition: {
      calories: 150,
      fat: 8,
      carbs: 18,
      protein: 2
    }
  };

  return (
    <Box sx={{ py: 4, pt: 18, backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {/* Botón de regreso */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/productos')}
            sx={{
              color: '#c8626d',
              mb: 4,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {texts.backToProducts}
          </Button>
        </motion.div>

        <Grid container spacing={6}>
          {/* Galería de imágenes */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card
                sx={{
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              >
                <CardMedia
                  component="img"
                  height="500"
                  image={product.images[0]}
                  alt={product.name}
                  sx={{
                    objectFit: 'cover'
                }}
              />
              </Card>
            </motion.div>
          </Grid>

          {/* Información del producto */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Box sx={{ mb: 3 }}>
                {/* Badges */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  {product.isNew && (
                    <Chip
                      label={texts.new}
                      sx={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  )}
                  {product.isBestSeller && (
                    <Chip
                      label={texts.bestSeller}
                      sx={{
                        backgroundColor: '#FF6B35',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  )}
                </Box>

                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    color: '#c8626d',
                    mb: 2,
                    fontFamily: 'Playfair Display, serif'
                  }}
                >
                  {product.name}
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    color: '#666',
                    mb: 3
                  }}
                >
                  {product.category}
                </Typography>

                {/* Rating */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Rating
                    value={product.rating}
                    precision={0.1}
                    readOnly
                    sx={{ color: '#FFD700', mr: 1 }}
                  />
                  <Typography
                    variant="body1"
                    sx={{ color: '#666', fontWeight: 600 }}
                  >
                    {product.rating} ({product.reviews} {texts.reviews})
                  </Typography>
                </Box>

                {/* Precio */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      color: '#c8626d',
                      fontSize: '2.5rem'
                    }}
                  >
                    ${product.price}
                  </Typography>
                  {product.originalPrice && (
                    <Typography
                      variant="h5"
                      sx={{
                        color: '#999',
                        textDecoration: 'line-through'
                      }}
                    >
                      ${product.originalPrice}
                    </Typography>
                  )}
                </Box>

                {/* Descripción */}
                <Typography
                  variant="body1"
                  sx={{
                    color: '#666',
                    mb: 4,
                    lineHeight: 1.6,
                    fontSize: '1.1rem'
                  }}
                >
                  {product.description}
                </Typography>

                {/* Ingredientes */}
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: '#333',
                      mb: 2
                    }}
                  >
                    {texts.ingredients}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {product.ingredients.map((ingredient, index) => (
                      <Chip
                        key={index}
                        label={ingredient}
                        variant="outlined"
                        sx={{
                          borderColor: '#c8626d',
                          color: '#c8626d'
                        }}
                      />
                    ))}
                  </Box>
                </Box>

                {/* Información nutricional */}
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: '#333',
                      mb: 2
                    }}
                  >
                    {texts.nutrition}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={3}>
                      <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#FFFFFF', borderRadius: '10px' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#c8626d' }}>
                          {product.nutrition.calories}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          {texts.calories}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={3}>
                      <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#FFFFFF', borderRadius: '10px' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#c8626d' }}>
                          {product.nutrition.fat}g
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          {texts.fat}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={3}>
                      <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#FFFFFF', borderRadius: '10px' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#c8626d' }}>
                          {product.nutrition.carbs}g
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          {texts.carbs}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={3}>
                      <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#FFFFFF', borderRadius: '10px' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#c8626d' }}>
                          {product.nutrition.protein}g
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          {texts.protein}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Botones de acción */}
                <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<ShoppingBag />}
                    sx={{
                      backgroundColor: '#c8626d',
                      color: 'white',
                      px: 4,
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderRadius: '25px',
                      textTransform: 'none',
                      flexGrow: 1,
                      '&:hover': {
                        backgroundColor: '#b25763',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(139, 69, 19, 0.3)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {texts.addToCart}
                  </Button>
                  
                  <IconButton
                    sx={{
                      backgroundColor: '#f5f5f5',
                      color: '#c8626d',
                      '&:hover': {
                        backgroundColor: '#c8626d20'
                      }
                    }}
                  >
                    <Favorite />
                  </IconButton>
                  
                  <IconButton
                    sx={{
                      backgroundColor: '#f5f5f5',
                      color: '#c8626d',
                      '&:hover': {
                        backgroundColor: '#c8626d20'
                      }
                    }}
                  >
                    <Share />
                  </IconButton>
                </Box>
              </Box>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ProductDetail;
