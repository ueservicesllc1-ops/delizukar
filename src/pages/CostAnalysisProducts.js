import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Tabs,
  Tab,
  Snackbar
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  AttachMoney,
  Receipt,
  PhotoCamera,
  Calculate,
  Save,
  Clear,
  ArrowBack
} from '@mui/icons-material';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import IngredientsService from '../services/ingredientsService';

const CostAnalysisProducts = ({ selectedProduct, onProductSelect }) => {
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    ingredients: [],
    laborHours: 0,
    laborCost: 0,
    profitMargin: 30,
    image: '',
    category: 'galletas',
    yield: 1
  });
  const [laborCosts, setLaborCosts] = useState({
    laborHours: 0,
    laborCostPerHour: 0,
    additionalCosts: 0,
    utilities: 0,
    equipment: 0,
    packaging: 0
  });
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [ingredientQuantity, setIngredientQuantity] = useState(0);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [recipeActiveTab, setRecipeActiveTab] = useState(0);
  const [newIngredient, setNewIngredient] = useState({
    ingredientId: '',
    quantity: 0,
    unit: 'g'
  });
  const [calculatedCost, setCalculatedCost] = useState(0);
  const [selectedIngredientData, setSelectedIngredientData] = useState(null);
  const [editingIngredientItem, setEditingIngredientItem] = useState(null);
  const [editIngredientDialogOpen, setEditIngredientDialogOpen] = useState(false);
  const [editIngredientQuantity, setEditIngredientQuantity] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      console.log('🔄 Producto seleccionado:', selectedProduct.name);
    }
  }, [selectedProduct]);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  const showNotification = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };
     
  useEffect(() => {
    if (selectedProduct) {
      console.log('🔄 Producto seleccionado:', selectedProduct.name);
      console.log('Ingredientes del producto:', selectedProduct.ingredients);
      console.log('Datos completos del producto:', selectedProduct);
      
      // Buscar el producto completo en la lista de productos cargados
      const fullProduct = products.find(p => p.id === selectedProduct.id);
      if (fullProduct) {
        console.log('✅ Producto completo encontrado:', fullProduct);
        console.log('Ingredientes del producto completo:', fullProduct.ingredients);
        
        // Inicializar el estado de edición y sincronizar el rendimiento
        setEditingProduct({ ...fullProduct });
        setNewProduct(prev => ({ ...prev, yield: fullProduct.yield || 1 }));
        
        // Verificar si el producto tiene receta
        if (fullProduct.ingredients && fullProduct.ingredients.length > 0) {
          console.log('✅ Producto tiene receta existente, mostrando ingredientes');
          console.log('Ingredientes encontrados:', fullProduct.ingredients);
          console.log('Rendimiento encontrado:', fullProduct.yield);
          setShowRecipeForm(false);
          // Cargar los ingredientes existentes en el estado para edición
          setRecipeIngredients(fullProduct.ingredients);
        } else {
          console.log('⚠️ Producto sin receta, mostrando formulario de creación');
          setShowRecipeForm(true);
          setRecipeIngredients([]);
        }
      } else {
        console.log('⚠️ Producto no encontrado en la lista, mostrando formulario de creación');
        setShowRecipeForm(true);
        setRecipeIngredients([]);
        setEditingProduct({ ...selectedProduct });
        setNewProduct(prev => ({ ...prev, yield: selectedProduct.yield || 1 }));
      }
    }
  }, [selectedProduct, products]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando datos de productos e ingredientes desde Firestore...');
      
      // Cargar productos
      const productsRef = collection(db, 'products');
      const productsQuery = query(productsRef, orderBy('createdAt', 'desc'));
      const productsSnapshot = await getDocs(productsQuery);
      
      const productsList = [];
      productsSnapshot.forEach((doc) => {
        const productData = {
          id: doc.id,
          ...doc.data()
        };
        productsList.push(productData);
        console.log('Producto cargado:', {
          id: doc.id,
          name: productData.name,
          hasIngredients: !!productData.ingredients,
          ingredientsCount: productData.ingredients?.length || 0,
          totalCost: productData.totalIngredientCost
        });
      });
      
      // Cargar ingredientes usando el servicio
      const ingredientsList = await IngredientsService.getAllIngredients();
      
      console.log(`✅ Cargados ${productsList.length} productos y ${ingredientsList.length} ingredientes desde Firestore`);
      console.log('Productos con recetas:', productsList.filter(p => p.ingredients && p.ingredients.length > 0));
      
      setProducts(productsList);
      setIngredients(ingredientsList);
      
    } catch (error) {
      console.error('❌ Error cargando datos desde Firestore:', error);
      console.error('Detalles del error:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      alert(`Error al cargar datos desde Firestore: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addIngredientToProduct = () => {
    if (!selectedIngredient || ingredientQuantity <= 0) {
      alert('Por favor selecciona un ingrediente y especifica la cantidad');
      return;
    }

    const ingredient = ingredients.find(ing => ing.id === selectedIngredient);
    if (!ingredient) return;

    const existingIngredient = newProduct.ingredients.find(ing => ing.ingredientId === selectedIngredient);
    
    if (existingIngredient) {
      // Actualizar cantidad existente
      setNewProduct({
        ...newProduct,
        ingredients: newProduct.ingredients.map(ing => 
          ing.ingredientId === selectedIngredient 
            ? { ...ing, quantity: ing.quantity + ingredientQuantity }
            : ing
        )
      });
    } else {
      // Agregar nuevo ingrediente
      setNewProduct({
        ...newProduct,
        ingredients: [...newProduct.ingredients, {
          ingredientId: selectedIngredient,
          ingredientName: ingredient.name,
          quantity: ingredientQuantity,
          unit: ingredient.unit
        }]
      });
    }

    setSelectedIngredient('');
    setIngredientQuantity(0);
  };

  const removeIngredientFromProduct = (ingredientId) => {
    setNewProduct({
      ...newProduct,
      ingredients: newProduct.ingredients.filter(ing => ing.ingredientId !== ingredientId)
    });
  };

  const calculateProductCost = (product) => {
    let totalCost = 0;
    let ingredientDetails = [];

    if (product.ingredients && Array.isArray(product.ingredients)) {
      product.ingredients.forEach(ingredient => {
        const ingredientData = ingredients.find(ing => ing.id === ingredient.ingredientId);
        if (ingredientData) {
          const cost = (ingredientData.price * ingredient.quantity) / (ingredientData.unit === 'kg' ? 1 : 1000);
          totalCost += cost;
          ingredientDetails.push({
            name: ingredientData.name,
            quantity: ingredient.quantity,
            unit: ingredientData.unit,
            price: ingredientData.price,
            cost: cost
          });
        }
      });
    }

    const laborCost = (product.laborHours || 0) * (product.laborCost || 0);
    const totalProductionCost = totalCost + laborCost;
    const suggestedPrice = totalProductionCost * (1 + (product.profitMargin || 0) / 100);
    const profit = suggestedPrice - totalProductionCost;
    const profitPercentage = totalProductionCost > 0 ? (profit / totalProductionCost) * 100 : 0;

    return {
      totalCost,
      laborCost,
      totalProductionCost,
      suggestedPrice,
      profit,
      profitPercentage,
      ingredientDetails
    };
  };

  const handleSaveProduct = async () => {
    if (!newProduct.name.trim()) {
      alert('Por favor completa el nombre del producto');
      return;
    }

    try {
      // Calcular costos totales
      const laborCost = laborCosts.laborHours * laborCosts.laborCostPerHour;
      const additionalCosts = laborCosts.utilities + laborCosts.equipment + laborCosts.packaging + laborCosts.additionalCosts;
      const totalLaborCost = laborCost + additionalCosts;

      const productsRef = collection(db, 'products');
      await addDoc(productsRef, {
        ...newProduct,
        laborHours: laborCosts.laborHours,
        laborCost: laborCosts.laborCostPerHour,
        totalLaborCost: totalLaborCost,
        utilities: laborCosts.utilities,
        equipment: laborCosts.equipment,
        packaging: laborCosts.packaging,
        additionalCosts: laborCosts.additionalCosts,
        yield: newProduct.yield || 1,
        createdAt: new Date().toISOString(),
        addedBy: 'admin'
      });

      console.log('✅ Producto agregado exitosamente con costos de mano de obra');
      
      // Limpiar formularios
      setNewProduct({
        name: '',
        description: '',
        ingredients: [],
        laborHours: 0,
        laborCost: 0,
        profitMargin: 30,
        image: '',
        category: 'galletas',
        yield: 1
      });
      setLaborCosts({
        laborHours: 0,
        laborCostPerHour: 0,
        additionalCosts: 0,
        utilities: 0,
        equipment: 0,
        packaging: 0
      });
      
      setLaborDialogOpen(false);
      loadData();
      
      alert('✅ Producto guardado exitosamente con todos los costos');
    } catch (error) {
      console.error('❌ Error agregando producto:', error);
      alert('Error al agregar producto');
    }
  };


  const getProfitColor = (profitPercentage) => {
    if (profitPercentage >= 50) return 'success';
    if (profitPercentage >= 30) return 'warning';
    return 'error';
  };

  // Función para calcular el costo de un ingrediente usando precio por gramo/ml
  const calculateIngredientCost = (ingredient, quantity, unit) => {
    if (!ingredient || !quantity || quantity <= 0) return 0;
    
    // Obtener precio por unidad base (gramo o mililitro)
    let pricePerUnit = ingredient.pricePerUnit || 0;
    
    // Si no existe pricePerUnit, calcularlo
    if (!pricePerUnit || pricePerUnit === 0) {
      const totalPrice = ingredient.totalPrice || ingredient.price || 0;
      const totalQuantity = ingredient.totalQuantity || 0;
      const baseUnit = ingredient.baseUnit || ingredient.unit || 'g';
      
      if (totalPrice > 0 && totalQuantity > 0) {
        let quantityInSmallestUnit = totalQuantity;
        
        // Convertir a unidad más pequeña (g o ml)
        if (baseUnit === 'kg') {
          quantityInSmallestUnit = totalQuantity * 1000; // kg a gramos
        } else if (baseUnit === 'l') {
          quantityInSmallestUnit = totalQuantity * 1000; // litros a mililitros
        }
        
        pricePerUnit = totalPrice / quantityInSmallestUnit;
      }
    }
    
    // Convertir la cantidad de la receta a gramos o mililitros
    let quantityInSmallestUnit = quantity;
    
    // Conversiones de unidades a gramos o mililitros
    const conversionsToSmallest = {
      'g': 1,
      'kg': 1000,      // 1 kg = 1000 g
      'lb': 453.592,   // 1 lb = 453.592 g
      'oz': 28.3495,   // 1 oz = 28.3495 g
      'ml': 1,
      'l': 1000,       // 1 l = 1000 ml
      'unit': 1        // unidades no se convierten
    };
    
    // Determinar si el ingrediente es por peso (g/kg) o volumen (ml/l)
    const baseUnit = ingredient.baseUnit || ingredient.unit || 'g';
    const isWeight = baseUnit === 'g' || baseUnit === 'kg';
    const isVolume = baseUnit === 'ml' || baseUnit === 'l';
    
    // Convertir la cantidad de la receta según la unidad
    if (isWeight) {
      // Es un ingrediente por peso
      if (unit === 'kg') {
        quantityInSmallestUnit = quantity * 1000; // kg a gramos
      } else if (unit === 'g') {
        quantityInSmallestUnit = quantity; // ya está en gramos
      } else if (unit === 'lb') {
        quantityInSmallestUnit = quantity * 453.592; // lb a gramos
      } else if (unit === 'oz') {
        quantityInSmallestUnit = quantity * 28.3495; // oz a gramos
      }
    } else if (isVolume) {
      // Es un ingrediente por volumen
      if (unit === 'l') {
        quantityInSmallestUnit = quantity * 1000; // litros a mililitros
      } else if (unit === 'ml') {
        quantityInSmallestUnit = quantity; // ya está en mililitros
      }
    }
    
    // Calcular el costo: precio por gramo/ml * cantidad en gramos/ml
    const cost = pricePerUnit * quantityInSmallestUnit;
    return Math.round(cost * 100) / 100; // Redondear a 2 decimales
  };

  // Función para actualizar el costo calculado cuando cambian los valores
  const updateCalculatedCost = () => {
    if (newIngredient.ingredientId && newIngredient.quantity > 0 && selectedIngredientData) {
      const cost = calculateIngredientCost(selectedIngredientData, newIngredient.quantity, newIngredient.unit);
      setCalculatedCost(cost);
    } else {
      setCalculatedCost(0);
    }
  };

  // Effect para recalcular cuando cambian los valores
  useEffect(() => {
    updateCalculatedCost();
  }, [newIngredient.ingredientId, newIngredient.quantity, newIngredient.unit, selectedIngredientData]);

  const addIngredientToRecipe = () => {
    if (!newIngredient.ingredientId || newIngredient.quantity <= 0) {
      alert('Por favor selecciona un ingrediente y especifica la cantidad');
      return;
    }

    const ingredient = ingredients.find(ing => ing.id === newIngredient.ingredientId);
    if (!ingredient) return;

    // Calcular el costo del ingrediente
    const ingredientCost = calculateIngredientCost(ingredient, newIngredient.quantity, newIngredient.unit);

    const existingIngredient = recipeIngredients.find(ing => ing.ingredientId === newIngredient.ingredientId);
    
    if (existingIngredient) {
      // Actualizar cantidad existente
      const newQuantity = existingIngredient.quantity + newIngredient.quantity;
      const newCost = calculateIngredientCost(ingredient, newQuantity, newIngredient.unit);
      const pricePerUnit = ingredient.pricePerUnit || 0;
      const baseUnit = ingredient.baseUnit || ingredient.unit || 'g';
      
      setRecipeIngredients(recipeIngredients.map(ing => 
        ing.ingredientId === newIngredient.ingredientId 
          ? { 
              ...ing, 
              quantity: newQuantity,
              unitCost: pricePerUnit, // Precio por gramo/ml
              totalCost: newCost,
              ingredientPrice: pricePerUnit,
              ingredientUnit: baseUnit,
              baseUnit: baseUnit
            }
          : ing
      ));
    } else {
      // Agregar nuevo ingrediente
      const pricePerUnit = ingredient.pricePerUnit || 0;
      const baseUnit = ingredient.baseUnit || ingredient.unit || 'g';
      
      setRecipeIngredients([...recipeIngredients, {
        ingredientId: newIngredient.ingredientId,
        ingredientName: ingredient.name,
        quantity: newIngredient.quantity,
        unit: newIngredient.unit,
        unitCost: pricePerUnit, // Precio por gramo/ml
        totalCost: ingredientCost,
        ingredientUnit: baseUnit, // Unidad base (g o ml)
        ingredientPrice: pricePerUnit, // Precio por unidad base
        baseUnit: baseUnit
      }]);
    }

    setNewIngredient({
      ingredientId: '',
      quantity: 0,
      unit: 'g'
    });
    setSelectedIngredientData(null);
    setCalculatedCost(0);
  };

  const removeIngredientFromRecipe = (ingredientId) => {
    setRecipeIngredients(recipeIngredients.filter(ing => ing.ingredientId !== ingredientId));
  };

  const handleOpenEditIngredient = (ingredient) => {
    setEditingIngredientItem(ingredient);
    setEditIngredientQuantity(ingredient.quantity);
    setEditIngredientDialogOpen(true);
  };

  const handleUpdateIngredientQuantity = () => {
    if (editingIngredientItem && editIngredientQuantity > 0) {
      const ingredientData = ingredients.find(ing => ing.id === editingIngredientItem.ingredientId);
      if (ingredientData) {
        const newCost = calculateIngredientCost(ingredientData, editIngredientQuantity, editingIngredientItem.unit);
        setRecipeIngredients(recipeIngredients.map(ing => 
          ing.ingredientId === editingIngredientItem.ingredientId 
            ? { ...ing, quantity: editIngredientQuantity, totalCost: newCost }
            : ing
        ));
      }
      setEditIngredientDialogOpen(false);
      setEditingIngredientItem(null);
    }
  };

  const saveRecipe = async () => {
    if (recipeIngredients.length === 0) {
      alert('Por favor agrega al menos un ingrediente a la receta');
      return;
    }

    if (!selectedProduct || !selectedProduct.id) {
      alert('Error: No hay producto seleccionado');
      return;
    }

    try {
      console.log('🔄 Guardando receta en Firestore...');
      console.log('Producto ID:', selectedProduct.id);
      console.log('Ingredientes a guardar:', recipeIngredients);
      
      // Calcular costos totales
      const totalIngredientCost = recipeIngredients.reduce((total, ing) => total + (ing.totalCost || 0), 0);
      
      const productRef = doc(db, 'products', selectedProduct.id);
      const updateData = {
        ingredients: recipeIngredients,
        totalIngredientCost: totalIngredientCost,
        ingredientCount: recipeIngredients.length,
        yield: newProduct.yield || selectedProduct.yield || 1,
        updatedAt: new Date().toISOString(),
        recipeCreatedAt: new Date().toISOString()
      };
      
      console.log('Datos a actualizar en Firestore:', updateData);
      
      await updateDoc(productRef, updateData);

      console.log('✅ Receta guardada exitosamente en Firestore');
      console.log('Datos guardados:', {
        productId: selectedProduct.id,
        totalCost: totalIngredientCost,
        ingredientCount: recipeIngredients.length,
        ingredients: recipeIngredients
      });
      
      // Limpiar el formulario
      setRecipeIngredients([]);
      setShowRecipeForm(false);
      
      // Recargar datos para mostrar la receta guardada
      console.log('🔄 Recargando datos...');
      await loadData();
      
      // Mostrar mensaje de éxito con resumen
      showNotification(`✅ Receta guardada exitosamente!\nCosto: $${totalIngredientCost.toFixed(2)}`);
      
    } catch (error) {
      console.error('❌ Error guardando receta en Firestore:', error);
      console.error('Detalles del error:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        productId: selectedProduct?.id,
        ingredients: recipeIngredients
      });
      alert(`Error al guardar la receta en Firestore: ${error.message}`);
    }
  };

  const saveProductYield = async (yieldVal) => {
    if (!selectedProduct || !selectedProduct.id) {
      console.error('❌ No hay producto seleccionado para guardar rendimiento');
      return;
    }
    
    console.log(`💾 Intentando guardar rendimiento: ${yieldVal} para el producto ${selectedProduct.name} (${selectedProduct.id})`);
    
    try {
      const productRef = doc(db, 'products', selectedProduct.id);
      await updateDoc(productRef, {
        yield: yieldVal,
        updatedAt: new Date().toISOString()
      });
      
      // Actualizar estado local
      const updatedProduct = { ...selectedProduct, yield: yieldVal };
      onProductSelect(updatedProduct);
      setProducts(products.map(p => p.id === selectedProduct.id ? updatedProduct : p));
      
      console.log('✅ Rendimiento guardado:', yieldVal);
      showNotification('Rendimiento guardado con éxito!', 'success');
    } catch (error) {
      console.error('❌ Error al guardar rendimiento:', error);
      showNotification('Error al guardar rendimiento', 'error');
    }
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
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}>
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            color: '#c8626d', 
            fontFamily: '"Asap", sans-serif',
            mb: 1
          }}>
            {selectedProduct ? `Receta: ${selectedProduct.name}` : 'Preparación de Productos'}
          </Typography>
          <Typography variant="body1" sx={{ color: '#666', fontFamily: '"Asap", sans-serif' }}>
            {selectedProduct ? 'Agrega ingredientes y cantidades para crear la receta' : 'Crea recetas seleccionando ingredientes y calcula costos automáticamente'}
          </Typography>
        </Box>
        {selectedProduct && (
          <Button
            variant="outlined"
            onClick={() => onProductSelect(null)}
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
            Volver
          </Button>
        )}
      </Box>

      {/* Contenido principal */}
      {selectedProduct ? (
        showRecipeForm ? (
          // 1️⃣ Formulario para crear receta
          <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
            <Card sx={{ mb: 3 }}>
              {/* Header con pestañas */}
              <Box sx={{ 
                backgroundColor: '#c8626d', 
                color: 'white',
                p: 0
              }}>
                <Box sx={{ p: 3, pb: 0 }}>
                  <Typography variant="h6" sx={{ 
                    fontFamily: '"Asap", sans-serif',
                    fontWeight: 600,
                    mb: 2
                  }}>
                    {recipeIngredients.length > 0 ? 'Editar Receta de' : 'Crear Receta para'} {selectedProduct.name}
                  </Typography>
                </Box>
                <Tabs 
                  value={recipeActiveTab} 
                  onChange={(e, newValue) => setRecipeActiveTab(newValue)}
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '& .MuiTab-root': {
                      color: 'white',
                      fontFamily: '"Asap", sans-serif',
                      fontWeight: 600,
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(255,255,255,0.2)'
                      }
                    }
                  }}
                >
                  <Tab label="Ingredientes" />
                  <Tab label="Mano de Obra" />
                  <Tab label="Costos" />
                </Tabs>
              </Box>
              
              <Box sx={{ p: 3 }}>
                {/* Pestaña 1: Ingredientes */}
                {recipeActiveTab === 0 && (
                  <Box>
                    {/* Formulario de ingredientes */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ 
                        fontFamily: '"Asap", sans-serif',
                        fontWeight: 600,
                        color: '#c8626d',
                        mb: 2
                      }}>
                        Agregar Ingrediente a la Receta
                      </Typography>
                      
                      {ingredients.length === 0 ? (
                        <Alert severity="warning" sx={{ mb: 2, fontFamily: '"Asap", sans-serif' }}>
                          <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif' }}>
                            <strong>No hay ingredientes disponibles.</strong> Debes agregar ingredientes primero en la sección "Materias Primas" antes de crear una receta.
                          </Typography>
                        </Alert>
                      ) : (
                        <Box>
                          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                            <FormControl sx={{ minWidth: 200, flex: 1 }}>
                              <InputLabel>Seleccionar Ingrediente</InputLabel>
                              <Select
                                value={newIngredient.ingredientId}
                                onChange={(e) => {
                                  const ingredientId = e.target.value;
                                  const ingredient = ingredients.find(ing => ing.id === ingredientId);
                                  setNewIngredient({...newIngredient, ingredientId, unit: ingredient?.unit || 'g'});
                                  setSelectedIngredientData(ingredient);
                                }}
                                label="Seleccionar Ingrediente"
                                sx={{ fontFamily: '"Asap", sans-serif' }}
                              >
                                {ingredients.map((ingredient) => (
                                  <MenuItem key={ingredient.id} value={ingredient.id}>
                                    {ingredient.name} - ${ingredient.price}/{ingredient.unit}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            
                            <TextField
                              label="Cantidad"
                              type="number"
                              value={newIngredient.quantity}
                              onChange={(e) => setNewIngredient({...newIngredient, quantity: parseFloat(e.target.value) || 0})}
                              sx={{ width: 120, fontFamily: '"Asap", sans-serif' }}
                              placeholder="100"
                            />
                            
                            <FormControl sx={{ width: 100 }}>
                              <InputLabel>Unidad</InputLabel>
                              <Select
                                value={newIngredient.unit}
                                onChange={(e) => setNewIngredient({...newIngredient, unit: e.target.value})}
                                label="Unidad"
                                sx={{ fontFamily: '"Asap", sans-serif' }}
                              >
                                <MenuItem value="g">g (gramos)</MenuItem>
                                <MenuItem value="kg">kg (kilogramos)</MenuItem>
                                <MenuItem value="ml">ml (mililitros)</MenuItem>
                                <MenuItem value="l">l (litros)</MenuItem>
                                <MenuItem value="unit">unidad</MenuItem>
                              </Select>
                            </FormControl>
                            
                            <Button 
                              variant="contained" 
                              onClick={addIngredientToRecipe}
                              disabled={!newIngredient.ingredientId || newIngredient.quantity <= 0}
                              sx={{ 
                                backgroundColor: '#c8626d', 
                                fontFamily: '"Asap", sans-serif',
                                '&:hover': { backgroundColor: '#b8555a' }
                              }}
                            >
                              Agregar
                            </Button>
                          </Box>
                          
                          {newIngredient.ingredientId && newIngredient.quantity > 0 && selectedIngredientData && (
                            <Box sx={{ 
                              mt: 2, 
                              p: 2, 
                              backgroundColor: '#f0f8ff', 
                              borderRadius: '8px',
                              border: '1px solid #c8626d'
                            }}>
                              <Typography variant="body2" sx={{ 
                                fontFamily: '"Asap", sans-serif',
                                color: '#666',
                                mb: 1
                              }}>
                                Cálculo de Costo:
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif' }}>
                                  {newIngredient.quantity} {newIngredient.unit} de {selectedIngredientData.name}
                                </Typography>
                                <Typography variant="h6" sx={{ 
                                  fontFamily: '"Asap", sans-serif',
                                  fontWeight: 700,
                                  color: '#c8626d'
                                }}>
                                  ${calculatedCost.toFixed(2)}
                                </Typography>
                              </Box>
                              <Typography variant="caption" sx={{ 
                                fontFamily: '"Asap", sans-serif',
                                color: '#999',
                                display: 'block',
                                mt: 0.5
                              }}>
                                Precio base: ${selectedIngredientData.price}/{selectedIngredientData.unit}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                    
                    {/* Lista de ingredientes agregados a la receta */}
                    {recipeIngredients.length > 0 && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1" sx={{ 
                          fontFamily: '"Asap", sans-serif',
                          fontWeight: 600,
                          mb: 2,
                          color: '#c8626d'
                        }}>
                          Ingredientes en la Receta:
                        </Typography>
                        {/* Header de columnas */}
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          p: 2, 
                          backgroundColor: '#c8626d', 
                          color: 'white',
                          borderRadius: '8px 8px 0 0',
                          fontWeight: 600,
                          fontFamily: '"Asap", sans-serif'
                        }}>
                          <Box sx={{ flex: 2, fontWeight: 600 }}>Ingrediente</Box>
                          <Box sx={{ flex: 1, textAlign: 'center', fontWeight: 600 }}>Cantidad</Box>
                          <Box sx={{ flex: 1, textAlign: 'center', fontWeight: 600 }}>Unidad</Box>
                          <Box sx={{ flex: 1, textAlign: 'center', fontWeight: 600 }}>Precio/kg</Box>
                          <Box sx={{ flex: 1, textAlign: 'center', fontWeight: 600 }}>Costo</Box>
                          <Box sx={{ width: 80, textAlign: 'center' }}>Acciones</Box>
                        </Box>

                        {/* Lista de ingredientes */}
                        <Box>
                          {recipeIngredients.map((ingredient, index) => (
                            <Box key={index} sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              p: 2, 
                              backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                              border: '1px solid #e0e0e0',
                              borderTop: 'none',
                              '&:last-child': {
                                borderRadius: '0 0 8px 8px'
                              }
                            }}>
                              {/* Nombre del ingrediente */}
                              <Box sx={{ flex: 2, fontFamily: '"Asap", sans-serif', fontWeight: 600 }}>
                                {ingredient.ingredientName}
                              </Box>
                              
                              {/* Cantidad */}
                              <Box sx={{ flex: 1, textAlign: 'center', fontFamily: '"Asap", sans-serif' }}>
                                {ingredient.quantity}
                              </Box>
                              
                              {/* Unidad */}
                              <Box sx={{ flex: 1, textAlign: 'center', fontFamily: '"Asap", sans-serif' }}>
                                {ingredient.unit}
                              </Box>
                              
                              {/* Precio por kg */}
                              <Box sx={{ flex: 1, textAlign: 'center', fontFamily: '"Asap", sans-serif' }}>
                                ${ingredient.ingredientPrice?.toFixed(2) || '0.00'}
                              </Box>
                              
                              {/* Costo total */}
                              <Box sx={{ 
                                flex: 1, 
                                textAlign: 'center', 
                                fontFamily: '"Asap", sans-serif',
                                fontWeight: 700,
                                color: '#c8626d'
                              }}>
                                ${ingredient.totalCost?.toFixed(2) || '0.00'}
                              </Box>
                              
                              {/* Botones de acción */}
                              <Box sx={{ width: 80, display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                <IconButton
                                  onClick={() => handleOpenEditIngredient(ingredient)}
                                  size="small"
                                  sx={{ 
                                    color: '#4CAF50',
                                    '&:hover': { backgroundColor: '#e8f5e8' }
                                  }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                                <IconButton
                                  onClick={() => removeIngredientFromRecipe(ingredient.ingredientId)}
                                  size="small"
                                  sx={{ 
                                    color: '#c8626d',
                                    '&:hover': { backgroundColor: '#ffebee' }
                                  }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                        
                        {/* Resumen de costos totales */}
                        <Box sx={{ 
                          mt: 2, 
                          p: 2, 
                          backgroundColor: '#e8f5e8', 
                          borderRadius: '8px',
                          border: '1px solid #4CAF50'
                        }}>
                          <Typography variant="h6" sx={{ 
                            fontFamily: '"Asap", sans-serif',
                            fontWeight: 700,
                            color: '#2e7d32',
                            mb: 1
                          }}>
                            Resumen de Costos
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                            <Box sx={{ minWidth: 200 }}>
                              <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', color: '#2e7d32', fontWeight: 600, mb: 0.5 }}>
                                Cantidad de galletas (Batch Size):
                              </Typography>
                              <TextField
                                type="number"
                                size="small"
                                value={newProduct.yield || 1}
                                onChange={(e) => setNewProduct({...newProduct, yield: Math.max(1, parseInt(e.target.value) || 1)})}
                                sx={{ backgroundColor: 'white', maxWidth: 100 }}
                              />
                            </Box>
                            
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', color: '#2e7d32', fontWeight: 600, mb: 0.5 }}>
                                Costo Unitario (Ingredientes):
                              </Typography>
                              <Typography variant="h5" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 700, color: '#2e7d32' }}>
                                ${(recipeIngredients.reduce((total, ing) => total + (ing.totalCost || 0), 0) / (newProduct.yield || 1)).toFixed(2)}
                                <Typography component="span" variant="body2" sx={{ ml: 1 }}>/ galleta</Typography>
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #4CAF50', pt: 1 }}>
                            <Typography variant="body1" sx={{ fontFamily: '"Asap", sans-serif' }}>
                              Costo Total de Ingredientes:
                            </Typography>
                            <Typography variant="h5" sx={{ 
                              fontFamily: '"Asap", sans-serif',
                              fontWeight: 700,
                              color: '#2e7d32'
                            }}>
                              ${recipeIngredients.reduce((total, ing) => total + (ing.totalCost || 0), 0).toFixed(2)}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ 
                            fontFamily: '"Asap", sans-serif',
                            color: '#666',
                            display: 'block',
                            mt: 0.5
                          }}>
                            {recipeIngredients.length} ingrediente{recipeIngredients.length !== 1 ? 's' : ''} en la receta
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                          <Button
                            variant="contained"
                            onClick={saveRecipe}
                            sx={{
                              backgroundColor: '#4CAF50',
                              fontFamily: '"Asap", sans-serif',
                              px: 4,
                              py: 1.5,
                              borderRadius: '12px',
                              '&:hover': { 
                                backgroundColor: '#45a049',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                              }
                            }}
                          >
                            {recipeIngredients.length > 0 ? 'Actualizar Receta' : 'Guardar Receta'}
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              console.log('🔄 Cancelando edición, volviendo a vista de receta');
                              setShowRecipeForm(false);
                              // Recargar los ingredientes originales del producto
                              if (selectedProduct.ingredients) {
                                setRecipeIngredients(selectedProduct.ingredients);
                              }
                            }}
                            sx={{
                              borderColor: '#c8626d',
                              color: '#c8626d',
                              fontFamily: '"Asap", sans-serif',
                              px: 4,
                              py: 1.5,
                              borderRadius: '12px',
                              '&:hover': {
                                backgroundColor: '#c8626d',
                                color: 'white',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(200, 98, 109, 0.3)'
                              }
                            }}
                          >
                            Cancelar
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Pestaña 2: Mano de Obra */}
                {recipeActiveTab === 1 && (
                  <Box>
                    <Typography variant="h6" sx={{ 
                      fontFamily: '"Asap", sans-serif',
                      fontWeight: 600,
                      color: '#4CAF50',
                      mb: 3
                    }}>
                      Costos de Mano de Obra y Adicionales
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Horas de Trabajo"
                          type="number"
                          value={laborCosts.laborHours || 0}
                          onChange={(e) => setLaborCosts({...laborCosts, laborHours: parseFloat(e.target.value) || 0})}
                          sx={{ fontFamily: '"Asap", sans-serif' }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Costo por Hora ($)"
                          type="number"
                          value={laborCosts.laborCostPerHour || 0}
                          onChange={(e) => setLaborCosts({...laborCosts, laborCostPerHour: parseFloat(e.target.value) || 0})}
                          sx={{ fontFamily: '"Asap", sans-serif' }}
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Box sx={{ 
                          backgroundColor: '#e8f5e8', 
                          p: 3, 
                          borderRadius: '8px',
                          border: '1px solid #4CAF50',
                          mb: 3
                        }}>
                          <Typography variant="h6" sx={{ 
                            fontFamily: '"Asap", sans-serif',
                            fontWeight: 600,
                            color: '#2e7d32',
                            textAlign: 'center',
                            mb: 1
                          }}>
                            💰 Costo de Mano de Obra: ${((laborCosts.laborHours || 0) * (laborCosts.laborCostPerHour || 0)).toFixed(2)}
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontFamily: '"Asap", sans-serif',
                            color: '#666',
                            textAlign: 'center'
                          }}>
                            {(laborCosts.laborHours || 0)} horas × ${(laborCosts.laborCostPerHour || 0)}/hora
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="h6" sx={{ 
                          fontFamily: '"Asap", sans-serif',
                          fontWeight: 600,
                          color: '#FF9800',
                          mb: 2
                        }}>
                          Costos Adicionales
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Servicios Públicos ($)"
                          type="number"
                          value={laborCosts.utilities || 0}
                          onChange={(e) => setLaborCosts({...laborCosts, utilities: parseFloat(e.target.value) || 0})}
                          sx={{ fontFamily: '"Asap", sans-serif' }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Equipos/Herramientas ($)"
                          type="number"
                          value={laborCosts.equipment || 0}
                          onChange={(e) => setLaborCosts({...laborCosts, equipment: parseFloat(e.target.value) || 0})}
                          sx={{ fontFamily: '"Asap", sans-serif' }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Empaque ($)"
                          type="number"
                          value={laborCosts.packaging || 0}
                          onChange={(e) => setLaborCosts({...laborCosts, packaging: parseFloat(e.target.value) || 0})}
                          sx={{ fontFamily: '"Asap", sans-serif' }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Otros Costos ($)"
                          type="number"
                          value={laborCosts.otherCosts || 0}
                          onChange={(e) => setLaborCosts({...laborCosts, otherCosts: parseFloat(e.target.value) || 0})}
                          sx={{ fontFamily: '"Asap", sans-serif' }}
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Box sx={{ 
                          backgroundColor: '#f8f9fa', 
                          p: 3, 
                          borderRadius: '8px',
                          border: '2px solid #c8626d'
                        }}>
                          <Typography variant="h6" sx={{ 
                            fontFamily: '"Asap", sans-serif',
                            fontWeight: 600,
                            color: '#c8626d',
                            mb: 2
                          }}>
                            Resumen Total de Costos
                          </Typography>
                          
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', color: '#666' }}>
                                Mano de Obra:
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600, textAlign: 'right' }}>
                                ${((laborCosts.laborHours || 0) * (laborCosts.laborCostPerHour || 0)).toFixed(2)}
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', color: '#666' }}>
                                Servicios Públicos:
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600, textAlign: 'right' }}>
                                ${(laborCosts.utilities || 0).toFixed(2)}
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', color: '#666' }}>
                                Equipos:
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600, textAlign: 'right' }}>
                                ${(laborCosts.equipment || 0).toFixed(2)}
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', color: '#666' }}>
                                Empaque:
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600, textAlign: 'right' }}>
                                ${(laborCosts.packaging || 0).toFixed(2)}
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', color: '#666' }}>
                                Otros:
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600, textAlign: 'right' }}>
                                ${(laborCosts.otherCosts || 0).toFixed(2)}
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={12}>
                              <Divider sx={{ my: 1 }} />
                            </Grid>
                            
                            <Grid item xs={6}>
                              <Typography variant="h6" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600, color: '#c8626d' }}>
                                TOTAL COSTOS:
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="h6" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600, textAlign: 'right', color: '#c8626d' }}>
                                ${(
                                  ((laborCosts.laborHours || 0) * (laborCosts.laborCostPerHour || 0)) +
                                  (laborCosts.utilities || 0) +
                                  (laborCosts.equipment || 0) +
                                  (laborCosts.packaging || 0) +
                                  (laborCosts.otherCosts || 0)
                                ).toFixed(2)}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Pestaña 3: Costos - Resumen Completo */}
                {recipeActiveTab === 2 && (
                  <Box>
                    <Typography variant="h6" sx={{ 
                      fontFamily: '"Asap", sans-serif',
                      fontWeight: 600,
                      color: '#c8626d',
                      mb: 3
                    }}>
                      📊 Resumen Completo de Costos
                    </Typography>
                    
                    <Grid container spacing={3}>
                      {/* Resumen de Ingredientes */}
                      <Grid item xs={12} md={6}>
                        <Card sx={{ 
                          backgroundColor: '#e8f5e8', 
                          border: '2px solid #4CAF50',
                          borderRadius: '12px'
                        }}>
                          <Box sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ 
                              fontFamily: '"Asap", sans-serif',
                              fontWeight: 700,
                              color: '#2e7d32',
                              mb: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}>
                              🥘 Costos de Ingredientes
                            </Typography>
                            
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" sx={{ 
                                fontFamily: '"Asap", sans-serif',
                                color: '#666',
                                mb: 1
                              }}>
                                Total de Ingredientes: {recipeIngredients.length}
                              </Typography>
                              <Typography variant="h4" sx={{ 
                                fontFamily: '"Asap", sans-serif',
                                fontWeight: 700,
                                color: '#2e7d32'
                              }}>
                                ${recipeIngredients.reduce((total, ing) => total + (ing.totalCost || 0), 0).toFixed(2)}
                              </Typography>
                            </Box>
                            
                            {recipeIngredients.length > 0 && (
                              <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                                {recipeIngredients.map((ingredient, index) => (
                                  <Box key={index} sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    py: 1,
                                    borderBottom: index < recipeIngredients.length - 1 ? '1px solid #c8e6c9' : 'none'
                                  }}>
                                    <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif' }}>
                                      {ingredient.ingredientName}
                                    </Typography>
                                    <Typography variant="body2" sx={{ 
                                      fontFamily: '"Asap", sans-serif',
                                      fontWeight: 600,
                                      color: '#2e7d32'
                                    }}>
                                      ${ingredient.totalCost?.toFixed(2) || '0.00'}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </Box>
                        </Card>
                      </Grid>
                      
                      {/* Resumen de Mano de Obra */}
                      <Grid item xs={12} md={6}>
                        <Card sx={{ 
                          backgroundColor: '#e3f2fd', 
                          border: '2px solid #2196F3',
                          borderRadius: '12px'
                        }}>
                          <Box sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ 
                              fontFamily: '"Asap", sans-serif',
                              fontWeight: 700,
                              color: '#1976d2',
                              mb: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}>
                              👷 Costos de Mano de Obra
                            </Typography>
                            
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" sx={{ 
                                fontFamily: '"Asap", sans-serif',
                                color: '#666',
                                mb: 1
                              }}>
                                Tiempo: {(() => {
                                  const laborTime = laborCosts.laborTime || 0;
                                  const timeUnit = laborCosts.laborTimeUnit || 'hours';
                                  const hoursWorked = timeUnit === 'minutes' ? laborTime / 60 : laborTime;
                                  return `${hoursWorked.toFixed(2)} horas`;
                                })()}
                              </Typography>
                              <Typography variant="h4" sx={{ 
                                fontFamily: '"Asap", sans-serif',
                                fontWeight: 700,
                                color: '#1976d2'
                              }}>
                                ${(() => {
                                  const laborTime = laborCosts.laborTime || 0;
                                  const laborCost = laborCosts.laborCostPerHour || 0;
                                  const timeUnit = laborCosts.laborTimeUnit || 'hours';
                                  const hoursWorked = timeUnit === 'minutes' ? laborTime / 60 : laborTime;
                                  return (hoursWorked * laborCost).toFixed(2);
                                })()}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ 
                              backgroundColor: 'rgba(33, 150, 243, 0.1)', 
                              p: 2, 
                              borderRadius: '8px',
                              mb: 2
                            }}>
                              <Typography variant="body2" sx={{ 
                                fontFamily: '"Asap", sans-serif',
                                color: '#1976d2',
                                fontWeight: 600,
                                mb: 1
                              }}>
                                Desglose de Costos:
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" sx={{ fontFamily: '"Asap", sans-serif' }}>
                                  Mano de Obra:
                                </Typography>
                                <Typography variant="caption" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600 }}>
                                  ${(() => {
                                    const laborTime = laborCosts.laborTime || 0;
                                    const laborCost = laborCosts.laborCostPerHour || 0;
                                    const timeUnit = laborCosts.laborTimeUnit || 'hours';
                                    const hoursWorked = timeUnit === 'minutes' ? laborTime / 60 : laborTime;
                                    return (hoursWorked * laborCost).toFixed(2);
                                  })()}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" sx={{ fontFamily: '"Asap", sans-serif' }}>
                                  Servicios Públicos:
                                </Typography>
                                <Typography variant="caption" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600 }}>
                                  ${(laborCosts.utilities || 0).toFixed(2)}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" sx={{ fontFamily: '"Asap", sans-serif' }}>
                                  Equipos:
                                </Typography>
                                <Typography variant="caption" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600 }}>
                                  ${(laborCosts.equipment || 0).toFixed(2)}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" sx={{ fontFamily: '"Asap", sans-serif' }}>
                                  Empaque:
                                </Typography>
                                <Typography variant="caption" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600 }}>
                                  ${(laborCosts.packaging || 0).toFixed(2)}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" sx={{ fontFamily: '"Asap", sans-serif' }}>
                                  Otros:
                                </Typography>
                                <Typography variant="caption" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600 }}>
                                  ${(laborCosts.otherCosts || 0).toFixed(2)}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                      
                      {/* Resumen Total */}
                      <Grid item xs={12}>
                        <Card sx={{ 
                          backgroundColor: '#fff3e0', 
                          border: '3px solid #FF9800',
                          borderRadius: '12px'
                        }}>
                          <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="h5" sx={{ 
                              fontFamily: '"Asap", sans-serif',
                              fontWeight: 700,
                              color: '#F57C00',
                              mb: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 1
                            }}>
                              💰 COSTO TOTAL DE PRODUCCIÓN
                            </Typography>
                            
                            <Typography variant="h2" sx={{ 
                              fontFamily: '"Asap", sans-serif',
                              fontWeight: 900,
                              color: '#E65100',
                              mb: 2
                            }}>
                              ${(() => {
                                const ingredientCost = recipeIngredients.reduce((total, ing) => total + (ing.totalCost || 0), 0);
                                const laborTime = laborCosts.laborTime || 0;
                                const laborCost = laborCosts.laborCostPerHour || 0;
                                const timeUnit = laborCosts.laborTimeUnit || 'hours';
                                const hoursWorked = timeUnit === 'minutes' ? laborTime / 60 : laborTime;
                                const laborCostTotal = hoursWorked * laborCost;
                                const additionalCosts = (laborCosts.utilities || 0) + (laborCosts.equipment || 0) + (laborCosts.packaging || 0) + (laborCosts.otherCosts || 0);
                                return (ingredientCost + laborCostTotal + additionalCosts).toFixed(2);
                              })()}
                            </Typography>
                            
                            <Box sx={{ 
                              backgroundColor: 'rgba(255, 152, 0, 0.1)', 
                              p: 2, 
                              borderRadius: '8px',
                              mt: 2
                            }}>
                              <Typography variant="body2" sx={{ 
                                fontFamily: '"Asap", sans-serif',
                                color: '#F57C00',
                                mb: 1
                              }}>
                                Desglose del Costo Total:
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={6}>
                                  <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif' }}>
                                    Ingredientes: ${recipeIngredients.reduce((total, ing) => total + (ing.totalCost || 0), 0).toFixed(2)}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif' }}>
                                    Mano de Obra: ${(() => {
                                      const laborTime = laborCosts.laborTime || 0;
                                      const laborCost = laborCosts.laborCostPerHour || 0;
                                      const timeUnit = laborCosts.laborTimeUnit || 'hours';
                                      const hoursWorked = timeUnit === 'minutes' ? laborTime / 60 : laborTime;
                                      return (hoursWorked * laborCost).toFixed(2);
                                    })()}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif' }}>
                                    Servicios: ${(laborCosts.utilities || 0).toFixed(2)}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif' }}>
                                    Otros: ${((laborCosts.equipment || 0) + (laborCosts.packaging || 0) + (laborCosts.otherCosts || 0)).toFixed(2)}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Box>
            </Card>
          </Box>
        ) : (
          // 2️⃣ Mostrar receta existente
          <>
            <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
              <Card>
                {/* Header con pestañas */}
                <Box sx={{ 
                  backgroundColor: '#c8626d', 
                  color: 'white',
                  p: 0
                }}>
                  <Box sx={{ p: 3, pb: 0 }}>
                    <Typography variant="h6" sx={{ 
                      fontFamily: '"Asap", sans-serif',
                      fontWeight: 600,
                      mb: 2
                    }}>
                      Receta de {selectedProduct.name}
                    </Typography>
                  </Box>
                  <Tabs 
                    value={recipeActiveTab} 
                    onChange={(e, newValue) => setRecipeActiveTab(newValue)}
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      '& .MuiTab-root': {
                        color: 'white',
                        fontFamily: '"Asap", sans-serif',
                        fontWeight: 600,
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(255,255,255,0.2)'
                        }
                      }
                    }}
                  >
                    <Tab label="Ingredientes" />
                    <Tab label="Mano de Obra" />
                    <Tab label="Costos" />
                  </Tabs>
                </Box>
                
                <Box sx={{ p: 3 }}>
                  {/* Pestaña 1: Ingredientes */}
                  {recipeActiveTab === 0 && (
                    <Box>
                      {selectedProduct.ingredients && selectedProduct.ingredients.length > 0 ? (
                        <Box>
                          {/* Header de columnas para receta existente */}
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            p: 2, 
                            backgroundColor: '#c8626d', 
                            color: 'white',
                            borderRadius: '8px 8px 0 0',
                            fontWeight: 600,
                            fontFamily: '"Asap", sans-serif'
                          }}>
                            <Box sx={{ flex: 2, fontWeight: 600 }}>Ingrediente</Box>
                            <Box sx={{ flex: 1, textAlign: 'center', fontWeight: 600 }}>Cantidad</Box>
                            <Box sx={{ flex: 1, textAlign: 'center', fontWeight: 600 }}>Unidad</Box>
                            <Box sx={{ flex: 1, textAlign: 'center', fontWeight: 600 }}>Precio/kg</Box>
                            <Box sx={{ flex: 1, textAlign: 'center', fontWeight: 600 }}>Costo</Box>
                            <Box sx={{ width: 80, textAlign: 'center', fontWeight: 600 }}>Acciones</Box>
                          </Box>

                          {/* Lista de ingredientes de receta existente */}
                          <Box>
                            {selectedProduct.ingredients.map((ingredient, index) => (
                              <Box key={index} sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                p: 2, 
                                backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                                border: '1px solid #e0e0e0',
                                borderTop: 'none',
                                '&:last-child': {
                                  borderRadius: '0 0 8px 8px'
                                }
                              }}>
                                {/* Nombre del ingrediente */}
                                <Box sx={{ flex: 2, fontFamily: '"Asap", sans-serif', fontWeight: 600 }}>
                                  {ingredient.ingredientName}
                                </Box>
                                
                                {/* Cantidad */}
                                <Box sx={{ flex: 1, textAlign: 'center', fontFamily: '"Asap", sans-serif' }}>
                                  {ingredient.quantity}
                                </Box>
                                
                                {/* Unidad */}
                                <Box sx={{ flex: 1, textAlign: 'center', fontFamily: '"Asap", sans-serif' }}>
                                  {ingredient.unit}
                                </Box>
                                
                                {/* Precio por kg */}
                                <Box sx={{ flex: 1, textAlign: 'center', fontFamily: '"Asap", sans-serif' }}>
                                  ${ingredient.ingredientPrice?.toFixed(2) || '0.00'}
                                </Box>
                                
                                {/* Costo total */}
                                <Box sx={{ 
                                  flex: 1, 
                                  textAlign: 'center', 
                                  fontFamily: '"Asap", sans-serif',
                                  fontWeight: 700,
                                  color: '#c8626d'
                                }}>
                                  ${ingredient.totalCost?.toFixed(2) || '0.00'}
                                </Box>

                                {/* Botones de acción rápido */}
                                <Box sx={{ width: 80, display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                  <IconButton
                                    onClick={() => {
                                      // Asegurarnos de cargar recipeIngredients para que la edición funcione
                                      if (!recipeIngredients.length) {
                                        setRecipeIngredients(selectedProduct.ingredients);
                                      }
                                      handleOpenEditIngredient(ingredient);
                                    }}
                                    size="small"
                                    sx={{ 
                                      color: '#4CAF50',
                                      '&:hover': { backgroundColor: '#e8f5e8' }
                                    }}
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    onClick={() => {
                                      if (window.confirm('¿Seguro que quieres eliminar este ingrediente de la receta? Deberás guardar los cambios para que se aplique en la base de datos.')) {
                                        // Activar modo edición si no lo está
                                        setShowRecipeForm(true);
                                        // Cargar si está vacío
                                        const currentIngredients = recipeIngredients.length ? recipeIngredients : selectedProduct.ingredients;
                                        setRecipeIngredients(currentIngredients.filter(ing => ing.ingredientId !== ingredient.ingredientId));
                                      }
                                    }}
                                    size="small"
                                    sx={{ 
                                      color: '#c8626d',
                                      '&:hover': { backgroundColor: '#ffebee' }
                                    }}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                            ))}
                          </Box>

                          {/* Resumen de costos con Batch Size */}
                          <Box sx={{ 
                            mt: 2, 
                            p: 2, 
                            backgroundColor: '#e8f5e8', 
                            borderRadius: '8px',
                            border: '1px solid #4CAF50'
                          }}>
                            <Typography variant="h6" sx={{ 
                              fontFamily: '"Asap", sans-serif',
                              fontWeight: 700,
                              color: '#2e7d32',
                              mb: 2
                            }}>
                              Resumen de la Receta
                            </Typography>
                            
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                              <Grid item xs={12} md={4}>
                                <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', color: '#2e7d32', fontWeight: 600 }}>
                                  Cantidad de galletas:
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={selectedProduct.yield || 1}
                                    onChange={(e) => {
                                      const val = Math.max(1, parseInt(e.target.value) || 1);
                                      if (selectedProduct) {
                                        onProductSelect({ ...selectedProduct, yield: val });
                                      }
                                    }}
                                    sx={{ backgroundColor: 'white', mt: 0.5, maxWidth: 80 }}
                                  />
                                  <IconButton 
                                    onClick={() => saveProductYield(selectedProduct.yield)}
                                    sx={{ color: '#4CAF50', ml: 1, mt: 0.5 }}
                                    title="Guardar rendimiento"
                                  >
                                    <Save fontSize="small" />
                                  </IconButton>
                                </Box>
                                <Typography variant="caption" sx={{ color: '#666' }}>
                                  Indica cuántas galletas salen de esta receta
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={12} md={8}>
                                <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
                                  <Box sx={{ flex: 1, p: 1.5, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                                    <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                                      Costo Unitario (Ingredientes):
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 700, color: '#2e7d32' }}>
                                      ${(selectedProduct.totalIngredientCost / (newProduct.yield || selectedProduct.yield || 1)).toFixed(2)}
                                    </Typography>
                                  </Box>
                                  
                                  <Box sx={{ flex: 1, p: 1.5, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                                    <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                                      Costo Total Receta:
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 700, color: '#2e7d32' }}>
                                      ${selectedProduct.totalIngredientCost.toFixed(2)}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                            </Grid>
                            
                            <Divider sx={{ my: 1, borderColor: 'rgba(76, 175, 80, 0.2)' }} />
                            
                            <Typography variant="caption" sx={{ 
                              fontFamily: '"Asap", sans-serif',
                              color: '#666',
                              display: 'block'
                            }}>
                              {selectedProduct.ingredientCount || selectedProduct.ingredients.length} ingrediente{(selectedProduct.ingredientCount || selectedProduct.ingredients.length) !== 1 ? 's' : ''} en la receta
                            </Typography>
                          </Box>
                          
                          {/* Botón para editar ingredientes */}
                          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                            <Button
                              variant="contained"
                              onClick={() => {
                                console.log('🔄 Activando modo edición de ingredientes');
                                setShowRecipeForm(true);
                                // Los ingredientes ya están cargados en recipeIngredients
                              }}
                              sx={{
                                backgroundColor: '#c8626d',
                                fontFamily: '"Asap", sans-serif',
                                fontWeight: 600,
                                px: 4,
                                py: 1.5,
                                borderRadius: '12px',
                                '&:hover': { 
                                  backgroundColor: '#b8555a',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 4px 12px rgba(200, 98, 109, 0.3)'
                                }
                              }}
                            >
                              Editar Ingredientes
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="body1" sx={{ fontFamily: '"Asap", sans-serif', color: '#666' }}>
                          No hay ingredientes en esta receta.
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* Pestaña 2: Mano de Obra */}
                  {recipeActiveTab === 1 && (
                    <Box>
                      <Typography variant="h6" sx={{ 
                        fontFamily: '"Asap", sans-serif',
                        fontWeight: 600,
                        color: '#4CAF50',
                        mb: 3
                      }}>
                        Costos de Mano de Obra
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Tiempo de Trabajo"
                            type="number"
                            value={editingProduct?.laborTime || 0}
                            onChange={(e) => {
                              const updatedProduct = {
                                ...editingProduct,
                                laborTime: parseFloat(e.target.value) || 0
                              };
                              setEditingProduct(updatedProduct);
                            }}
                            sx={{ fontFamily: '"Asap", sans-serif' }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={2}>
                          <FormControl fullWidth>
                            <InputLabel>Unidad</InputLabel>
                            <Select
                              value={editingProduct?.laborTimeUnit || 'hours'}
                              onChange={(e) => {
                                const updatedProduct = {
                                  ...editingProduct,
                                  laborTimeUnit: e.target.value
                                };
                                setEditingProduct(updatedProduct);
                              }}
                              label="Unidad"
                              sx={{ fontFamily: '"Asap", sans-serif' }}
                            >
                              <MenuItem value="minutes">Minutos</MenuItem>
                              <MenuItem value="hours">Horas</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Costo por Hora ($)"
                            type="number"
                            value={editingProduct?.laborCost || 0}
                            onChange={(e) => {
                              const updatedProduct = {
                                ...editingProduct,
                                laborCost: parseFloat(e.target.value) || 0
                              };
                              setEditingProduct(updatedProduct);
                            }}
                            sx={{ fontFamily: '"Asap", sans-serif' }}
                          />
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Box sx={{ 
                            backgroundColor: '#e8f5e8', 
                            p: 3, 
                            borderRadius: '8px',
                            border: '1px solid #4CAF50',
                            mb: 3
                          }}>
                            <Typography variant="h6" sx={{ 
                              fontFamily: '"Asap", sans-serif',
                              fontWeight: 600,
                              color: '#2e7d32',
                              textAlign: 'center',
                              mb: 1
                            }}>
                              💰 Costo de Mano de Obra: ${(() => {
                                const laborTime = editingProduct?.laborTime || 0;
                                const laborCost = editingProduct?.laborCost || 0;
                                const timeUnit = editingProduct?.laborTimeUnit || 'hours';
                                const hoursWorked = timeUnit === 'minutes' ? laborTime / 60 : laborTime;
                                return (hoursWorked * laborCost).toFixed(2);
                              })()}
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              fontFamily: '"Asap", sans-serif',
                              color: '#666',
                              textAlign: 'center'
                            }}>
                              {(() => {
                                const laborTime = editingProduct?.laborTime || 0;
                                const timeUnit = editingProduct?.laborTimeUnit || 'hours';
                                const hoursWorked = timeUnit === 'minutes' ? laborTime / 60 : laborTime;
                                return `${hoursWorked.toFixed(2)} horas × $${(editingProduct?.laborCost || 0)}/hora`;
                              })()}
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Typography variant="h6" sx={{ 
                            fontFamily: '"Asap", sans-serif',
                            fontWeight: 600,
                            color: '#FF9800',
                            mb: 2
                          }}>
                            ⚡ Cálculo Automático de Energía
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Tiempo de Producción (minutos)"
                            type="number"
                            value={editingProduct?.productionTime || 0}
                            onChange={(e) => {
                              const updatedProduct = {
                                ...editingProduct,
                                productionTime: parseFloat(e.target.value) || 0
                              };
                              setEditingProduct(updatedProduct);
                            }}
                            sx={{ fontFamily: '"Asap", sans-serif' }}
                            helperText="Tiempo que toma hacer una galleta (ej: 30 minutos)"
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Consumo del Horno (kW)"
                            type="number"
                            value={editingProduct?.ovenConsumption || 0}
                            onChange={(e) => {
                              const updatedProduct = {
                                ...editingProduct,
                                ovenConsumption: parseFloat(e.target.value) || 0
                              };
                              setEditingProduct(updatedProduct);
                            }}
                            sx={{ fontFamily: '"Asap", sans-serif' }}
                            helperText="Consumo del horno (ej: 2 kW)"
                          />
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Box sx={{ 
                            backgroundColor: '#e3f2fd', 
                            p: 2, 
                            borderRadius: '8px',
                            border: '1px solid #2196F3',
                            mb: 2
                          }}>
                            <Typography variant="body2" sx={{ 
                              fontFamily: '"Asap", sans-serif',
                              color: '#1976d2',
                              mb: 1
                            }}>
                              💡 Cálculo Automático de Electricidad (Clifton, NJ):
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif' }}>
                              Tiempo: {(editingProduct?.productionTime || 0)} min = {((editingProduct?.productionTime || 0) / 60).toFixed(2)} horas
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif' }}>
                              Consumo: {(editingProduct?.ovenConsumption || 0)} kW × {((editingProduct?.productionTime || 0) / 60).toFixed(2)} h = {((editingProduct?.ovenConsumption || 0) * ((editingProduct?.productionTime || 0) / 60)).toFixed(3)} kWh
                            </Typography>
                            <Typography variant="h6" sx={{ 
                              fontFamily: '"Asap", sans-serif',
                              fontWeight: 700,
                              color: '#1976d2',
                              mt: 1
                            }}>
                              Costo Electricidad: ${(((editingProduct?.ovenConsumption || 0) * ((editingProduct?.productionTime || 0) / 60)) * 0.1782).toFixed(4)} USD
                            </Typography>
                            <Typography variant="caption" sx={{ 
                              fontFamily: '"Asap", sans-serif',
                              color: '#666',
                              display: 'block',
                              mt: 0.5
                            }}>
                              Tarifa: $0.1782/kWh (Clifton, NJ)
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Typography variant="h6" sx={{ 
                            fontFamily: '"Asap", sans-serif',
                            fontWeight: 600,
                            color: '#FF9800',
                            mb: 2
                          }}>
                            Costos Adicionales Manuales
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Servicios Públicos ($)"
                            type="number"
                            value={editingProduct?.utilities || 0}
                            onChange={(e) => {
                              const updatedProduct = {
                                ...editingProduct,
                                utilities: parseFloat(e.target.value) || 0
                              };
                              setEditingProduct(updatedProduct);
                            }}
                            sx={{ fontFamily: '"Asap", sans-serif' }}
                            helperText="Se puede calcular automáticamente con el botón de abajo"
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              const electricityCost = ((editingProduct?.ovenConsumption || 0) * ((editingProduct?.productionTime || 0) / 60)) * 0.1782;
                              const updatedProduct = {
                                ...editingProduct,
                                utilities: electricityCost
                              };
                              setEditingProduct(updatedProduct);
                            }}
                            sx={{
                              borderColor: '#2196F3',
                              color: '#2196F3',
                              fontFamily: '"Asap", sans-serif',
                              fontWeight: 600,
                              py: 1.5,
                              '&:hover': {
                                backgroundColor: '#e3f2fd',
                                borderColor: '#1976d2',
                                color: '#1976d2'
                              }
                            }}
                          >
                            ⚡ Aplicar Cálculo Automático
                          </Button>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Equipos/Herramientas ($)"
                            type="number"
                            value={editingProduct?.equipment || 0}
                            onChange={(e) => {
                              const updatedProduct = {
                                ...editingProduct,
                                equipment: parseFloat(e.target.value) || 0
                              };
                              setEditingProduct(updatedProduct);
                            }}
                            sx={{ fontFamily: '"Asap", sans-serif' }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Empaque ($)"
                            type="number"
                            value={editingProduct?.packaging || 0}
                            onChange={(e) => {
                              const updatedProduct = {
                                ...editingProduct,
                                packaging: parseFloat(e.target.value) || 0
                              };
                              setEditingProduct(updatedProduct);
                            }}
                            sx={{ fontFamily: '"Asap", sans-serif' }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Otros Costos ($)"
                            type="number"
                            value={editingProduct?.additionalCosts || 0}
                            onChange={(e) => {
                              const updatedProduct = {
                                ...editingProduct,
                                additionalCosts: parseFloat(e.target.value) || 0
                              };
                              setEditingProduct(updatedProduct);
                            }}
                            sx={{ fontFamily: '"Asap", sans-serif' }}
                          />
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Box sx={{ 
                            backgroundColor: '#f8f9fa', 
                            p: 3, 
                            borderRadius: '8px',
                            border: '2px solid #c8626d'
                          }}>
                            <Typography variant="h6" sx={{ 
                              fontFamily: '"Asap", sans-serif',
                              fontWeight: 600,
                              color: '#c8626d',
                              mb: 2
                            }}>
                              Resumen Total de Costos
                            </Typography>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', color: '#666' }}>
                                  Mano de Obra:
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600, textAlign: 'right' }}>
                                  ${(() => {
                                    const laborTime = editingProduct?.laborTime || 0;
                                    const laborCost = editingProduct?.laborCost || 0;
                                    const timeUnit = editingProduct?.laborTimeUnit || 'hours';
                                    const hoursWorked = timeUnit === 'minutes' ? laborTime / 60 : laborTime;
                                    return (hoursWorked * laborCost).toFixed(2);
                                  })()}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', color: '#666' }}>
                                  Servicios Públicos:
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600, textAlign: 'right' }}>
                                  ${(editingProduct?.utilities || 0).toFixed(2)}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', color: '#666' }}>
                                  Equipos:
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600, textAlign: 'right' }}>
                                  ${(editingProduct?.equipment || 0).toFixed(2)}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', color: '#666' }}>
                                  Empaque:
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600, textAlign: 'right' }}>
                                  ${(editingProduct?.packaging || 0).toFixed(2)}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', color: '#666' }}>
                                  Otros:
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600, textAlign: 'right' }}>
                                  ${(editingProduct?.additionalCosts || 0).toFixed(2)}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={12}>
                                <Divider sx={{ my: 1 }} />
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Typography variant="h6" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600, color: '#c8626d' }}>
                                  TOTAL COSTOS:
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="h6" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600, textAlign: 'right', color: '#c8626d' }}>
                                ${(() => {
                                  const laborTime = editingProduct?.laborTime || 0;
                                  const laborCost = editingProduct?.laborCost || 0;
                                  const timeUnit = editingProduct?.laborTimeUnit || 'hours';
                                  const hoursWorked = timeUnit === 'minutes' ? laborTime / 60 : laborTime;
                                  const laborCostTotal = hoursWorked * laborCost;
                                  return (
                                    laborCostTotal +
                                    (editingProduct?.utilities || 0) +
                                    (editingProduct?.equipment || 0) +
                                    (editingProduct?.packaging || 0) +
                                    (editingProduct?.additionalCosts || 0)
                                  ).toFixed(2);
                                })()}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Box>
                        </Grid>
                        
                        {/* Botón para guardar cambios de mano de obra */}
                        <Grid item xs={12}>
                          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                            <Button
                              variant="contained"
                              onClick={async () => {
                                try {
                                  console.log('💾 Guardando cambios de mano de obra...', editingProduct);
                                  
                                  // Actualizar el producto en Firestore
                                  const productRef = doc(db, 'products', editingProduct.id);
                                  await updateDoc(productRef, {
                                    laborTime: editingProduct.laborTime || 0,
                                    laborTimeUnit: editingProduct.laborTimeUnit || 'hours',
                                    laborCost: editingProduct.laborCost || 0,
                                    productionTime: editingProduct.productionTime || 0,
                                    ovenConsumption: editingProduct.ovenConsumption || 0,
                                    utilities: editingProduct.utilities || 0,
                                    equipment: editingProduct.equipment || 0,
                                    packaging: editingProduct.packaging || 0,
                                    additionalCosts: editingProduct.additionalCosts || 0,
                                    totalLaborCost: (() => {
                                      const laborTime = editingProduct.laborTime || 0;
                                      const laborCost = editingProduct.laborCost || 0;
                                      const timeUnit = editingProduct.laborTimeUnit || 'hours';
                                      const hoursWorked = timeUnit === 'minutes' ? laborTime / 60 : laborTime;
                                      const laborCostTotal = hoursWorked * laborCost;
                                      return (
                                        laborCostTotal +
                                        (editingProduct.utilities || 0) +
                                        (editingProduct.equipment || 0) +
                                        (editingProduct.packaging || 0) +
                                        (editingProduct.additionalCosts || 0)
                                      );
                                    })()
                                  });
                                  
                                  console.log('✅ Cambios de mano de obra guardados exitosamente');
                                  showNotification('✅ Cambios de mano de obra guardados exitosamente');
                                  
                                  // Actualizar la lista de productos
                                  const updatedProducts = products.map(p => 
                                    p.id === editingProduct.id ? editingProduct : p
                                  );
                                  setProducts(updatedProducts);
                                  
                                } catch (error) {
                                  console.error('❌ Error al guardar cambios de mano de obra:', error);
                                  alert('❌ Error al guardar los cambios. Inténtalo de nuevo.');
                                }
                              }}
                              sx={{
                                backgroundColor: '#4CAF50',
                                fontFamily: '"Asap", sans-serif',
                                fontWeight: 600,
                                px: 4,
                                py: 1.5,
                                borderRadius: '12px',
                                '&:hover': { 
                                  backgroundColor: '#45a049',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                                }
                              }}
                            >
                              💾 Guardar Cambios de Mano de Obra
                            </Button>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {/* Pestaña 3: Costos - Resumen Completo */}
                  {recipeActiveTab === 2 && (
                    <Box>
                      <Typography variant="h6" sx={{ 
                        fontFamily: '"Asap", sans-serif',
                        fontWeight: 600,
                        color: '#c8626d',
                        mb: 3
                      }}>
                        📊 Resumen Completo de Costos
                      </Typography>
                      
                      <Grid container spacing={3}>
                        {/* Resumen de Ingredientes */}
                        <Grid item xs={12} md={6}>
                          <Card sx={{ 
                            backgroundColor: '#e8f5e8', 
                            border: '2px solid #4CAF50',
                            borderRadius: '12px'
                          }}>
                            <Box sx={{ p: 3 }}>
                              <Typography variant="h6" sx={{ 
                                fontFamily: '"Asap", sans-serif',
                                fontWeight: 700,
                                color: '#2e7d32',
                                mb: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}>
                                🥘 Costos de Ingredientes
                              </Typography>
                              
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" sx={{ 
                                  fontFamily: '"Asap", sans-serif',
                                  color: '#666',
                                  mb: 1
                                }}>
                                  Total de Ingredientes: {selectedProduct.ingredients?.length || 0}
                                </Typography>
                                <Typography variant="h4" sx={{ 
                                  fontFamily: '"Asap", sans-serif',
                                  fontWeight: 700,
                                  color: '#2e7d32'
                                }}>
                                  ${selectedProduct.totalIngredientCost?.toFixed(2) || '0.00'}
                                </Typography>
                              </Box>
                              
                              {selectedProduct.ingredients && selectedProduct.ingredients.length > 0 && (
                                <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                                  {selectedProduct.ingredients.map((ingredient, index) => (
                                    <Box key={index} sx={{ 
                                      display: 'flex', 
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      py: 1,
                                      borderBottom: index < selectedProduct.ingredients.length - 1 ? '1px solid #c8e6c9' : 'none'
                                    }}>
                                      <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif' }}>
                                        {ingredient.ingredientName}
                                      </Typography>
                                      <Typography variant="body2" sx={{ 
                                        fontFamily: '"Asap", sans-serif',
                                        fontWeight: 600,
                                        color: '#2e7d32'
                                      }}>
                                        ${ingredient.totalCost?.toFixed(2) || '0.00'}
                                      </Typography>
                                    </Box>
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </Card>
                        </Grid>
                        
                        {/* Resumen de Mano de Obra */}
                        <Grid item xs={12} md={6}>
                          <Card sx={{ 
                            backgroundColor: '#e3f2fd', 
                            border: '2px solid #2196F3',
                            borderRadius: '12px'
                          }}>
                            <Box sx={{ p: 3 }}>
                              <Typography variant="h6" sx={{ 
                                fontFamily: '"Asap", sans-serif',
                                fontWeight: 700,
                                color: '#1976d2',
                                mb: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}>
                                👷 Costos de Mano de Obra
                              </Typography>
                              
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" sx={{ 
                                  fontFamily: '"Asap", sans-serif',
                                  color: '#666',
                                  mb: 1
                                }}>
                                  Tiempo: {(() => {
                                    const laborTime = selectedProduct.laborTime || selectedProduct.laborHours || 0;
                                    const timeUnit = selectedProduct.laborTimeUnit || 'hours';
                                    const hoursWorked = timeUnit === 'minutes' ? laborTime / 60 : laborTime;
                                    return `${hoursWorked.toFixed(2)} horas`;
                                  })()}
                                </Typography>
                                <Typography variant="h4" sx={{ 
                                  fontFamily: '"Asap", sans-serif',
                                  fontWeight: 700,
                                  color: '#1976d2'
                                }}>
                                  ${(() => {
                                    const laborTime = selectedProduct.laborTime || selectedProduct.laborHours || 0;
                                    const laborCost = selectedProduct.laborCost || 0;
                                    const timeUnit = selectedProduct.laborTimeUnit || 'hours';
                                    const hoursWorked = timeUnit === 'minutes' ? laborTime / 60 : laborTime;
                                    return (hoursWorked * laborCost).toFixed(2);
                                  })()}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ 
                                backgroundColor: 'rgba(33, 150, 243, 0.1)', 
                                p: 2, 
                                borderRadius: '8px',
                                mb: 2
                              }}>
                                <Typography variant="body2" sx={{ 
                                  fontFamily: '"Asap", sans-serif',
                                  color: '#1976d2',
                                  fontWeight: 600,
                                  mb: 1
                                }}>
                                  Desglose de Costos:
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="caption" sx={{ fontFamily: '"Asap", sans-serif' }}>
                                    Mano de Obra:
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600 }}>
                                    ${(() => {
                                      const laborTime = selectedProduct.laborTime || selectedProduct.laborHours || 0;
                                      const laborCost = selectedProduct.laborCost || 0;
                                      const timeUnit = selectedProduct.laborTimeUnit || 'hours';
                                      const hoursWorked = timeUnit === 'minutes' ? laborTime / 60 : laborTime;
                                      return (hoursWorked * laborCost).toFixed(2);
                                    })()}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="caption" sx={{ fontFamily: '"Asap", sans-serif' }}>
                                    Servicios Públicos:
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600 }}>
                                    ${(selectedProduct.utilities || 0).toFixed(2)}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="caption" sx={{ fontFamily: '"Asap", sans-serif' }}>
                                    Equipos:
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600 }}>
                                    ${(selectedProduct.equipment || 0).toFixed(2)}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="caption" sx={{ fontFamily: '"Asap", sans-serif' }}>
                                    Empaque:
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600 }}>
                                    ${(selectedProduct.packaging || 0).toFixed(2)}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="caption" sx={{ fontFamily: '"Asap", sans-serif' }}>
                                    Otros:
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600 }}>
                                    ${(selectedProduct.additionalCosts || 0).toFixed(2)}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Card>
                        </Grid>
                        
                        {/* Resumen Total */}
                        <Grid item xs={12}>
                          <Card sx={{ 
                            backgroundColor: '#fff3e0', 
                            border: '3px solid #FF9800',
                            borderRadius: '12px'
                          }}>
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                              <Typography variant="h5" sx={{ 
                                fontFamily: '"Asap", sans-serif',
                                fontWeight: 700,
                                color: '#F57C00',
                                mb: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1
                              }}>
                                💰 COSTO TOTAL DE PRODUCCIÓN
                              </Typography>
                              
                              <Typography variant="h2" sx={{ 
                                fontFamily: '"Asap", sans-serif',
                                fontWeight: 900,
                                color: '#E65100',
                                mb: 2
                              }}>
                                ${(() => {
                                  const ingredientCost = selectedProduct.totalIngredientCost || 0;
                                  const laborTime = selectedProduct.laborTime || selectedProduct.laborHours || 0;
                                  const laborCost = selectedProduct.laborCost || 0;
                                  const timeUnit = selectedProduct.laborTimeUnit || 'hours';
                                  const hoursWorked = timeUnit === 'minutes' ? laborTime / 60 : laborTime;
                                  const laborCostTotal = hoursWorked * laborCost;
                                  const additionalCosts = (selectedProduct.utilities || 0) + (selectedProduct.equipment || 0) + (selectedProduct.packaging || 0) + (selectedProduct.additionalCosts || 0);
                                  return (ingredientCost + laborCostTotal + additionalCosts).toFixed(2);
                                })()}
                              </Typography>
                              
                              <Divider sx={{ my: 2, borderColor: '#FF9800' }} />
                              
                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600, color: '#F57C00', mb: 1 }}>
                                  📦 Rendimiento de la Receta
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                                  <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif' }}>
                                    Cantidad de galletas que produce esta receta:
                                  </Typography>
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={selectedProduct.yield || 1}
                                    onChange={(e) => {
                                      const val = Math.max(1, parseInt(e.target.value) || 1);
                                      if (selectedProduct) {
                                        onProductSelect({ ...selectedProduct, yield: val });
                                      }
                                    }}
                                    sx={{ maxWidth: 80, backgroundColor: 'white' }}
                                  />
                                  <IconButton 
                                    onClick={() => saveProductYield(selectedProduct.yield)}
                                    sx={{ color: '#FF9800', ml: 1 }}
                                    title="Guardar rendimiento"
                                  >
                                    <Save fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>

                              <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} md={6}>
                                  <Box sx={{ p: 2, backgroundColor: 'white', border: '1px solid #FF9800', borderRadius: '8px' }}>
                                    <Typography variant="caption" sx={{ color: '#F57C00', fontWeight: 600 }}>
                                      COSTO POR GALLETA (TOTAL)
                                    </Typography>
                                    <Typography variant="h4" sx={{ color: '#E65100', fontWeight: 900 }}>
                                      ${(() => {
                                        const ingredientCost = selectedProduct.totalIngredientCost || 0;
                                        const laborTime = selectedProduct.laborTime || selectedProduct.laborHours || 0;
                                        const laborCost = selectedProduct.laborCost || 0;
                                        const timeUnit = selectedProduct.laborTimeUnit || 'hours';
                                        const hoursWorked = timeUnit === 'minutes' ? laborTime / 60 : laborTime;
                                        const laborCostTotal = hoursWorked * laborCost;
                                        const additionalCosts = (selectedProduct.utilities || 0) + (selectedProduct.equipment || 0) + (selectedProduct.packaging || 0) + (selectedProduct.additionalCosts || 0);
                                        const total = ingredientCost + laborCostTotal + additionalCosts;
                                        return (total / (newProduct.yield || selectedProduct.yield || 1)).toFixed(2);
                                      })()}
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Box sx={{ p: 2, backgroundColor: 'white', border: '1px solid #FF9800', borderRadius: '8px' }}>
                                    <Typography variant="caption" sx={{ color: '#F57C00', fontWeight: 600 }}>
                                      COSTO POR GALLETA (SOLO INGREDIENTES)
                                    </Typography>
                                    <Typography variant="h4" sx={{ color: '#E65100', fontWeight: 900 }}>
                                      ${(selectedProduct.totalIngredientCost / (newProduct.yield || selectedProduct.yield || 1)).toFixed(2)}
                                    </Typography>
                                  </Box>
                                </Grid>
                                
                                <Grid item xs={12}>
                                  <Box sx={{ 
                                    p: 3, 
                                    backgroundColor: '#c8626d', 
                                    borderRadius: '16px', 
                                    boxShadow: '0 8px 16px rgba(200, 98, 109, 0.2)',
                                    color: 'white',
                                    mt: 2,
                                    position: 'relative',
                                    overflow: 'hidden'
                                  }}>
                                    <Box sx={{ 
                                      position: 'absolute', 
                                      top: -10, 
                                      right: -10, 
                                      opacity: 0.1, 
                                      transform: 'rotate(15deg)' 
                                    }}>
                                      <Receipt sx={{ fontSize: 100 }} />
                                    </Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
                                      Precio Sugerido Venta ({selectedProduct.profitMargin || 30}% margen)
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                      <Typography variant="h3" sx={{ fontWeight: 900, fontFamily: '"Asap", sans-serif' }}>
                                        ${(() => {
                                          const ingredientCost = selectedProduct.totalIngredientCost || 0;
                                          const laborTime = selectedProduct.laborTime || selectedProduct.laborHours || 0;
                                          const laborCost = selectedProduct.laborCost || 0;
                                          const timeUnit = selectedProduct.laborTimeUnit || 'hours';
                                          const hoursWorked = timeUnit === 'minutes' ? laborTime / 60 : laborTime;
                                          const laborCostTotal = hoursWorked * laborCost;
                                          const additionalCosts = (selectedProduct.utilities || 0) + (selectedProduct.equipment || 0) + (selectedProduct.packaging || 0) + (selectedProduct.additionalCosts || 0);
                                          const totalCost = ingredientCost + laborCostTotal + additionalCosts;
                                          const margin = (selectedProduct.profitMargin || 30) / 100;
                                          const totalPrice = totalCost * (1 + margin);
                                          return (totalPrice / (newProduct.yield || selectedProduct.yield || 1)).toFixed(2);
                                        })()}
                                      </Typography>
                                      <Typography variant="h6" sx={{ opacity: 0.8 }}>/ por galleta</Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                              </Grid>

                              <Box sx={{ 
                                backgroundColor: 'rgba(255, 152, 0, 0.1)', 
                                p: 2, 
                                borderRadius: '8px',
                                mt: 2
                              }}>
                                <Typography variant="body2" sx={{ 
                                  fontFamily: '"Asap", sans-serif',
                                  color: '#F57C00',
                                  mb: 1
                                }}>
                                  Desglose del Costo Total:
                                </Typography>
                                <Grid container spacing={2}>
                                  <Grid item xs={6}>
                                    <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif' }}>
                                      Ingredientes: ${selectedProduct.totalIngredientCost?.toFixed(2) || '0.00'}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif' }}>
                                      Mano de Obra: ${(() => {
                                        const laborTime = selectedProduct.laborTime || selectedProduct.laborHours || 0;
                                        const laborCost = selectedProduct.laborCost || 0;
                                        const timeUnit = selectedProduct.laborTimeUnit || 'hours';
                                        const hoursWorked = timeUnit === 'minutes' ? laborTime / 60 : laborTime;
                                        return (hoursWorked * laborCost).toFixed(2);
                                      })()}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif' }}>
                                      Servicios: ${(selectedProduct.utilities || 0).toFixed(2)}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif' }}>
                                      Otros: ${((selectedProduct.equipment || 0) + (selectedProduct.packaging || 0) + (selectedProduct.additionalCosts || 0)).toFixed(2)}
                                    </Typography>
                                  </Grid>
                                </Grid>
                              </Box>
                            </Box>
                          </Card>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Box>
              </Card>
            </Box>
          </>
        )
      ) : (
        // 3️⃣ Vista general cuando no hay producto seleccionado
        <>
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            border: '2px dashed #dee2e6'
          }}>
            <Receipt sx={{ fontSize: 64, color: '#c8626d', mb: 2 }} />
            <Typography variant="h6" sx={{ 
              color: '#666', 
              fontFamily: '"Asap", sans-serif',
              mb: 1
            }}>
              Selecciona un producto del menú lateral
            </Typography>
            <Typography variant="body2" sx={{ color: '#999', fontFamily: '"Asap", sans-serif' }}>
              Haz clic en "Productos" en el menú lateral para ver las galletas disponibles
            </Typography>
          </Box>
        </>
      )}

      {/* Modal con Pestañas */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: '12px',
            minHeight: '80vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#c8626d', 
          color: 'white',
          fontFamily: '"Asap", sans-serif',
          fontWeight: 600,
          p: 0
        }}>
          <Box sx={{ p: 3, pb: 0 }}>
            <Typography variant="h6" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600 }}>
              Crear Nueva Receta
            </Typography>
          </Box>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ 
              backgroundColor: 'rgba(255,255,255,0.1)',
              '& .MuiTab-root': {
                color: 'white',
                fontFamily: '"Asap", sans-serif',
                fontWeight: 600,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255,255,255,0.2)'
                }
              }
            }}
          >
            <Tab label="Ingredientes" />
            <Tab label="Mano de Obra" />
          </Tabs>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {/* Pestaña 1: Ingredientes */}
          {activeTab === 0 && (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {/* Información básica */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ 
                    fontFamily: '"Asap", sans-serif',
                    fontWeight: 600,
                    color: '#c8626d',
                    mb: 2
                  }}>
                    Información del Producto
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nombre del Producto"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    placeholder="Ej: Galleta Dubai"
                    sx={{ fontFamily: '"Asap", sans-serif' }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Categoría</InputLabel>
                    <Select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      label="Categoría"
                    >
                      <MenuItem value="galletas">Galletas</MenuItem>
                      <MenuItem value="pasteles">Pasteles</MenuItem>
                      <MenuItem value="panes">Panes</MenuItem>
                      <MenuItem value="otros">Otros</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descripción"
                    multiline
                    rows={2}
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    placeholder="Describe tu producto..."
                    sx={{ fontFamily: '"Asap", sans-serif' }}
                  />
                </Grid>

                {/* Ingredientes */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ 
                    fontFamily: '"Asap", sans-serif',
                    fontWeight: 600,
                    color: '#c8626d',
                    mb: 2
                  }}>
                    Agregar Ingredientes
                  </Typography>
                  
                  {ingredients.length === 0 && (
                    <Alert severity="warning" sx={{ mb: 2, fontFamily: '"Asap", sans-serif' }}>
                      <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif' }}>
                        <strong>No hay ingredientes disponibles.</strong> Debes agregar ingredientes primero en la sección "Materias Primas".
                      </Typography>
                    </Alert>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Seleccionar Ingrediente</InputLabel>
                    <Select
                      value={selectedIngredient}
                      onChange={(e) => setSelectedIngredient(e.target.value)}
                      label="Seleccionar Ingrediente"
                    >
                      {ingredients.length > 0 ? ingredients.map((ingredient) => (
                        <MenuItem key={ingredient.id} value={ingredient.id}>
                          {ingredient.name} - ${ingredient.price}/{ingredient.unit}
                        </MenuItem>
                      )) : (
                        <MenuItem disabled>
                          No hay ingredientes disponibles. Agrega ingredientes primero.
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Cantidad"
                    type="number"
                    value={ingredientQuantity}
                    onChange={(e) => setIngredientQuantity(parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 100"
                    sx={{ fontFamily: '"Asap", sans-serif' }}
                  />
                </Grid>
                
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={addIngredientToProduct}
                    disabled={ingredients.length === 0}
                    sx={{
                      backgroundColor: ingredients.length === 0 ? '#ccc' : '#4CAF50',
                      '&:hover': { 
                        backgroundColor: ingredients.length === 0 ? '#ccc' : '#45a049' 
                      },
                      fontFamily: '"Asap", sans-serif',
                      height: '56px'
                    }}
                  >
                    Agregar
                  </Button>
                </Grid>

                {/* Lista de ingredientes agregados */}
                <Grid item xs={12}>
                  {newProduct.ingredients.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontFamily: '"Asap", sans-serif',
                        fontWeight: 600,
                        mb: 1
                      }}>
                        Ingredientes Agregados:
                      </Typography>
                      <List dense>
                        {newProduct.ingredients.map((ingredient, index) => (
                          <ListItem key={index} sx={{ 
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            mb: 1
                          }}>
                            <ListItemText
                              primary={ingredient.ingredientName}
                              secondary={`${ingredient.quantity} ${ingredient.unit}`}
                              sx={{ fontFamily: '"Asap", sans-serif' }}
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={() => removeIngredientFromProduct(ingredient.ingredientId)}
                                size="small"
                              >
                                <Delete />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Pestaña 2: Mano de Obra */}
          {activeTab === 1 && (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {/* Mano de Obra */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ 
                    fontFamily: '"Asap", sans-serif',
                    fontWeight: 600,
                    color: '#4CAF50',
                    mb: 2
                  }}>
                    Mano de Obra
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Horas de Trabajo"
                    type="number"
                    value={laborCosts.laborHours}
                    onChange={(e) => setLaborCosts({...laborCosts, laborHours: parseFloat(e.target.value) || 0})}
                    placeholder="Ej: 2.5"
                    sx={{ fontFamily: '"Asap", sans-serif' }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Costo por Hora ($)"
                    type="number"
                    value={laborCosts.laborCostPerHour}
                    onChange={(e) => setLaborCosts({...laborCosts, laborCostPerHour: parseFloat(e.target.value) || 0})}
                    placeholder="Ej: 15"
                    sx={{ fontFamily: '"Asap", sans-serif' }}
                  />
                </Grid>

                {/* Mostrar valor de mano de obra en tiempo real */}
                <Grid item xs={12}>
                  <Box sx={{ 
                    backgroundColor: '#e8f5e8', 
                    p: 2, 
                    borderRadius: '8px',
                    border: '1px solid #4CAF50',
                    mb: 2
                  }}>
                    <Typography variant="h6" sx={{ 
                      fontFamily: '"Asap", sans-serif',
                      fontWeight: 600,
                      color: '#2e7d32',
                      textAlign: 'center'
                    }}>
                      💰 Costo de Mano de Obra: ${(laborCosts.laborHours * laborCosts.laborCostPerHour).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      fontFamily: '"Asap", sans-serif',
                      color: '#666',
                      textAlign: 'center',
                      mt: 1
                    }}>
                      {laborCosts.laborHours} horas × ${laborCosts.laborCostPerHour}/hora
                    </Typography>
                  </Box>
                </Grid>

                {/* Costos Adicionales */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ 
                    fontFamily: '"Asap", sans-serif',
                    fontWeight: 600,
                    color: '#FF9800',
                    mb: 2
                  }}>
                    Costos Adicionales
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Servicios Públicos ($)"
                    type="number"
                    value={laborCosts.utilities}
                    onChange={(e) => setLaborCosts({...laborCosts, utilities: parseFloat(e.target.value) || 0})}
                    placeholder="Ej: 5"
                    sx={{ fontFamily: '"Asap", sans-serif' }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Equipos/Herramientas ($)"
                    type="number"
                    value={laborCosts.equipment}
                    onChange={(e) => setLaborCosts({...laborCosts, equipment: parseFloat(e.target.value) || 0})}
                    placeholder="Ej: 3"
                    sx={{ fontFamily: '"Asap", sans-serif' }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Empaque ($)"
                    type="number"
                    value={laborCosts.packaging}
                    onChange={(e) => setLaborCosts({...laborCosts, packaging: parseFloat(e.target.value) || 0})}
                    placeholder="Ej: 2"
                    sx={{ fontFamily: '"Asap", sans-serif' }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Otros Costos ($)"
                    type="number"
                    value={laborCosts.additionalCosts}
                    onChange={(e) => setLaborCosts({...laborCosts, additionalCosts: parseFloat(e.target.value) || 0})}
                    placeholder="Ej: 1"
                    sx={{ fontFamily: '"Asap", sans-serif' }}
                  />
                </Grid>

                {/* Resumen Total */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ 
                    fontFamily: '"Asap", sans-serif',
                    fontWeight: 600,
                    color: '#c8626d',
                    mb: 2
                  }}>
                    Resumen Total de Costos
                  </Typography>
                  
                  <Box sx={{ 
                    backgroundColor: '#f8f9fa', 
                    p: 3, 
                    borderRadius: '8px',
                    border: '2px solid #c8626d'
                  }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', color: '#666' }}>
                          Mano de Obra:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600, textAlign: 'right' }}>
                          ${(laborCosts.laborHours * laborCosts.laborCostPerHour).toFixed(2)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', color: '#666' }}>
                          Servicios Públicos:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600, textAlign: 'right' }}>
                          ${laborCosts.utilities.toFixed(2)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', color: '#666' }}>
                          Equipos:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600, textAlign: 'right' }}>
                          ${laborCosts.equipment.toFixed(2)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', color: '#666' }}>
                          Empaque:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600, textAlign: 'right' }}>
                          ${laborCosts.packaging.toFixed(2)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', color: '#666' }}>
                          Otros:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600, textAlign: 'right' }}>
                          ${laborCosts.additionalCosts.toFixed(2)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="h6" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600, color: '#c8626d' }}>
                          TOTAL COSTOS:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="h6" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600, textAlign: 'right', color: '#c8626d' }}>
                          ${(
                            (laborCosts.laborHours * laborCosts.laborCostPerHour) +
                            laborCosts.utilities +
                            laborCosts.equipment +
                            laborCosts.packaging +
                            laborCosts.additionalCosts
                          ).toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setDialogOpen(false)}
            sx={{ fontFamily: '"Asap", sans-serif' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveProduct}
            variant="contained"
            startIcon={<Save />}
            sx={{
              backgroundColor: '#c8626d',
              '&:hover': { backgroundColor: '#b8555a' },
              fontFamily: '"Asap", sans-serif'
            }}
          >
            Guardar Receta Completa
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para editar cantidad de ingrediente */}
      <Dialog 
        open={editIngredientDialogOpen} 
        onClose={() => setEditIngredientDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ 
          backgroundColor: '#c8626d', 
          color: 'white', 
          fontFamily: '"Asap", sans-serif',
          py: 2
        }}>
          Editar Cantidad: {editingIngredientItem?.ingredientName}
        </DialogTitle>
        <DialogContent sx={{ mt: 2, p: 3 }}>
          <Box sx={{ p: 1 }}>
            <Typography variant="body1" sx={{ mb: 2, fontFamily: '"Asap", sans-serif', color: '#666' }}>
              Cambia la cantidad para este ingrediente en la receta:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                fullWidth
                label="Cantidad"
                type="number"
                value={editIngredientQuantity}
                onChange={(e) => setEditIngredientQuantity(parseFloat(e.target.value) || 0)}
                autoFocus
                sx={{ fontFamily: '"Asap", sans-serif' }}
              />
              <Typography variant="h6" sx={{ fontFamily: '"Asap", sans-serif', fontWeight: 600 }}>
                {editingIngredientItem?.unit || editingIngredientItem?.ingredientUnit}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
          <Button 
            onClick={() => setEditIngredientDialogOpen(false)} 
            sx={{ fontFamily: '"Asap", sans-serif', color: '#666' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleUpdateIngredientQuantity}
            variant="contained"
            sx={{ 
              backgroundColor: '#c8626d', 
              fontFamily: '"Asap", sans-serif',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#b8555a' }
            }}
          >
            Actualizar Cantidad
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%', fontFamily: '"Asap", sans-serif', fontWeight: 600, borderRadius: '12px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CostAnalysisProducts;
