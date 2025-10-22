import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Avatar,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress
} from '@mui/material';
import {
  ShoppingCart,
  Inventory,
  AttachMoney,
  LocalShipping,
  Star,
  MoreVert,
  Add,
  Edit,
  Delete,
  Visibility,
  FontDownload,
  PhotoCamera,
  People,
  Person,
  LocalOffer,
  Share,
  Assessment,
  Close,
  Group,
  AdminPanelSettings
} from '@mui/icons-material';
import FontManager from '../components/FontManager';
import BannerPhotoManager from '../components/BannerPhotoManager';
import Banner2PhotoManager from '../components/Banner2PhotoManager';
import PagesManager from '../components/PagesManager';
import MinProductsManager from '../components/MinProductsManager';
import ProductsManager from '../components/ProductsManager';
import InventoryManager from '../components/InventoryManager';
import TestimonialsManager from '../components/TestimonialsManager';
import FeaturedProductsManager from '../components/FeaturedProductsManager';
import SocialMediaManager from '../components/SocialMediaManager';
import PopupHeroManager from '../components/PopupHeroManager';
import StripeBalance from '../components/StripeBalance';

const AdminDashboard = () => {
  const [fontManagerOpen, setFontManagerOpen] = useState(false);
  const [bannerPhotoManagerOpen, setBannerPhotoManagerOpen] = useState(false);
  const [banner2PhotoManagerOpen, setBanner2PhotoManagerOpen] = useState(false);
  const [pagesManagerOpen, setPagesManagerOpen] = useState(false);
  const [minProductsManagerOpen, setMinProductsManagerOpen] = useState(false);
  const [minProducts, setMinProducts] = useState(1);
  const [productsManagerOpen, setProductsManagerOpen] = useState(false);
  const [inventoryManagerOpen, setInventoryManagerOpen] = useState(false);
  const [testimonialsManagerOpen, setTestimonialsManagerOpen] = useState(false);
  const [featuredProductsManagerOpen, setFeaturedProductsManagerOpen] = useState(false);
  const [socialMediaManagerOpen, setSocialMediaManagerOpen] = useState(false);
  const [popupHeroManagerOpen, setPopupHeroManagerOpen] = useState(false);
  const [stripeBalanceOpen, setStripeBalanceOpen] = useState(false);
  const [salesReportOpen, setSalesReportOpen] = useState(false);
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current'); // Added period selector
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Added month selector
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Added year selector
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFont, setSelectedFont] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
        navigate('/'); // Redirigir a home si no está autenticado
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Cargar usuarios cuando se abre el modal de gestión
  useEffect(() => {
    if (userManagementOpen) {
      loadRegisteredUsers();
    }
  }, [userManagementOpen]);


  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const generateExcelReport = () => {
    // Crear el workbook
    const workbook = XLSX.utils.book_new();
    
    // Datos del encabezado de la empresa
    const headerData = [
      ['DELIZUKAR - REPORTE DE VENTAS'],
      [''],
      ['Empresa: Delizukar'],
      ['Dirección: Tu dirección aquí'],
      ['Teléfono: +1 (555) 123-4567'],
      ['Email: info@delizukar.com'],
      [''],
      [`Fecha del Reporte: ${new Date().toLocaleDateString('es-ES')}`],
      [`Período: ${getPeriodDescription()}`],
      [''],
      [''],
    ];

    // Datos de métricas
    const metricsData = [
      ['MÉTRICAS GENERALES'],
      [''],
      ['Concepto', 'Valor'],
      ['Ingresos Totales', '$0.00'],
      ['Órdenes Totales', '0'],
      ['Promedio por Orden', '$0.00'],
      ['Productos Vendidos', '0'],
      [''],
      ['RESUMEN POR PERÍODO'],
      [''],
      ['Período', 'Ingresos'],
      ['Esta Semana', '$0.00'],
      ['Este Mes', '$0.00'],
      ['Este Año', '$0.00'],
      [''],
      ['ÓRDENES RECIENTES'],
      [''],
      ['ID', 'Fecha', 'Cliente', 'Total', 'Estado'],
      ['-', '-', '-', '-', '-'],
      [''],
      ['PRODUCTOS MÁS VENDIDOS'],
      [''],
      ['Producto', 'Cantidad', 'Ingresos'],
      ['-', '-', '-'],
    ];

    // Combinar todos los datos
    const allData = [...headerData, ...metricsData];

    // Crear la hoja de trabajo
    const worksheet = XLSX.utils.aoa_to_sheet(allData);

    // Configurar estilos y anchos de columna
    const colWidths = [
      { wch: 20 }, // Columna A
      { wch: 15 }, // Columna B
      { wch: 15 }, // Columna C
      { wch: 15 }, // Columna D
      { wch: 15 }, // Columna E
    ];
    worksheet['!cols'] = colWidths;

    // Agregar la hoja al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte de Ventas');

    // Generar el archivo Excel
    const fileName = `Reporte_Ventas_${getPeriodDescription().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const getPeriodDescription = () => {
    switch (selectedPeriod) {
      case 'current':
        return 'Período Actual';
      case 'custom':
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${monthNames[selectedMonth - 1]} ${selectedYear}`;
      case 'last30':
        return 'Últimos 30 días';
      case 'last90':
        return 'Últimos 90 días';
      case 'year':
        return `Año ${selectedYear}`;
      default:
        return 'Período Actual';
    }
  };

  const loadRegisteredUsers = async () => {
    try {
      setLoadingUsers(true);
      console.log('Cargando usuarios registrados...');
      
      const usersRef = collection(db, 'registeredUsers');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setRegisteredUsers(users);
      console.log('✅ Usuarios cargados:', users.length);
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const saveUserToFirestore = async (userData) => {
    try {
      const usersRef = collection(db, 'registeredUsers');
      await addDoc(usersRef, {
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: 'user', // Default role
        status: 'active'
      });
      console.log('✅ Usuario guardado en Firestore');
    } catch (error) {
      console.error('❌ Error guardando usuario:', error);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const userRef = doc(db, 'registeredUsers', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Rol de usuario actualizado:', newRole);
      
      // Recargar la lista de usuarios
      loadRegisteredUsers();
    } catch (error) {
      console.error('❌ Error actualizando rol:', error);
    }
  };

  const makeDeveloper = async () => {
    try {
      // Buscar el usuario por email
      const usersRef = collection(db, 'registeredUsers');
      const q = query(usersRef, where('email', '==', 'ueservicesllc1@gmail.com'));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await updateUserRole(userDoc.id, 'developer');
        console.log('✅ Usuario ueservicesllc1@gmail.com ahora es desarrollador');
      } else {
        console.log('❌ Usuario ueservicesllc1@gmail.com no encontrado');
      }
    } catch (error) {
      console.error('❌ Error asignando rol de desarrollador:', error);
    }
  };

  const generatePDFReport = () => {
    // Crear un elemento temporal para el reporte
    const reportElement = document.createElement('div');
    reportElement.style.cssText = `
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      background: white;
      font-family: Arial, sans-serif;
      color: #333;
      line-height: 1.4;
    `;

    // Generar el HTML del reporte
    reportElement.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #c8626d; padding-bottom: 20px;">
        <h1 style="color: #c8626d; margin: 0; font-size: 28px; font-weight: bold;">DELIZUKAR</h1>
        <h2 style="color: #8B4513; margin: 10px 0; font-size: 20px; font-weight: 600;">REPORTE FINANCIERO DE VENTAS</h2>
        <div style="margin-top: 15px;">
          <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Empresa:</strong> Delizukar S.A.</p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Dirección:</strong> Av. Principal 123, Ciudad, País</p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Teléfono:</strong> +1 (555) 123-4567 | <strong>Email:</strong> info@delizukar.com</p>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 30px; background: #f8f9fa; padding: 15px; border-radius: 8px;">
        <div>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Fecha del Reporte:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Período:</strong> ${getPeriodDescription()}</p>
        </div>
        <div>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Generado por:</strong> ${user?.displayName || 'Administrador'}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Usuario:</strong> ${user?.email || 'admin@delizukar.com'}</p>
        </div>
      </div>

      <div style="margin-bottom: 25px;">
        <h3 style="color: #c8626d; border-bottom: 2px solid #c8626d; padding-bottom: 8px; margin-bottom: 15px; font-size: 16px;">📊 MÉTRICAS FINANCIERAS</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div style="background: #c8626d; color: white; padding: 12px; border-radius: 6px; text-align: center;">
            <h4 style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600;">INGRESOS TOTALES</h4>
            <p style="margin: 0; font-size: 18px; font-weight: bold;">$0.00</p>
          </div>
          <div style="background: #8B4513; color: white; padding: 12px; border-radius: 6px; text-align: center;">
            <h4 style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600;">ÓRDENES TOTALES</h4>
            <p style="margin: 0; font-size: 18px; font-weight: bold;">0</p>
          </div>
          <div style="background: #be8782; color: white; padding: 12px; border-radius: 6px; text-align: center;">
            <h4 style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600;">PROMEDIO POR ORDEN</h4>
            <p style="margin: 0; font-size: 18px; font-weight: bold;">$0.00</p>
          </div>
          <div style="background: #A0522D; color: white; padding: 12px; border-radius: 6px; text-align: center;">
            <h4 style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600;">PRODUCTOS VENDIDOS</h4>
            <p style="margin: 0; font-size: 18px; font-weight: bold;">0</p>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 25px;">
        <h3 style="color: #c8626d; border-bottom: 2px solid #c8626d; padding-bottom: 8px; margin-bottom: 15px; font-size: 16px;">📅 RESUMEN POR PERÍODO</h3>
        <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #ddd;">
          <thead>
            <tr style="background: #c8626d; color: white;">
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd; font-size: 12px;">Período</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd; font-size: 12px;">Ingresos</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd; font-size: 12px;">Órdenes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: 600; font-size: 11px;">Esta Semana</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #c8626d; font-weight: bold; font-size: 11px;">$0.00</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #8B4513; font-weight: bold; font-size: 11px;">0</td>
            </tr>
            <tr style="background: #f8f9fa;">
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: 600; font-size: 11px;">Este Mes</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #c8626d; font-weight: bold; font-size: 11px;">$0.00</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #8B4513; font-weight: bold; font-size: 11px;">0</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: 600; font-size: 11px;">Este Año</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #c8626d; font-weight: bold; font-size: 11px;">$0.00</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #8B4513; font-weight: bold; font-size: 11px;">0</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="margin-bottom: 25px;">
        <h3 style="color: #c8626d; border-bottom: 2px solid #c8626d; padding-bottom: 8px; margin-bottom: 15px; font-size: 16px;">🛒 ÓRDENES RECIENTES</h3>
        <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #ddd;">
          <thead>
            <tr style="background: #8B4513; color: white;">
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">ID</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Fecha</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Cliente</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Total</th>
              <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; text-align: center; color: #666;">-</td>
              <td style="padding: 12px; border: 1px solid #ddd; color: #666;">-</td>
              <td style="padding: 12px; border: 1px solid #ddd; color: #666;">-</td>
              <td style="padding: 12px; border: 1px solid #ddd; text-align: right; color: #666;">-</td>
              <td style="padding: 12px; border: 1px solid #ddd; text-align: center; color: #666;">-</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="margin-bottom: 25px;">
        <h3 style="color: #c8626d; border-bottom: 2px solid #c8626d; padding-bottom: 8px; margin-bottom: 15px; font-size: 16px;">🏆 PRODUCTOS MÁS VENDIDOS</h3>
        <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #ddd;">
          <thead>
            <tr style="background: #be8782; color: white;">
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Producto</th>
              <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Cantidad</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Ingresos</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; color: #666;">-</td>
              <td style="padding: 12px; border: 1px solid #ddd; text-align: center; color: #666;">-</td>
              <td style="padding: 12px; border: 1px solid #ddd; text-align: right; color: #666;">-</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #c8626d; text-align: center; color: #666; font-size: 12px;">
        <p style="margin: 5px 0;"><strong>Reporte generado automáticamente por Delizukar</strong></p>
        <p style="margin: 5px 0;">Este documento es confidencial y está destinado únicamente para uso interno.</p>
        <p style="margin: 5px 0;">Fecha de generación: ${new Date().toLocaleString('es-ES')}</p>
      </div>
    `;

    // Agregar al DOM temporalmente
    document.body.appendChild(reportElement);

    // Generar PDF
    html2canvas(reportElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Guardar el PDF
      const fileName = `Reporte_Financiero_Delizukar_${getPeriodDescription().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      // Limpiar
      document.body.removeChild(reportElement);
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LinearProgress sx={{ width: '200px' }} />
      </Box>
    );
  }

  if (!user) {
    return null; // Se redirigirá automáticamente
  }

  // Datos vacíos para el dashboard
  const stats = [
    {
      title: 'Ventas Totales',
      value: '$0',
      change: '0%',
      trend: 'up',
      icon: <AttachMoney sx={{ fontSize: '2rem', color: '#4CAF50' }} />,
      color: '#4CAF50'
    },
    {
      title: 'Pedidos',
      value: '0',
      change: '0%',
      trend: 'up',
      icon: <ShoppingCart sx={{ fontSize: '2rem', color: '#2196F3' }} />,
      color: '#2196F3'
    },
    {
      title: 'Clientes',
      value: '0',
      change: '0%',
      trend: 'up',
      icon: <People sx={{ fontSize: '2rem', color: '#FF9800' }} />,
      color: '#FF9800'
    },
    {
      title: 'Productos',
      value: '0',
      change: '0%',
      trend: 'up',
      icon: <Inventory sx={{ fontSize: '2rem', color: '#9C27B0' }} />,
      color: '#9C27B0'
    }
  ];

  const recentOrders = [];

  const topProducts = [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Entregado':
        return '#4CAF50';
      case 'Enviado':
        return '#2196F3';
      case 'Procesando':
        return '#FF9800';
      default:
        return '#666';
    }
  };


  // (hook duplicado eliminado; ya existe arriba antes de los returns)

  return (
    <Box sx={{ py: 4, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Container maxWidth="xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 800,
                      color: '#eb8b8b',
                      fontSize: { xs: '2rem', md: '3rem' },
                      fontFamily: 'Playfair Display, serif'
                    }}
                  >
                    Panel de Administración
                  </Typography>
              <Typography
                variant="h6"
                sx={{ color: '#eb8b8b' }}
              >
                Bienvenido de vuelta, Administrador
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                {user.email}
              </Typography>
              <Button
                onClick={handleSignOut}
                variant="outlined"
                sx={{
                  borderColor: '#8B4513',
                  color: '#8B4513',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: '#8B451320',
                    borderColor: '#8B4513'
                  }
                }}
              >
                Cerrar Sesión
              </Button>
            </Box>
          </Box>
        </motion.div>


        {/* Cuadrícula de botones 4x4 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ mt: 12, pt: 6 }}>
            <Grid container spacing={0} sx={{ maxWidth: '1000px', mx: 'auto' }}>
              {Array.from({ length: 16 }, (_, index) => {
                const colors = [
                  '#8B4513', '#be8782', '#A0522D', '#D2B48C',
                  '#CD853F', '#DEB887', '#F4A460', '#D2691E',
                  '#BC8F8F', '#F5DEB3', '#DDA0DD', '#98FB98',
                  '#F0E68C', '#FFB6C1', '#87CEEB', '#FFA07A'
                ];
                const color = colors[index];
                
                return (
                  <Grid item xs={3} key={index}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                            onClick={
                              index === 15 ? () => setFontManagerOpen(true) :
                              index === 0 ? () => setProductsManagerOpen(true) :
                              index === 1 ? () => setBannerPhotoManagerOpen(true) :
                              index === 2 ? () => setBanner2PhotoManagerOpen(true) :
                              index === 3 ? () => setInventoryManagerOpen(true) :
                              index === 4 ? () => setPagesManagerOpen(true) :
                              index === 5 ? () => setTestimonialsManagerOpen(true) :
                              index === 6 ? () => setFeaturedProductsManagerOpen(true) :
                              index === 7 ? () => setSocialMediaManagerOpen(true) :
                              index === 8 ? () => setPopupHeroManagerOpen(true) :
                              index === 9 ? () => setStripeBalanceOpen(true) :
                              index === 10 ? () => setSalesReportOpen(true) :
                              index === 11 ? () => setUserManagementOpen(true) :
                              index === 12 ? () => setMinProductsManagerOpen(true) :
                              undefined
                            }
                        sx={{
                          width: '250px',
                          height: '120px',
                          backgroundColor: color,
                          borderRadius: 0,
                          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                          '&:hover': {
                            backgroundColor: color,
                            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                            transform: 'translateY(-2px)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                            {index === 7 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <Share sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Redes Sociales
                                </Typography>
                              </Box>
                            ) : index === 8 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <LocalOffer sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Popup Hero
                                </Typography>
                              </Box>
                            ) : index === 9 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <AttachMoney sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Balance Stripe
                                </Typography>
                              </Box>
                            ) : index === 10 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <Assessment sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Reporte de Ventas
                                </Typography>
                              </Box>
                            ) : index === 11 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <Group sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Gestión de Usuarios
                                </Typography>
                              </Box>
                            ) : index === 15 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <FontDownload sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Fuentes
                                </Typography>
                              </Box>
                            ) : index === 0 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <Inventory sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0,0.5)'
                                  }}
                                >
                                  Productos
                                </Typography>
                              </Box>
                            ) : index === 1 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <PhotoCamera sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Banner
                                </Typography>
                              </Box>
                            ) : index === 2 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <PhotoCamera sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Banner 2
                                </Typography>
                              </Box>
                            ) : index === 3 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <Inventory sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Inventario
                                </Typography>
                              </Box>
                            ) : index === 4 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Páginas
                                </Typography>
                              </Box>
                            ) : index === 5 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <Person sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Testimonios
                                </Typography>
                              </Box>
                            ) : index === 6 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <Star sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Productos Destacados
                                </Typography>
                              </Box>
                            ) : index === 12 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <ShoppingCart sx={{ color: 'white', fontSize: '2rem' }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                >
                                  Min. Productos
                                </Typography>
                              </Box>
                            ) : (
                          <Typography
                            variant="h6"
                            sx={{
                              color: 'white',
                              fontWeight: 700,
                              textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                            }}
                          >
                            {index + 1}
                          </Typography>
                        )}
                      </Button>
                    </motion.div>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </motion.div>
      </Container>

      {/* Gestor de Fuentes */}
      <FontManager
        open={fontManagerOpen}
        onClose={() => setFontManagerOpen(false)}
        onFontSelect={(font) => {
          setSelectedFont(font);
          console.log('Fuente seleccionada:', font);
        }}
      />

          {/* Gestor de Fotos del Banner */}
          <BannerPhotoManager
            open={bannerPhotoManagerOpen}
            onClose={() => setBannerPhotoManagerOpen(false)}
          />

          {/* Gestor de Fotos del Banner 2 */}
          <Banner2PhotoManager
            open={banner2PhotoManagerOpen}
            onClose={() => setBanner2PhotoManagerOpen(false)}
          />

          {/* Gestor de Páginas */}
          <PagesManager
            open={pagesManagerOpen}
            onClose={() => setPagesManagerOpen(false)}
          />

          {/* Gestor de Mínimo de Productos */}
          <MinProductsManager
            open={minProductsManagerOpen}
            onClose={() => setMinProductsManagerOpen(false)}
          />

          {/* Gestor de Productos */}
          <ProductsManager
            open={productsManagerOpen}
            onClose={() => setProductsManagerOpen(false)}
          />

          {/* Gestor de Inventario */}
          <InventoryManager
            open={inventoryManagerOpen}
            onClose={() => setInventoryManagerOpen(false)}
          />

          {/* Gestor de Testimonios */}
        <TestimonialsManager
          open={testimonialsManagerOpen}
          onClose={() => setTestimonialsManagerOpen(false)}
        />
        <FeaturedProductsManager
          open={featuredProductsManagerOpen}
          onClose={() => setFeaturedProductsManagerOpen(false)}
        />

        {/* Gestor de Redes Sociales */}
        <SocialMediaManager
          open={socialMediaManagerOpen}
          onClose={() => setSocialMediaManagerOpen(false)}
        />

        {/* Gestor de Popup Hero */}
        <PopupHeroManager
          open={popupHeroManagerOpen}
          onClose={() => setPopupHeroManagerOpen(false)}
        />

        <StripeBalance
          open={stripeBalanceOpen}
          onClose={() => setStripeBalanceOpen(false)}
        />

        {/* Reporte de Ventas */}
        <Dialog
          open={salesReportOpen}
          onClose={() => setSalesReportOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }
          }}
        >
          <DialogTitle sx={{ 
            backgroundColor: '#c8626d', 
            color: 'white', 
            textAlign: 'center',
            py: 2,
            position: 'relative'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Assessment sx={{ fontSize: 24, color: 'white' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                Reporte de Ventas
              </Typography>
            </Box>
            <IconButton
              onClick={() => setSalesReportOpen(false)}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ p: 3, backgroundColor: '#fafafa' }}>
            {/* Selector de Período */}
            <Box sx={{ mb: 3, p: 2, backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#c8626d', fontWeight: 600, textAlign: 'center' }}>
                📅 Seleccionar Período
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Período</InputLabel>
                    <Select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      label="Período"
                    >
                      <MenuItem value="current">Actual</MenuItem>
                      <MenuItem value="custom">Personalizado</MenuItem>
                      <MenuItem value="last30">Últimos 30 días</MenuItem>
                      <MenuItem value="last90">Últimos 90 días</MenuItem>
                      <MenuItem value="year">Año completo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {selectedPeriod === 'custom' && (
                  <>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Mes</InputLabel>
                        <Select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          label="Mes"
                        >
                          <MenuItem value={1}>Enero</MenuItem>
                          <MenuItem value={2}>Febrero</MenuItem>
                          <MenuItem value={3}>Marzo</MenuItem>
                          <MenuItem value={4}>Abril</MenuItem>
                          <MenuItem value={5}>Mayo</MenuItem>
                          <MenuItem value={6}>Junio</MenuItem>
                          <MenuItem value={7}>Julio</MenuItem>
                          <MenuItem value={8}>Agosto</MenuItem>
                          <MenuItem value={9}>Septiembre</MenuItem>
                          <MenuItem value={10}>Octubre</MenuItem>
                          <MenuItem value={11}>Noviembre</MenuItem>
                          <MenuItem value={12}>Diciembre</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Año"
                        type="number"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        inputProps={{ min: 2020, max: 2030 }}
                      />
                    </Grid>
                  </>
                )}
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{
                      backgroundColor: '#c8626d',
                      '&:hover': { backgroundColor: '#b8555a' },
                      width: '100%'
                    }}
                  >
                    Aplicar Filtro
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={generateExcelReport}
                    sx={{
                      borderColor: '#c8626d',
                      color: '#c8626d',
                      '&:hover': { 
                        backgroundColor: '#c8626d',
                        color: 'white'
                      },
                      width: '100%'
                    }}
                  >
                    📊 Generar Excel
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={generatePDFReport}
                    sx={{
                      borderColor: '#8B4513',
                      color: '#8B4513',
                      '&:hover': { 
                        backgroundColor: '#8B4513',
                        color: 'white'
                      },
                      width: '100%'
                    }}
                  >
                    📄 Generar PDF
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <Grid container spacing={2}>
              {/* Métricas Principales */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ 
                  mb: 2, 
                  color: '#c8626d', 
                  fontWeight: 600, 
                  textAlign: 'center'
                }}>
                  Métricas Generales
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ 
                      p: 2, 
                      backgroundColor: '#c8626d', 
                      color: 'white',
                      textAlign: 'center',
                      borderRadius: '8px'
                    }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                        $0.00
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        Ingresos
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ 
                      p: 2, 
                      backgroundColor: '#be8782', 
                      color: 'white',
                      textAlign: 'center',
                      borderRadius: '8px'
                    }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                        0
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        Órdenes
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ 
                      p: 2, 
                      backgroundColor: '#A0522D', 
                      color: 'white',
                      textAlign: 'center',
                      borderRadius: '8px'
                    }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                        $0.00
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        Promedio
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ 
                      p: 2, 
                      backgroundColor: '#D2B48C', 
                      color: 'white',
                      textAlign: 'center',
                      borderRadius: '8px'
                    }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                        0
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        Productos
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>

              {/* Órdenes Recientes */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ 
                  mb: 2, 
                  color: '#c8626d', 
                  fontWeight: 600, 
                  textAlign: 'center'
                }}>
                  Órdenes Recientes
                </Typography>
                <Card sx={{ 
                  p: 2, 
                  backgroundColor: 'white', 
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}>
                  <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', py: 2 }}>
                    No hay órdenes registradas aún
                  </Typography>
                </Card>
              </Grid>

              {/* Productos Más Vendidos */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ 
                  mb: 2, 
                  color: '#c8626d', 
                  fontWeight: 600, 
                  textAlign: 'center'
                }}>
                  Productos Más Vendidos
                </Typography>
                <Card sx={{ 
                  p: 2, 
                  backgroundColor: 'white', 
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}>
                  <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', py: 2 }}>
                    No hay datos de ventas aún
                  </Typography>
                </Card>
              </Grid>

              {/* Resumen por Período */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ 
                  mb: 2, 
                  color: '#c8626d', 
                  fontWeight: 600, 
                  textAlign: 'center'
                }}>
                  Resumen por Período
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Card sx={{ 
                      p: 2, 
                      backgroundColor: '#c8626d', 
                      color: 'white',
                      textAlign: 'center',
                      borderRadius: '8px'
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                        $0.00
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        Esta Semana
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={4}>
                    <Card sx={{ 
                      p: 2, 
                      backgroundColor: '#be8782', 
                      color: 'white',
                      textAlign: 'center',
                      borderRadius: '8px'
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                        $0.00
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        Este Mes
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={4}>
                    <Card sx={{ 
                      p: 2, 
                      backgroundColor: '#A0522D', 
                      color: 'white',
                      textAlign: 'center',
                      borderRadius: '8px'
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                        $0.00
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        Este Año
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </DialogContent>
        </Dialog>

        {/* Gestión de Usuarios */}
        <Dialog
          open={userManagementOpen}
          onClose={() => setUserManagementOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              minHeight: '80vh',
              maxHeight: '90vh'
            }
          }}
        >
          <DialogTitle sx={{ 
            backgroundColor: '#C8626D', 
            color: 'white', 
            py: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Group sx={{ fontSize: 24, color: 'white' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                  Gestión de Usuarios
                </Typography>
              </Box>
              <IconButton
                onClick={() => setUserManagementOpen(false)}
                sx={{
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ p: 3, backgroundColor: '#fafafa' }}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#C8626D', fontWeight: 600 }}>
                  Usuarios Registrados ({registeredUsers.length})
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={makeDeveloper}
                  sx={{
                    borderColor: '#C8626D',
                    color: '#C8626D',
                    fontSize: '0.8rem',
                    py: 0.5,
                    px: 1.5,
                    '&:hover': {
                      backgroundColor: '#C8626D',
                      color: 'white',
                      borderColor: '#C8626D'
                    }
                  }}
                >
                  Hacer Desarrollador
                </Button>
              </Box>
              
              {loadingUsers ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: '#C8626D' }} />
                </Box>
              ) : registeredUsers.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <AdminPanelSettings sx={{ fontSize: 64, color: '#C8626D', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#C8626D', mb: 2, fontWeight: 600 }}>
                    No hay usuarios registrados
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666' }}>
                    Los usuarios aparecerán aquí cuando se registren con Google.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  overflow: 'hidden'
                }}>
                  <Box sx={{ 
                    backgroundColor: '#C8626D', 
                    color: 'white', 
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Lista de Usuarios
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {registeredUsers.length} usuario{registeredUsers.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ overflowX: 'auto' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      minWidth: '600px'
                    }}>
                      {/* Header */}
                      <Box sx={{ 
                        display: 'flex', 
                        backgroundColor: '#f5f5f5',
                        borderBottom: '1px solid #e0e0e0',
                        fontWeight: 600,
                        color: '#C8626D'
                      }}>
                        <Box sx={{ flex: '0 0 60px', p: 2, textAlign: 'center' }}>Avatar</Box>
                        <Box sx={{ flex: '1 1 200px', p: 2 }}>Nombre</Box>
                        <Box sx={{ flex: '1 1 250px', p: 2 }}>Email</Box>
                        <Box sx={{ flex: '0 0 100px', p: 2, textAlign: 'center' }}>Rol</Box>
                        <Box sx={{ flex: '0 0 100px', p: 2, textAlign: 'center' }}>Estado</Box>
                        <Box sx={{ flex: '0 0 120px', p: 2, textAlign: 'center' }}>Registrado</Box>
                      </Box>
                      
                      {/* Rows */}
                      {registeredUsers.map((user, index) => (
                        <Box 
                          key={user.id}
                          sx={{ 
                            display: 'flex', 
                            borderBottom: index < registeredUsers.length - 1 ? '1px solid #f0f0f0' : 'none',
                            '&:hover': {
                              backgroundColor: '#f9f9f9'
                            }
                          }}
                        >
                          <Box sx={{ flex: '0 0 60px', p: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Avatar
                              src={user.photoURL}
                              alt={user.displayName}
                              sx={{ width: 32, height: 32 }}
                            />
                          </Box>
                          <Box sx={{ flex: '1 1 200px', p: 2, display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#C8626D' }}>
                              {user.displayName}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: '1 1 250px', p: 2, display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                              {user.email}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: '0 0 100px', p: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.8rem' }}>
                              {user.role || 'user'}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: '0 0 100px', p: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Chip 
                              label={user.status || 'active'} 
                              size="small"
                              color={user.status === 'active' ? 'success' : 'default'}
                              sx={{ fontSize: '0.7rem', height: '20px' }}
                            />
                          </Box>
                          <Box sx={{ flex: '0 0 120px', p: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#999', fontSize: '0.8rem' }}>
                              {new Date(user.createdAt).toLocaleDateString('es-ES')}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          </DialogContent>
        </Dialog>

        </Box>
      );
    };

    export default AdminDashboard;
