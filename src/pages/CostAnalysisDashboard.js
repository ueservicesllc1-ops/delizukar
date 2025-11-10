import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Info,
  Print,
  Download,
  Settings,
  Edit,
  Visibility,
  Calculate
} from '@mui/icons-material';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  ChartTooltip,
  Legend
);

const getCategoryLabel = (category) => {
  switch (category) {
    case 'materia_prima':
      return 'Materia prima';
    case 'empaque':
      return 'Empaque';
    case 'decoracion':
      return 'Decoración';
    case 'otros':
      return 'Otros';
    default:
      return category ? category.replace(/_/g, ' ') : 'Sin categoría';
  }
};

const CostAnalysisDashboard = () => {
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customProfitMargin, setCustomProfitMargin] = useState(30);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetailsOpen, setProductDetailsOpen] = useState(false);
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalIngredients: 0,
    averageProfitMargin: 0,
    totalProductionCost: 0,
    totalSuggestedRevenue: 0
  });

  const topIngredientCosts = useMemo(() => {
    if (!ingredients || ingredients.length === 0) return [];
    return [...ingredients]
      .map((ingredient) => ({
        name: ingredient.name,
        cost: parseFloat(ingredient.price) || 0
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 6);
  }, [ingredients]);

  const categoryDistribution = useMemo(() => {
    if (!ingredients || ingredients.length === 0) return [];
    const categoriesMap = ingredients.reduce((acc, ingredient) => {
      const category = ingredient.category || 'otros';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(categoriesMap).map(([category, count]) => ({
      category,
      count
    }));
  }, [ingredients]);

  const productProfitData = useMemo(() => {
    if (!products || products.length === 0) return [];
    return [...products]
      .map((product) => {
        const analysis = calculateProductCost(product, ingredients, true);
        return {
          name: product.name,
          profit: Math.max(analysis.profit || 0, 0)
        };
      })
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 6);
  }, [products, ingredients]);

  const ingredientCostsChartData = useMemo(() => ({
    labels: topIngredientCosts.map((item) => item.name),
    datasets: [
      {
        label: 'Costo por ingrediente ($)',
        data: topIngredientCosts.map((item) => item.cost),
        backgroundColor: ['#c8626d', '#ec8c8d', '#f7b0ab', '#8d9a7d', '#a0c4ff', '#ffc8dd'],
        borderRadius: 8
      }
    ]
  }), [topIngredientCosts]);

  const ingredientCategoryChartData = useMemo(() => ({
    labels: categoryDistribution.map((item) => getCategoryLabel(item.category)),
    datasets: [
      {
        data: categoryDistribution.map((item) => item.count),
        backgroundColor: ['#c8626d', '#8d9a7d', '#f7b0ab', '#a0c4ff', '#ffafcc', '#bde0fe'],
        borderWidth: 1
      }
    ]
  }), [categoryDistribution]);

  const productProfitChartData = useMemo(() => ({
    labels: productProfitData.map((item) => item.name),
    datasets: [
      {
        label: 'Ganancia estimada ($)',
        data: productProfitData.map((item) => parseFloat(item.profit.toFixed(2))),
        backgroundColor: '#8d9a7d',
        borderColor: '#6b7b5d',
        tension: 0.4,
        fill: false
      }
    ]
  }), [productProfitData]);

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `$${context.formattedValue}`
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => `$${value}`
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `$${context.formattedValue}`
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => `$${value}`
        }
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    try {
      const storedMargin = localStorage.getItem('costAnalysisProfitMargin');
      if (storedMargin !== null) {
        const parsed = parseFloat(storedMargin);
        if (!Number.isNaN(parsed)) {
          setCustomProfitMargin(parsed);
        }
      }
    } catch (error) {
      console.warn('No se pudo leer el margen personalizado guardado:', error);
    }
  }, []);

  // Recalcular cuando cambie el margen personalizado
  useEffect(() => {
    if (products.length > 0) {
      console.log('🔄 Recalculando con margen personalizado:', customProfitMargin + '%');
      calculateSummary(products, ingredients);
    }
  }, [customProfitMargin, products, ingredients]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar productos
      const productsRef = collection(db, 'products');
      const productsQuery = query(productsRef, orderBy('createdAt', 'desc'));
      const productsSnapshot = await getDocs(productsQuery);
      
      const productsList = [];
      productsSnapshot.forEach((doc) => {
        productsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Cargar ingredientes
      const ingredientsRef = collection(db, 'ingredients');
      const ingredientsQuery = query(ingredientsRef, orderBy('createdAt', 'desc'));
      const ingredientsSnapshot = await getDocs(ingredientsQuery);
      
      const ingredientsList = [];
      ingredientsSnapshot.forEach((doc) => {
        ingredientsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setProducts(productsList);
      setIngredients(ingredientsList);
      
      // Calcular resumen
      calculateSummary(productsList, ingredientsList);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  function calculateProductCost(product, ingredients, useCustomMargin = false) {
    let totalCost = 0;
    let ingredientDetails = [];
    
    console.log('🔍 Calculando costos para:', product.name);
    console.log('📦 Ingredientes del producto:', product.ingredients);
    
    if (product.ingredients && Array.isArray(product.ingredients)) {
      product.ingredients.forEach(ingredient => {
        const ingredientData = ingredients.find(ing => ing.id === ingredient.ingredientId);
        if (ingredientData) {
          // Usar el costo ya calculado que viene de la receta
          const cost = ingredient.totalCost || 0;
          totalCost += cost;
          
          console.log(`💰 ${ingredientData.name}: cantidad=${ingredient.quantity} ${ingredient.unit}, costo=${cost}`);
          
          ingredientDetails.push({
            name: ingredientData.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            price: ingredient.ingredientPrice || ingredientData.price,
            cost: cost
          });
        }
      });
    }
    
    console.log('💵 Costo total calculado:', totalCost);

    const laborCost = (product.laborHours || 0) * (product.laborCost || 0);
    const totalProductionCost = totalCost + laborCost;
    
    // Usar margen personalizado si se especifica, sino usar el del producto
    const profitMargin = useCustomMargin ? customProfitMargin : (product.profitMargin || 30);
    const suggestedPrice = totalProductionCost * (1 + profitMargin / 100);
    const profit = suggestedPrice - totalProductionCost;
    const profitPercentage = totalProductionCost > 0 ? (profit / totalProductionCost) * 100 : 0;

    console.log('🏭 Costo de mano de obra:', laborCost);
    console.log('💼 Costo total de producción:', totalProductionCost);
    console.log('📈 Margen aplicado:', profitMargin + '%');
    console.log('🔧 Usando margen personalizado:', useCustomMargin);
    console.log('⚙️ Margen personalizado actual:', customProfitMargin + '%');
    console.log('💰 Precio sugerido:', suggestedPrice);
    console.log('💵 Ganancia:', profit);

    return {
      totalCost,
      laborCost,
      totalProductionCost,
      suggestedPrice,
      profit,
      profitPercentage,
      ingredientDetails,
      profitMargin
    };
  }

  const calculateSummary = (productsList, ingredientsList) => {
    let totalProductionCost = 0;
    let totalSuggestedRevenue = 0;
    let totalProfitMargin = 0;
    let validProducts = 0;

    console.log('📊 Calculando resumen con margen personalizado:', customProfitMargin + '%');

    productsList.forEach(product => {
      const analysis = calculateProductCost(product, ingredientsList, true);
      totalProductionCost += analysis.totalProductionCost;
      totalSuggestedRevenue += analysis.suggestedPrice;
      totalProfitMargin += analysis.profitPercentage;
      validProducts++;
    });

    console.log('💰 Resumen calculado:');
    console.log('- Costo total:', totalProductionCost);
    console.log('- Ingresos sugeridos:', totalSuggestedRevenue);
    console.log('- Margen promedio:', validProducts > 0 ? totalProfitMargin / validProducts : 0);

    setSummary({
      totalProducts: productsList.length,
      totalIngredients: ingredientsList.length,
      averageProfitMargin: validProducts > 0 ? totalProfitMargin / validProducts : 0,
      totalProductionCost,
      totalSuggestedRevenue
    });
  };

  const getProfitColor = (profitPercentage) => {
    if (profitPercentage >= 50) return 'success';
    if (profitPercentage >= 30) return 'warning';
    return 'error';
  };

  const getProfitIcon = (profitPercentage) => {
    if (profitPercentage >= 30) return <TrendingUp />;
    return <TrendingDown />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography variant="h6" sx={{ fontFamily: '"Asap", sans-serif' }}>
          Cargando datos...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 700, 
          color: '#c8626d', 
          fontFamily: '"Asap", sans-serif',
          mb: 1
        }}>
          Dashboard de Costos
        </Typography>
        <Typography variant="body1" sx={{ color: '#666', fontFamily: '"Asap", sans-serif' }}>
          Resumen general de productos, costos y rentabilidad
        </Typography>
      </Box>

      {/* Tarjetas de resumen */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                color: '#c8626d',
                fontFamily: '"Asap", sans-serif'
              }}>
                {summary.totalProducts}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', fontFamily: '"Asap", sans-serif' }}>
                Productos Creados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                color: '#4CAF50',
                fontFamily: '"Asap", sans-serif'
              }}>
                {summary.totalIngredients}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', fontFamily: '"Asap", sans-serif' }}>
                Ingredientes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                color: '#FF9800',
                fontFamily: '"Asap", sans-serif'
              }}>
                {summary.averageProfitMargin.toFixed(1)}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', fontFamily: '"Asap", sans-serif' }}>
                Margen Promedio
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                color: '#7C2815',
                fontFamily: '"Asap", sans-serif'
              }}>
                ${summary.totalProductionCost.toFixed(2)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', fontFamily: '"Asap", sans-serif' }}>
                Costo Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                color: '#4CAF50',
                fontFamily: '"Asap", sans-serif'
              }}>
                ${summary.totalSuggestedRevenue.toFixed(2)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', fontFamily: '"Asap", sans-serif' }}>
                Ingresos Sugeridos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabla de productos */}
      <Card>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              fontFamily: '"Asap", sans-serif',
              color: '#c8626d'
            }}>
              Reporte de Productos
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Configurar margen de ganancia">
                <Button
                  variant="outlined"
                  startIcon={<Settings />}
                  onClick={() => {
                    console.log('⚙️ Abriendo configuración. Margen actual:', customProfitMargin + '%');
                    setSettingsOpen(true);
                  }}
                  sx={{
                    borderColor: '#c8626d',
                    color: '#c8626d',
                    fontFamily: '"Asap", sans-serif',
                    '&:hover': {
                      backgroundColor: '#c8626d',
                      color: 'white'
                    }
                  }}
                >
                  Margen: {customProfitMargin}%
                </Button>
              </Tooltip>
              <Tooltip title="Imprimir reporte">
                <IconButton>
                  <Print />
                </IconButton>
              </Tooltip>
              <Tooltip title="Descargar reporte">
                <IconButton>
                  <Download />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableCell sx={{ fontWeight: 600, fontFamily: '"Asap", sans-serif' }}>
                    Producto
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: '"Asap", sans-serif' }}>
                    Costo de Producción
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: '"Asap", sans-serif' }}>
                    Precio Sugerido
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: '"Asap", sans-serif' }}>
                    Ganancia
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: '"Asap", sans-serif' }}>
                    Margen
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: '"Asap", sans-serif' }}>
                    Estado
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: '"Asap", sans-serif' }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => {
                  const analysis = calculateProductCost(product, ingredients, true);
                  return (
                    <TableRow key={product.id} hover>
                      <TableCell>
                        <Typography variant="body1" sx={{ 
                          fontWeight: 600,
                          fontFamily: '"Asap", sans-serif'
                        }}>
                          {product.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          {product.ingredients ? product.ingredients.length : 0} ingredientes
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" sx={{ fontFamily: '"Asap", sans-serif' }}>
                          ${analysis.totalProductionCost.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" sx={{ 
                          fontWeight: 600,
                          fontFamily: '"Asap", sans-serif',
                          color: '#c8626d'
                        }}>
                          ${analysis.suggestedPrice.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" sx={{ 
                          fontWeight: 600,
                          fontFamily: '"Asap", sans-serif',
                          color: '#4CAF50'
                        }}>
                          ${analysis.profit.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getProfitIcon(analysis.profitPercentage)}
                          label={`${analysis.profitPercentage.toFixed(1)}%`}
                          color={getProfitColor(analysis.profitPercentage)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={analysis.profitPercentage >= 30 ? 'Rentable' : 'Revisar'}
                          color={analysis.profitPercentage >= 30 ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Ver detalles del producto">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedProduct(product);
                                setProductDetailsOpen(true);
                              }}
                              sx={{ color: '#c8626d' }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Calcular con margen personalizado">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedProduct(product);
                                setProductDetailsOpen(true);
                              }}
                              sx={{ color: '#4CAF50' }}
                            >
                              <Calculate />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {products.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" sx={{ color: '#666', fontFamily: '"Asap", sans-serif' }}>
                No hay productos creados aún
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Visualizaciones */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#c8626d', mb: 2 }}>
          Visualizaciones de Costos
        </Typography>
        <Grid container spacing={3}>
          {topIngredientCosts.length > 0 && (
            <Grid item xs={12} md={6} lg={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontFamily: '"Asap", sans-serif', color: '#333', mb: 2 }}>
                    Ingredientes más costosos
                  </Typography>
                  <Bar data={ingredientCostsChartData} options={barOptions} />
                </CardContent>
              </Card>
            </Grid>
          )}

          {categoryDistribution.length > 0 && (
            <Grid item xs={12} md={6} lg={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontFamily: '"Asap", sans-serif', color: '#333', mb: 2 }}>
                    Distribución por categoría
                  </Typography>
                  <Doughnut data={ingredientCategoryChartData} options={doughnutOptions} />
                </CardContent>
              </Card>
            </Grid>
          )}

          {productProfitData.length > 0 && (
            <Grid item xs={12} md={12} lg={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontFamily: '"Asap", sans-serif', color: '#333', mb: 2 }}>
                    Productos con mayor ganancia
                  </Typography>
                  <Line data={productProfitChartData} options={lineOptions} />
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Modal de configuración de margen */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          backgroundColor: '#c8626d', 
          color: 'white',
          fontFamily: '"Asap", sans-serif',
          fontWeight: 600
        }}>
          Configurar Margen de Ganancia
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ 
            fontFamily: '"Asap", sans-serif',
            mb: 2
          }}>
            Establece el margen de ganancia personalizado para todos los productos:
          </Typography>
          
          <TextField
            fullWidth
            label="Margen de Ganancia (%)"
            type="number"
            value={customProfitMargin}
            onChange={(e) => setCustomProfitMargin(parseFloat(e.target.value) || 0)}
            sx={{ fontFamily: '"Asap", sans-serif' }}
            helperText="Porcentaje de ganancia que deseas obtener sobre el costo de producción"
          />
          
          <Alert severity="info" sx={{ mt: 2, fontFamily: '"Asap", sans-serif' }}>
            <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif' }}>
              <strong>Ejemplo:</strong> Si el costo de producción es $10 y el margen es 30%, 
              el precio sugerido será $13 (30% de ganancia sobre $10).
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setSettingsOpen(false)}
            sx={{ fontFamily: '"Asap", sans-serif' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              console.log('💾 Guardando margen personalizado:', customProfitMargin + '%');
              const sanitizedMargin = !Number.isNaN(customProfitMargin) ? customProfitMargin : 30;
              try {
                localStorage.setItem('costAnalysisProfitMargin', sanitizedMargin.toString());
              } catch (error) {
                console.warn('No se pudo guardar el margen personalizado:', error);
              }
              setCustomProfitMargin(sanitizedMargin);
              setSettingsOpen(false);
            }}
            variant="contained"
            sx={{
              backgroundColor: '#c8626d',
              '&:hover': { backgroundColor: '#b8555a' },
              fontFamily: '"Asap", sans-serif'
            }}
          >
            Guardar Configuración
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de detalles del producto */}
      <Dialog open={productDetailsOpen} onClose={() => setProductDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          backgroundColor: '#c8626d', 
          color: 'white',
          fontFamily: '"Asap", sans-serif',
          fontWeight: 600
        }}>
          Análisis Detallado: {selectedProduct?.name}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedProduct && (
            <Box>
              {/* Resumen de costos */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                    <Typography variant="h6" sx={{ 
                      fontFamily: '"Asap", sans-serif',
                      fontWeight: 600,
                      color: '#c8626d',
                      mb: 1
                    }}>
                      Costo de Ingredientes
                    </Typography>
                    <Typography variant="h4" sx={{ 
                      fontFamily: '"Asap", sans-serif',
                      fontWeight: 700,
                      color: '#f44336'
                    }}>
                      ${calculateProductCost(selectedProduct, ingredients).totalCost.toFixed(2)}
                    </Typography>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                    <Typography variant="h6" sx={{ 
                      fontFamily: '"Asap", sans-serif',
                      fontWeight: 600,
                      color: '#c8626d',
                      mb: 1
                    }}>
                      Costo Total
                    </Typography>
                    <Typography variant="h4" sx={{ 
                      fontFamily: '"Asap", sans-serif',
                      fontWeight: 700,
                      color: '#f44336'
                    }}>
                      ${calculateProductCost(selectedProduct, ingredients).totalProductionCost.toFixed(2)}
                    </Typography>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card sx={{ p: 2, backgroundColor: '#e8f5e8' }}>
                    <Typography variant="h6" sx={{ 
                      fontFamily: '"Asap", sans-serif',
                      fontWeight: 600,
                      color: '#2e7d32',
                      mb: 1
                    }}>
                      Precio Sugerido
                    </Typography>
                    <Typography variant="h4" sx={{ 
                      fontFamily: '"Asap", sans-serif',
                      fontWeight: 700,
                      color: '#2e7d32'
                    }}>
                      ${calculateProductCost(selectedProduct, ingredients, true).suggestedPrice.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      fontFamily: '"Asap", sans-serif',
                      color: '#666'
                    }}>
                      Con {customProfitMargin}% de margen
                    </Typography>
                  </Card>
                </Grid>
              </Grid>

              {/* Detalles de ingredientes */}
              <Typography variant="h6" sx={{ 
                fontFamily: '"Asap", sans-serif',
                fontWeight: 600,
                color: '#c8626d',
                mb: 2
              }}>
                Desglose de Ingredientes
              </Typography>
              
              <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 600, fontFamily: '"Asap", sans-serif' }}>
                        Ingrediente
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontFamily: '"Asap", sans-serif' }}>
                        Cantidad
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontFamily: '"Asap", sans-serif' }}>
                        Precio/Unidad
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontFamily: '"Asap", sans-serif' }}>
                        Costo
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {calculateProductCost(selectedProduct, ingredients).ingredientDetails.map((ingredient, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ fontFamily: '"Asap", sans-serif' }}>
                          {ingredient.name}
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"Asap", sans-serif' }}>
                          {ingredient.quantity} {ingredient.unit}
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"Asap", sans-serif' }}>
                          ${ingredient.price.toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ 
                          fontFamily: '"Asap", sans-serif',
                          fontWeight: 600,
                          color: '#c8626d'
                        }}>
                          ${ingredient.cost.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setProductDetailsOpen(false)}
            sx={{ fontFamily: '"Asap", sans-serif' }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CostAnalysisDashboard;
