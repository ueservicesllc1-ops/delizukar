
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Container, Typography, Grid, Card, CardContent, CardActions, Button, IconButton, TextField, Divider, Checkbox, FormControlLabel } from '@mui/material';
import { Add, Remove, Delete, ShoppingCart, ArrowBack } from '@mui/icons-material';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import AfterpayMessaging from '../components/AfterpayMessaging';
import { useMinProducts } from '../hooks/useMinProducts';

const Cart = () => {
  const { cart, updateCartQuantity, removeFromCart, getCartTotal, getCartItemsCount } = useStore();
  const navigate = useNavigate();
  const { minProducts } = useMinProducts();

  const cartTotal = getCartTotal();
  const cartItemsCount = getCartItemsCount();

  // Estado para el checkbox de política de envío
  const [acceptShippingPolicy, setAcceptShippingPolicy] = useState(false);

  // Usar solo el carrito real del contexto
  const items = cart;

  // Funciones para manejar cambios de cantidad
  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    updateCartQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
  };

  // Calcular totales del carrito
  const calculateSubtotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal(); // Envío gratis
  };

  // Verificar si se puede proceder al checkout
  const canProceedToCheckout = () => {
    return calculateTotalItems() >= minProducts && acceptShippingPolicy;
  };

  return (
    <Box sx={{ py: 4, pt: 22, backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/')}
              sx={{
                color: '#8B4513',
                mr: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Continuar Comprando
            </Button>
          </Box>

        </motion.div>

        {items.length === 0 ? (
          /* Carrito vacío */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card
              sx={{
                textAlign: 'center',
                p: 8,
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}
            >
              <ShoppingCart sx={{ fontSize: '4rem', color: '#ccc', mb: 3 }} />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  color: '#333',
                  mb: 2
                }}
              >
                Tu carrito está vacío
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#666',
                  mb: 4
                }}
              >
                ¡Agrega algunas galletas deliciosas para comenzar!
              </Typography>
            </Card>
          </motion.div>
        ) : (
          <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Lista de productos */}
            <Box sx={{ flex: 2 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card
                      sx={{
                        mb: 3,
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                        }
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
                          {/* Imagen del producto */}
                          <Box sx={{ flex: '0 0 80px' }}>
                            <Box sx={{ position: 'relative' }}>
                              <Box
                                component="img"
                                src={item.image}
                                alt={item.name}
                                sx={{
                                  width: 80,
                                  height: 80,
                                  objectFit: 'cover',
                                  borderRadius: '15px'
                                }}
                              />
                              {item.isBestSeller && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: 8,
                                    left: 8,
                                    backgroundColor: '#FF6B35',
                                    color: 'white',
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: '8px',
                                    fontSize: '0.7rem',
                                    fontWeight: 600
                                  }}
                                >
                                  Más Vendido
                                </Box>
                              )}
                            </Box>
                          </Box>

                          {/* Información del producto */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 600,
                                color: '#333',
                                mb: 0.5
                              }}
                            >
                              {item.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#666',
                                mb: 1
                              }}
                            >
                              {item.category}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 700,
                                  color: '#8B4513'
                                }}
                              >
                                ${item.price}
                              </Typography>
                              {item.originalPrice && (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: '#999',
                                    textDecoration: 'line-through'
                                  }}
                                >
                                  ${item.originalPrice}
                                </Typography>
                              )}
                            </Box>
                          </Box>

                          {/* Controles de cantidad - Alineados al borde derecho */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
                            <IconButton
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              sx={{
                                backgroundColor: '#f5f5f5',
                                color: '#8B4513',
                                '&:hover': {
                                  backgroundColor: '#8B451320'
                                }
                              }}
                            >
                              <Remove />
                            </IconButton>
                            
                            <TextField
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                              size="small"
                              sx={{
                                width: '60px',
                                '& .MuiOutlinedInput-root': {
                                  textAlign: 'center',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                },
                                '& .MuiInputBase-input': {
                                  textAlign: 'center',
                                  padding: '8px 4px'
                                }
                              }}
                            />
                            
                            <IconButton
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              sx={{
                                backgroundColor: '#f5f5f5',
                                color: '#8B4513',
                                '&:hover': {
                                  backgroundColor: '#8B451320'
                                }
                              }}
                            >
                              <Add />
                            </IconButton>
                            
                            <IconButton
                              onClick={() => handleRemoveItem(item.id)}
                              sx={{
                                color: '#f44336',
                                ml: 1,
                                '&:hover': {
                                  backgroundColor: '#ffebee'
                                }
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </Box>

            {/* Resumen del pedido */}
            <Box sx={{ flex: 1, minWidth: '300px' }}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card
                  sx={{
                    borderRadius: '15px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    position: 'sticky',
                    top: 20
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: '#333',
                        mb: 2,
                        fontSize: '1.1rem'
                      }}
                    >
                      Resumen del Pedido
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                          Subtotal ({calculateTotalItems()} {calculateTotalItems() === 1 ? 'artículo' : 'artículos'})
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          ${calculateSubtotal().toFixed(2)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                          Envío
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#666', fontSize: '0.9rem' }}>
                          Por definir
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#333', fontSize: '1.1rem' }}>
                          Total
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#8B4513', fontSize: '1.1rem' }}>
                          ${calculateTotal().toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Afterpay Messaging */}
                    {calculateTotal() >= 1 && calculateTotal() <= 4000 && (
                      <AfterpayMessaging amount={calculateTotal()} />
                    )}

                    {/* Checkbox para aceptar política de envío */}
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={acceptShippingPolicy}
                          onChange={(e) => setAcceptShippingPolicy(e.target.checked)}
                          size="small"
                          sx={{
                            color: '#8B4513',
                            '&.Mui-checked': {
                              color: '#8B4513'
                            }
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                          Acepto la{' '}
                          <Button
                            variant="text"
                            sx={{
                              color: '#8B4513',
                              textTransform: 'none',
                              p: 0,
                              minWidth: 'auto',
                              textDecoration: 'underline',
                              fontSize: '0.8rem',
                              '&:hover': {
                                backgroundColor: 'transparent',
                                textDecoration: 'underline'
                              }
                            }}
                            onClick={() => navigate('/shipping')}
                          >
                            Política de Envío
                          </Button>
                        </Typography>
                      }
                      sx={{ mb: 1.5, alignItems: 'flex-start' }}
                    />

                    <Button
                      variant="contained"
                      fullWidth
                      size="medium"
                      onClick={() => navigate('/checkout')}
                      disabled={!canProceedToCheckout()}
                      sx={{
                        backgroundColor: canProceedToCheckout() ? '#c8626D' : '#ccc',
                        color: 'white',
                        py: 1.5,
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        borderRadius: '15px',
                        textTransform: 'none',
                        mb: 1.5,
                        '&:hover': canProceedToCheckout() ? {
                          backgroundColor: '#b5555a',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(139, 69, 19, 0.3)'
                        } : {},
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {canProceedToCheckout() ? 'Proceder al Pago' : 
                        calculateTotalItems() < minProducts ? 
                          `Mínimo ${minProducts} producto${minProducts > 1 ? 's' : ''} requerido${minProducts > 1 ? 's' : ''}` :
                          !acceptShippingPolicy ? 'Debe aceptar la Política de Envío' :
                          'No se puede proceder'
                      }
                    </Button>

                    <Button
                      variant="outlined"
                      fullWidth
                      size="small"
                      onClick={() => navigate('/productos')}
                      sx={{
                        borderColor: '#8B4513',
                        color: '#8B4513',
                        py: 1,
                        borderRadius: '15px',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        '&:hover': {
                          backgroundColor: '#8B451320',
                          borderColor: '#8B4513'
                        }
                      }}
                    >
                      Continuar Comprando
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Cart;
