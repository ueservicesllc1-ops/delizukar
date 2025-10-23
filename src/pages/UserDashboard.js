import React from 'react';
import { motion } from 'framer-motion';
import { Box, Container, Typography, Grid, Card, CardContent, CardActions, Button, Avatar, Chip, Divider } from '@mui/material';
import { Person, ShoppingBag, Favorite, Settings, Logout, LocalShipping, Star } from '@mui/icons-material';

const UserDashboard = () => {
  // Datos vacíos para el usuario
  const user = {
    name: "",
    email: "",
    avatar: "",
    memberSince: ""
  };

  const recentOrders = [];

  const favoriteProducts = [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Entregado':
        return '#4CAF50';
      case 'En camino':
        return '#FF9800';
      case 'Procesando':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  return (
    <Box sx={{ py: 4, pt: 30, backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <Container maxWidth="lg">

        <Grid container spacing={1}>
          {/* Información del usuario */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card
                sx={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  mb: 1
                }}
              >
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Avatar
                    src={user.avatar}
                    sx={{
                      width: 100,
                      height: 100,
                      mx: 'auto',
                      mb: 3,
                      border: '4px solid #c8626d'
                    }}
                  />
                  
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: '#333',
                      mb: 1
                    }}
                  >
                    {user.name || "Usuario"}
                  </Typography>
                  
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#666',
                      mb: 2
                    }}
                  >
                    {user.email || "No hay email registrado"}
                  </Typography>
                  
                  <Chip
                    label={user.memberSince ? `Miembro desde ${user.memberSince}` : "Miembro"}
                    sx={{
                      backgroundColor: '#c8626d20',
                      color: '#c8626d',
                      fontWeight: 600
                    }}
                  />
                </CardContent>
              </Card>

              {/* Menú de navegación */}
              <Card
                sx={{
                  borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  <Button
                    fullWidth
                    startIcon={<Person />}
                    sx={{
                      justifyContent: 'flex-start',
                      p: 2,
                      color: '#333',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#c8626d20'
                      }
                    }}
                  >
                    Mi Perfil
                  </Button>
                  
                  <Button
                    fullWidth
                    startIcon={<ShoppingBag />}
                    sx={{
                      justifyContent: 'flex-start',
                      p: 2,
                      color: '#333',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#c8626d20'
                      }
                    }}
                  >
                    Mis Pedidos
                  </Button>
                  
                  <Button
                    fullWidth
                    startIcon={<Favorite />}
                    sx={{
                      justifyContent: 'flex-start',
                      p: 2,
                      color: '#333',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#c8626d20'
                      }
                    }}
                  >
                    Favoritos
                  </Button>
                  
                  <Button
                    fullWidth
                    startIcon={<Settings />}
                    sx={{
                      justifyContent: 'flex-start',
                      p: 2,
                      color: '#333',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#c8626d20'
                      }
                    }}
                  >
                    Configuración
                  </Button>
                  
                  <Divider />
                  
                  <Button
                    fullWidth
                    startIcon={<Logout />}
                    sx={{
                      justifyContent: 'flex-start',
                      p: 2,
                      color: '#f44336',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#ffebee'
                      }
                    }}
                  >
                    Cerrar Sesión
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Contenido principal */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Pedidos recientes */}
              <Card
                sx={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  mb: 1
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <LocalShipping sx={{ color: '#c8626d', mr: 1 }} />
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: '#333'
                      }}
                    >
                      Pedidos Recientes
                    </Typography>
                  </Box>

                  {recentOrders.length > 0 ? recentOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Box
                        sx={{
                          p: 3,
                          mb: 2,
                          backgroundColor: '#f8f9fa',
                          borderRadius: '15px',
                          border: '1px solid #e9ecef'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                            Pedido #{order.id}
                          </Typography>
                          <Chip
                            label={order.status}
                            sx={{
                              backgroundColor: getStatusColor(order.status) + '20',
                              color: getStatusColor(order.status),
                              fontWeight: 600
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              {order.date} • {order.items} {order.items === 1 ? 'artículo' : 'artículos'}
                            </Typography>
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#c8626d' }}>
                            ${order.total}
                          </Typography>
                        </Box>
                    </Box>
                  </motion.div>
                  )) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" sx={{ color: '#666' }}>
                        No tienes pedidos recientes
                      </Typography>
                    </Box>
                  )}

                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{
                      borderColor: '#c8626d',
                      color: '#c8626d',
                      py: 1.5,
                      borderRadius: '25px',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#c8626d20',
                        borderColor: '#c8626d'
                      }
                    }}
                  >
                    Ver Todos los Pedidos
                  </Button>
                </CardContent>
              </Card>

              {/* Productos favoritos */}
              <Card
                sx={{
                  borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Favorite sx={{ color: '#c8626d', mr: 1 }} />
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: '#333'
                      }}
                    >
                      Tus Favoritos
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    {favoriteProducts.map((product, index) => (
                      <Grid item xs={12} sm={6} key={product.id}>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              p: 2,
                              backgroundColor: '#f8f9fa',
                              borderRadius: '15px',
                              border: '1px solid #e9ecef'
                            }}
                          >
                            <Box
                              component="img"
                              src={product.image}
                              alt={product.name}
                              sx={{
                                width: 60,
                                height: 60,
                                objectFit: 'cover',
                                borderRadius: '10px',
                                mr: 2
                              }}
                            />
                            
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: 600,
                                  color: '#333',
                                  mb: 0.5
                                }}
                              >
                                {product.name}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <Star sx={{ color: '#FFD700', fontSize: '1rem', mr: 0.5 }} />
                                <Typography variant="body2" sx={{ color: '#666' }}>
                                  {product.rating}
                                </Typography>
                              </Box>
                              
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 700,
                                  color: '#c8626d'
                                }}
                              >
                                ${product.price}
                              </Typography>
                            </Box>
                          </Box>
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>

                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{
                      borderColor: '#c8626d',
                      color: '#c8626d',
                      py: 1.5,
                      borderRadius: '25px',
                      textTransform: 'none',
                      fontWeight: 600,
                      mt: 3,
                      '&:hover': {
                        backgroundColor: '#c8626d20',
                        borderColor: '#c8626d'
                      }
                    }}
                  >
                    Ver Todos los Favoritos
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default UserDashboard;

