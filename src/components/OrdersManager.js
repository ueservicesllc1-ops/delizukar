import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Alert,
  TextField,
  Tabs,
  Tab,
  Grid
} from '@mui/material';
import {
  Close,
  Print,
  GetApp,
  LocalShipping,
  CheckCircle,
  Pending,
  Email,
  Receipt,
  Visibility,
  Info,
  PictureAsPdf,
  FileDownload
} from '@mui/icons-material';
import { collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import emailjs from '@emailjs/browser';
import ShippoShippingElements from './ShippoShippingElements';
import jsPDF from 'jspdf';
import shippoService from '../services/shippoService';

const OrdersManager = ({ open, onClose, initialTab = 'all' }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [creatingForOrderId, setCreatingForOrderId] = useState(null);
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [labelData, setLabelData] = useState(null);
  const [labelVerticalPdfUrl, setLabelVerticalPdfUrl] = useState(null);
  const [testEmailDialog, setTestEmailDialog] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [addressDetailsDialog, setAddressDetailsDialog] = useState(false);
  const [addressDetails, setAddressDetails] = useState(null);
  const [shippoElementsOpen, setShippoElementsOpen] = useState(false);
  const [orderDetailsDialog, setOrderDetailsDialog] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [shippoOrderData, setShippoOrderData] = useState(null);
  const [currentTab, setCurrentTab] = useState(initialTab);

  useEffect(() => {
    if (open) {
      loadOrders();
      setCurrentTab(initialTab);
    }
  }, [open, initialTab]);

  // Inicializar EmailJS
  useEffect(() => {
    const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
    if (publicKey) {
      emailjs.init({
        publicKey: publicKey
      });
      console.log('✅ EmailJS inicializado con publicKey');
    } else {
      console.warn('⚠️ REACT_APP_EMAILJS_PUBLIC_KEY no está configurada');
    }
  }, []);

  // Generar PDF vertical cuando se abre el diálogo con una etiqueta
  useEffect(() => {
    const generateVerticalPdf = async () => {
      if (!labelDialogOpen || !labelData?.postage_label?.label_url || labelData?.pendingPayment) {
        setLabelVerticalPdfUrl(null);
        return;
      }

      try {
        // Importar pdfjs-dist dinámicamente
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

        // Descargar el PDF a través del backend para evitar problemas de CORS
        // En desarrollo usa directamente localhost:5000, en producción usa window.location.origin
        const baseURL = process.env.NODE_ENV === 'production' 
          ? window.location.origin 
          : 'http://localhost:5000'; // Usa directamente el backend en desarrollo
        const proxyUrl = `${baseURL}/api/easypost/label-pdf?url=${encodeURIComponent(labelData.postage_label.label_url)}`;
        
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf'
          }
        });
        
        if (!response.ok) {
          throw new Error('Error al descargar el PDF');
        }

        const arrayBuffer = await response.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;

        // Crear un canvas temporal para renderizar cada página
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Crear nuevo PDF en formato vertical (portrait)
        const outputPdf = new jsPDF('p', 'mm', 'a4');
        
        const pdfWidth = 210; // Ancho A4 en mm (vertical)
        const pdfHeight = 297; // Alto A4 en mm (vertical)

        // Renderizar cada página del PDF original
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2.0 });
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({
            canvasContext: ctx,
            viewport: viewport
          }).promise;

          const imgData = canvas.toDataURL('image/png', 1.0);
          const isLandscape = viewport.width > viewport.height;
          let imgWidth, imgHeight;
          
          if (isLandscape) {
            imgHeight = pdfWidth;
            imgWidth = (viewport.width * pdfWidth) / viewport.height;
            
            if (imgWidth > pdfHeight) {
              imgWidth = pdfHeight;
              imgHeight = (viewport.height * pdfHeight) / viewport.width;
            }
            
            const tempWidth = imgWidth;
            imgWidth = imgHeight;
            imgHeight = tempWidth;
          } else {
            imgWidth = pdfWidth;
            imgHeight = (viewport.height * pdfWidth) / viewport.width;
            
            if (imgHeight > pdfHeight) {
              imgHeight = pdfHeight;
              imgWidth = (viewport.width * pdfHeight) / viewport.height;
            }
          }
          
          if (pageNum > 1) {
            outputPdf.addPage();
          }
          
          const x = (pdfWidth - imgWidth) / 2;
          const y = (pdfHeight - imgHeight) / 2;
          
          if (isLandscape) {
            outputPdf.saveGraphicsState();
            outputPdf.translate(pdfWidth / 2, pdfHeight / 2);
            outputPdf.rotate(90 * Math.PI / 180);
            outputPdf.addImage(imgData, 'PNG', -imgHeight / 2, -imgWidth / 2, imgHeight, imgWidth);
            outputPdf.restoreGraphicsState();
          } else {
            outputPdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
          }
        }

        // Generar blob del PDF vertical
        const pdfBlob = outputPdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setLabelVerticalPdfUrl(pdfUrl);
      } catch (error) {
        console.error('Error al generar PDF vertical para vista previa:', error);
        setLabelVerticalPdfUrl(null);
      }
    };

    generateVerticalPdf();

    // Limpiar URL cuando se cierra el diálogo
    return () => {
      if (labelVerticalPdfUrl) {
        URL.revokeObjectURL(labelVerticalPdfUrl);
      }
    };
  }, [labelDialogOpen, labelData?.postage_label?.label_url, labelData?.pendingPayment]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const ordersRef = collection(db, 'orders');
      
      // Primero obtener todos los pedidos
      const allOrdersSnapshot = await getDocs(ordersRef);
      
      // Filtrar solo los pagados
      const paidOrders = [];
      const allOrders = [];
      allOrdersSnapshot.forEach((docSnap) => {
        const orderData = docSnap.data();
        allOrders.push({ id: docSnap.id, ...orderData });
        console.log(`📋 Pedido ${docSnap.id}:`, {
          paymentStatus: orderData.paymentStatus,
          status: orderData.status,
          total: orderData.total,
          customerEmail: orderData.customerInfo?.email,
          createdAt: orderData.createdAt
        });
        
        if (orderData.paymentStatus === 'paid') {
          paidOrders.push({
            id: docSnap.id,
            ...orderData
          });
          console.log(`✅ Pedido ${docSnap.id} agregado (paymentStatus = paid)`);
        } else {
          // Eliminar pedidos de prueba (no pagados)
          console.log(`🗑️ Eliminando pedido de prueba: ${docSnap.id} (paymentStatus = ${orderData.paymentStatus})`);
          deleteDoc(doc(db, 'orders', docSnap.id)).catch(err => {
            console.error(`❌ Error eliminando pedido ${docSnap.id}:`, err);
          });
        }
      });
      
      console.log(`📊 Resumen: ${allOrders.length} pedidos totales, ${paidOrders.length} pedidos pagados`);
      
      // Ordenar por fecha descendente
      paidOrders.sort((a, b) => {
        const aDate = a.createdAt?.seconds || 0;
        const bDate = b.createdAt?.seconds || 0;
        return bDate - aDate;
      });
      
      console.log(`📦 Cargados ${paidOrders.length} pedidos pagados`);
      setOrders(paidOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      alert('Por favor ingresa un email válido');
      return;
    }

    try {
      setSendingTestEmail(true);
      
      // 1. Obtener datos del email del backend
      const baseUrl = process.env.NODE_ENV === 'production' ? window.location.origin : '';
      const response = await fetch(`${baseUrl}/api/send-test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testEmail
        })
      });

      const result = await response.json();

      if (response.ok && result.success && result.emailData) {
        // 2. Enviar email con EmailJS
        const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_7biylnb';
        const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_poovxvk';
        const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
        
        if (!publicKey) {
          throw new Error('REACT_APP_EMAILJS_PUBLIC_KEY no está configurada');
        }
        
        await emailjs.send(
          serviceId,
          templateId,
          {
            to_email: result.emailData.to_email,
            to_name: result.emailData.to_name,
            order_id: result.emailData.order_id,
            tracking_code: result.emailData.tracking_code,
            tracking_url: result.emailData.tracking_url,
            label_url: result.emailData.label_url
          },
          {
            publicKey: publicKey
          }
        );
        
        alert('✅ Email de prueba enviado exitosamente a ' + testEmail);
        setTestEmailDialog(false);
        setTestEmail('');
      } else {
        alert('❌ Error al enviar email: ' + (result.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error enviando email de prueba:', error);
      alert('❌ Error al enviar email: ' + error.message);
    } finally {
      setSendingTestEmail(false);
    }
  };

  // Preparar datos del pedido para Shippo Shipping Elements
  // Formato según: https://docs.goshippo.com/docs/shippingelements/install/
  const prepareOrderDataForShippo = (order) => {
    const customerInfo = order.customerInfo || {};
    const address = customerInfo.address || {};
    const cartItems = order.cartItems || [];
    
    // Calcular peso total basado en los productos (100 gramos = 0.22 lb por galleta)
    const totalWeight = cartItems.reduce((total, item) => {
      return total + ((item.quantity || 1) * 0.22); // 0.22 lb por galleta (100g)
    }, 0);
    const finalWeight = Math.max(0.22, Math.round(totalWeight * 100) / 100); // Mínimo 0.22 lb (1 galleta), redondeado a 2 decimales
    
    // Calcular total del pedido
    const orderTotal = cartItems.reduce((total, item) => {
      return total + ((parseFloat(item.price) || 0) * (item.quantity || 1));
    }, 0);
    
    return {
      address_from: {
        name: 'Delizukar',
        street1: '123 Delizukar St',
        city: 'Miami',
        state: 'FL',
        zip: '33101',
        country: 'US',
        email: 'envios@delizukar.com',
        phone: ''
      },
      address_to: {
        name: `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim(),
        street1: address.line1 || '',
        city: address.city || '',
        state: address.state || '',
        zip: address.postal_code || '',
        country: address.country || 'US',
        email: customerInfo.email || '',
        phone: customerInfo.phone || ''
      },
      parcels: [{
        length: '10',
        width: '10',
        height: '10',
        distance_unit: 'in',
        weight: String(finalWeight),
        mass_unit: 'lb'
      }],
      cartItems: cartItems, // Incluir cartItems para que el widget use datos reales
      orderTotal: orderTotal, // Incluir total para referencia
      order_number: order.id || order.sessionId || undefined
    };
  };

  // Abrir widget de Shippo Shipping Elements
  const handleOpenShippoElements = (order) => {
    const orderData = prepareOrderDataForShippo(order);
    setShippoOrderData(orderData);
    setShippoElementsOpen(true);
  };

  // Callback cuando se cierra el widget de Shippo
  const handleShippoElementsClose = (labelData) => {
    setShippoElementsOpen(false);
    setShippoOrderData(null);
    
    if (labelData) {
      // Si se compró una etiqueta, actualizar el pedido
      console.log('✅ Etiqueta comprada desde EasyPost:', labelData);
      // Recargar órdenes para ver los cambios
      loadOrders();
    }
  };

  const [pirateShipDialogOpen, setPirateShipDialogOpen] = useState(false);
  const [pirateShipOrder, setPirateShipOrder] = useState(null);
  const [shippingRates, setShippingRates] = useState([]);
  const [loadingRates, setLoadingRates] = useState(false);

  // Calcular tarifas de envío para mostrar antes de exportar (USPS/UPS - las mismas que Pirate Ship)
  const calculateShippingRatesForPirateShip = async (order) => {
    try {
      setLoadingRates(true);
      setShippingRates([]);

      // Preparar datos del pedido para calcular tarifas
      const customerInfo = order.customerInfo || {};
      const address = customerInfo.address || {};
      const packageInfo = order.packageInfo || {};

      // Dirección de origen (tienda)
      const fromAddress = {
        name: 'Delizukar',
        street1: '123 Delizukar St',
        city: 'Miami',
        state: 'FL',
        zip: '33101',
        country: 'US'
      };

      // Dirección de destino (cliente)
      const toAddress = {
        name: `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim(),
        street1: address.line1 || address.street1 || customerInfo.street1 || address.address || '',
        city: address.city || customerInfo.city || '',
        state: address.state || customerInfo.state || '',
        zip: address.postal_code || address.zipCode || customerInfo.zipCode || customerInfo.zip || '',
        country: address.country || customerInfo.country || 'US'
      };

      // Peso y dimensiones
      const weight = {
        value: packageInfo.weight || 1,
        unit: packageInfo.weightUnit || 'lb'
      };

      const dimensions = {
        length: packageInfo.length || 8,
        width: packageInfo.width || 6,
        height: packageInfo.height || 4
      };

      // Obtener tarifas de USPS/UPS (las mismas que usa Pirate Ship)
      const baseUrl = process.env.NODE_ENV === 'production' ? window.location.origin : '';
      const response = await fetch(`${baseUrl}/api/pirateship/get-rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fromAddress,
          toAddress,
          weight,
          dimensions
        })
      });

      if (response.ok) {
        const data = await response.json();
        setShippingRates(data.rates || []);
        console.log('✅ Tarifas de USPS/UPS obtenidas:', data.rates);
      } else {
        throw new Error('Error al obtener tarifas');
      }
    } catch (error) {
      console.error('❌ Error calculando tarifas:', error);
      // Si falla, continuar sin tarifas
      setShippingRates([]);
    } finally {
      setLoadingRates(false);
    }
  };

  // Abrir diálogo de Pirate Ship con opciones de envío
  const handleOpenPirateShipDialog = async (order) => {
    setPirateShipOrder(order);
    setPirateShipDialogOpen(true);
    await calculateShippingRatesForPirateShip(order);
  };

  // Exportar pedido a Pirate Ship (CSV)
  const handleExportToPirateShip = async (order) => {
    try {
      console.log('🏴‍☠️ Exportando pedido a Pirate Ship:', order.id);
      
      const baseUrl = process.env.NODE_ENV === 'production' ? window.location.origin : '';
      const response = await fetch(`${baseUrl}/api/pirateship/export-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al exportar pedido');
      }

      // Descargar el CSV
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pirateship-export-${order.id}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setPirateShipDialogOpen(false);
      alert('✅ Pedido exportado a Pirate Ship. Descarga el CSV e impórtalo en Pirate Ship para ver las opciones de envío y generar la etiqueta.');
    } catch (error) {
      console.error('❌ Error exportando a Pirate Ship:', error);
      alert('❌ Error: ' + (error.message || 'Error al exportar pedido'));
    }
  };

  // Función para comprar etiqueta USPS manualmente
  const handleBuyUSPSLabel = async (order) => {
    if (!order || !order.customerInfo) {
      alert('El pedido no tiene información del cliente');
      return;
    }

    try {
      setCreatingLabel(true);
      setCreatingForOrderId(order.id);

      // Obtener el rate seleccionado del pedido o usar el más económico
      let selectedRate = null;
      if (order.shippingInfo && order.shippingInfo.rate) {
        selectedRate = order.shippingInfo.rate;
      } else {
        // Si no hay rate, usar USPS Ground Advantage por defecto
        selectedRate = {
          service: 'USPS_GROUND_ADVANTAGE',
          mailClass: 'USPS_GROUND_ADVANTAGE',
        };
      }

      const baseURL = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:5000';

      const response = await fetch(`${baseURL}/api/usps/create-label`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          order: order,
          selectedRate: selectedRate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert('Error: ' + (result.error || 'Error al comprar etiqueta USPS'));
        return;
      }

      // El endpoint devuelve { success: true, data: { trackingNumber, labelUrl, ... } }
      const labelInfo = result.data || result;

      // Etiqueta comprada exitosamente
      setLabelData({
        tracking_code: labelInfo.trackingNumber || labelInfo.trackingCode,
        id: order.id,
        postage_label: {
          label_url: labelInfo.labelUrl || labelInfo.label_url
        }
      });
      setLabelDialogOpen(true);

      // Actualizar el pedido en Firestore
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        status: 'shipped',
        trackingCode: labelInfo.trackingNumber || labelInfo.trackingCode,
        labelUrl: labelInfo.labelUrl || labelInfo.label_url,
        shippedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Recargar órdenes
      loadOrders();
      
      alert('✅ Etiqueta USPS comprada exitosamente');
    } catch (error) {
      console.error('Error comprando etiqueta USPS:', error);
      alert('Error al comprar etiqueta USPS: ' + error.message);
    } finally {
      setCreatingLabel(false);
      setCreatingForOrderId(null);
    }
  };

  const handleCreateShipment = async (order) => {
    // Prevenir múltiples clics
    if (creatingLabel || creatingForOrderId === order.id) {
      console.log('⏳ Ya se está creando un envío, esperando...');
      return;
    }
    
    setSelectedOrder(order);
    setCreatingLabel(true);
    setCreatingForOrderId(order.id);
    
    try {
      console.log('🚚 Creando envío para pedido:', order.id);
      console.log('🔵 [OrdersManager] Order data being sent:', JSON.stringify(order, null, 2));
      
      // Enviar datos completos del pedido al backend
      const baseUrl = process.env.NODE_ENV === 'production' ? window.location.origin : '';
      const response = await fetch(`${baseUrl}/api/create-shipment-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: order.id,
          order: order // Enviar el objeto completo del pedido
        })
      });

      console.log('🔵 [OrdersManager] Response status:', response.status);
      
      const result = await response.json();
      console.log('🔵 [OrdersManager] Response data:', result);

      // Si hay error, verificar si es error de método de pago
      if (!response.ok || !result.success) {
        console.log('❌ Error creando shipment:', result);
        console.log('🔍 Verificando si es error de método de pago...');
        console.log('   result.data:', result.data);
        console.log('   result.data?.pendingPayment:', result.data?.pendingPayment);
        console.log('   result.error:', result.error);
        console.log('   result.message:', result.message);
        
        // Si es error de método de pago, mostrar modal con información del shipment
        // Verificar tanto result.data.pendingPayment como el mensaje de error
        const errorText = (result.error || result.message || '').toLowerCase();
        const isPaymentMethodError = (result.data && result.data.pendingPayment) || 
                                     errorText.includes('payment method') || 
                                     errorText.includes('método de pago') ||
                                     errorText.includes('billing') ||
                                     errorText.includes('no se pudo procesar el pago') ||
                                     errorText.includes('transacción se creó pero no se obtuvo información') ||
                                     errorText.includes('you are required to have a valid payment method');
        
        console.log('🔍 isPaymentMethodError:', isPaymentMethodError);
        console.log('🔍 result.data?.shipmentId:', result.data?.shipmentId);
        
        // Si es error de método de pago Y tiene información del shipment, mostrar modal
        if (isPaymentMethodError && result.data && result.data.shipmentId) {
          console.log('⚠️ Shipment creado pero falló el pago por falta de método de pago');
          console.log('📋 Mostrando modal con información del shipment');
          
          setLabelData({
            id: order.id,
            shipmentId: result.data.shipmentId,
            rateId: result.data.rateId,
            easypostUrl: result.data.easypostUrl,
            carrier: result.data.carrier,
            service: result.data.service,
            shippingCost: result.data.shippingCost,
            pendingPayment: true,
            error: result.error || result.message || 'Error al pagar la etiqueta',
            message: result.message || 'No se pudo procesar el pago porque no hay un método de pago válido en EasyPost. Ve a EasyPost para agregar un método de pago y pagar la etiqueta manualmente.'
          });
          setLabelDialogOpen(true);
          
          // Guardar información del shipment en Firestore
          const orderRef = doc(db, 'orders', order.id);
          await updateDoc(orderRef, {
            easypostShipmentId: result.data.shipmentId,
            easypostRateId: result.data.rateId,
            easypostUrl: result.data.easypostUrl,
            selectedCarrier: result.data.carrier,
            selectedService: result.data.service,
            shippingCost: result.data.shippingCost,
            status: 'pending',
            updatedAt: new Date().toISOString()
          });
          
          return;
        }
        
        // Si no es error de método de pago, mostrar error genérico
        const errorMessage = result.message || result.error || 'Error al crear la etiqueta';
        console.error('❌ Error genérico (no es de método de pago):', errorMessage);
        alert('❌ Error: ' + errorMessage);
        return;
      }

      if (response.ok && result.success) {
        // Etiqueta pagada exitosamente
        setLabelData({
          tracking_code: result.data.trackingCode,
          id: result.data.orderId,
          postage_label: {
            label_url: result.data.labelUrl
          }
        });
        setLabelDialogOpen(true);
        
        // Enviar email con EmailJS si hay datos de email
        if (result.data.emailData) {
          try {
            const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_7biylnb';
            const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_poovxvk';
            const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
            
            if (!publicKey) {
              console.error('❌ REACT_APP_EMAILJS_PUBLIC_KEY no está configurada');
            } else {
              await emailjs.send(
                serviceId,
                templateId,
                result.data.emailData,
                {
                  publicKey: publicKey
                }
              );
              console.log('✅ Email enviado al cliente');
            }
          } catch (emailError) {
            console.error('❌ Error enviando email:', emailError);
            console.error('   Status:', emailError.status);
            console.error('   Text:', emailError.text);
          }
        }
        
        // Actualizar el estado del pedido en Firestore
        const orderRef = doc(db, 'orders', order.id);
        await updateDoc(orderRef, {
          status: 'shipped',
          trackingCode: result.data.trackingCode,
          labelUrl: result.data.labelUrl,
          shippedAt: new Date().toISOString(),
          emailSent: result.data.emailData ? true : false
        });
        
        // Recargar órdenes
        loadOrders();
      } else {
        alert(result.error || 'Error al crear la etiqueta de envío');
      }
    } catch (error) {
      console.error('Error creating shipment:', error);
      alert('Error al crear la etiqueta de envío: ' + error.message);
    } finally {
      setCreatingLabel(false);
      setCreatingForOrderId(null);
      setSelectedOrder(null);
    }
  };

  const handlePrintLabel = async () => {
    if (!labelData?.postage_label?.label_url) return;

    try {
      // Importar pdfjs-dist dinámicamente
      const pdfjsLib = await import('pdfjs-dist');
      // Configurar el worker para pdf.js
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

      // Descargar el PDF a través del backend para evitar problemas de CORS
      // En desarrollo usa directamente localhost:5000, en producción usa window.location.origin
      const baseURL = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:5000'; // Usa directamente el backend en desarrollo
      const proxyUrl = `${baseURL}/api/easypost/label-pdf?url=${encodeURIComponent(labelData.postage_label.label_url)}`;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al descargar el PDF');
      }

      const arrayBuffer = await response.arrayBuffer();
      
      // Cargar el PDF
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      // Crear un canvas temporal para renderizar cada página
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Crear nuevo PDF en formato vertical (portrait)
      const outputPdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = 210; // Ancho A4 en mm (vertical)
      const pdfHeight = 297; // Alto A4 en mm (vertical)

      // Renderizar cada página del PDF original
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        
        // Configurar el canvas
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Renderizar la página en el canvas
        await page.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise;

        // Convertir canvas a imagen
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // Calcular dimensiones manteniendo la proporción
        const isLandscape = viewport.width > viewport.height;
        let imgWidth, imgHeight;
        
        if (isLandscape) {
          // Si es horizontal, ajustamos para formato vertical
          imgHeight = pdfWidth;
          imgWidth = (viewport.width * pdfWidth) / viewport.height;
          
          if (imgWidth > pdfHeight) {
            imgWidth = pdfHeight;
            imgHeight = (viewport.height * pdfHeight) / viewport.width;
          }
          
          // Intercambiar dimensiones para la rotación
          const tempWidth = imgWidth;
          imgWidth = imgHeight;
          imgHeight = tempWidth;
        } else {
          // Si ya es vertical, mantener proporción
          imgWidth = pdfWidth;
          imgHeight = (viewport.height * pdfWidth) / viewport.width;
          
          if (imgHeight > pdfHeight) {
            imgHeight = pdfHeight;
            imgWidth = (viewport.width * pdfHeight) / viewport.height;
          }
        }
        
        // Si es la primera página, no agregar nueva página
        if (pageNum > 1) {
          outputPdf.addPage();
        }
        
        // Centrar la imagen en la página
        const x = (pdfWidth - imgWidth) / 2;
        const y = (pdfHeight - imgHeight) / 2;
        
        if (isLandscape) {
          // Para imágenes horizontales, rotar 90 grados
          outputPdf.saveGraphicsState();
          outputPdf.translate(pdfWidth / 2, pdfHeight / 2);
          outputPdf.rotate(90 * Math.PI / 180);
          outputPdf.addImage(imgData, 'PNG', -imgHeight / 2, -imgWidth / 2, imgHeight, imgWidth);
          outputPdf.restoreGraphicsState();
        } else {
          // Para imágenes verticales, agregar normalmente
          outputPdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        }
      }

      // Generar blob del PDF vertical y abrirlo en nueva ventana
      const pdfBlob = outputPdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      // Limpiar la URL después de un tiempo
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    } catch (error) {
      console.error('Error al generar PDF vertical para imprimir:', error);
      // Fallback: abrir el PDF original si hay error
      window.open(labelData.postage_label.label_url, '_blank');
    }
  };

  const handleDownloadLabel = async () => {
    if (!labelData?.postage_label?.label_url) return;

    try {
      // Importar pdfjs-dist dinámicamente
      const pdfjsLib = await import('pdfjs-dist');
      // Configurar el worker para pdf.js
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

      // Descargar el PDF a través del backend para evitar problemas de CORS
      // En desarrollo usa directamente localhost:5000, en producción usa window.location.origin
      const baseURL = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:5000'; // Usa directamente el backend en desarrollo
      const proxyUrl = `${baseURL}/api/easypost/label-pdf?url=${encodeURIComponent(labelData.postage_label.label_url)}`;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al descargar el PDF');
      }

      const arrayBuffer = await response.arrayBuffer();
      
      // Cargar el PDF
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      // Crear un canvas temporal para renderizar cada página
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Crear nuevo PDF en formato vertical (portrait)
      // 'p' = portrait (vertical), 'mm' = milímetros, 'a4' = tamaño A4
      const outputPdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = 210; // Ancho A4 en mm (vertical)
      const pdfHeight = 297; // Alto A4 en mm (vertical)

      // Renderizar cada página del PDF original
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        
        // Configurar el canvas
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Renderizar la página en el canvas
        await page.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise;

        // Convertir canvas a imagen
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // Calcular dimensiones manteniendo la proporción
        // Si la imagen original es horizontal, la ajustamos para formato vertical
        const isLandscape = viewport.width > viewport.height;
        let imgWidth, imgHeight;
        
        if (isLandscape) {
          // Si es horizontal, rotamos 90 grados mentalmente
          // El ancho original se convierte en alto, y viceversa
          // Ajustamos para que quepa en formato vertical A4
          imgHeight = pdfWidth; // Usamos el ancho del PDF como altura máxima
          imgWidth = (viewport.width * pdfWidth) / viewport.height;
          
          // Si es muy ancho después del cálculo, ajustamos
          if (imgWidth > pdfHeight) {
            imgWidth = pdfHeight;
            imgHeight = (viewport.height * pdfHeight) / viewport.width;
          }
          
          // Intercambiar dimensiones para la rotación
          // Rotamos la imagen 90 grados, así que intercambiamos ancho y alto
          const tempWidth = imgWidth;
          imgWidth = imgHeight;
          imgHeight = tempWidth;
        } else {
          // Si ya es vertical, mantener proporción
          imgWidth = pdfWidth;
          imgHeight = (viewport.height * pdfWidth) / viewport.width;
          
          // Si es muy alto, ajustar al alto de la página
          if (imgHeight > pdfHeight) {
            imgHeight = pdfHeight;
            imgWidth = (viewport.width * pdfHeight) / viewport.height;
          }
        }
        
        // Si es la primera página, no agregar nueva página
        if (pageNum > 1) {
          outputPdf.addPage();
        }
        
        // Centrar la imagen en la página
        const x = (pdfWidth - imgWidth) / 2;
        const y = (pdfHeight - imgHeight) / 2;
        
        if (isLandscape) {
          // Para imágenes horizontales, rotar 90 grados
          // Guardar el estado actual del contexto
          outputPdf.saveGraphicsState();
          // Mover el origen al centro de la página
          outputPdf.translate(pdfWidth / 2, pdfHeight / 2);
          // Rotar 90 grados (en radianes)
          outputPdf.rotate(90 * Math.PI / 180);
          // Dibujar la imagen rotada (intercambiamos ancho y alto)
          outputPdf.addImage(imgData, 'PNG', -imgHeight / 2, -imgWidth / 2, imgHeight, imgWidth);
          // Restaurar el estado
          outputPdf.restoreGraphicsState();
        } else {
          // Para imágenes verticales, agregar normalmente
          outputPdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        }
      }

      // Descargar el PDF vertical
      outputPdf.save(`label-${labelData.tracking_code}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF vertical:', error);
      // Fallback: descargar el PDF original si hay error
      alert('No se pudo convertir a formato vertical. Descargando PDF original...');
      const link = document.createElement('a');
      link.href = labelData.postage_label.label_url;
      link.download = `label-${labelData.tracking_code}.pdf`;
      link.target = '_blank';
      link.click();
    }
  };

  const handlePrintOrderDetails = async () => {
    if (!selectedOrderDetails) return;

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const lineHeight = 4; // Reducido de 5 a 4
      const sectionSpacing = 6; // Reducido de 8 a 6
      const boxPadding = 3;

      // Traducciones
        const translations = {
        es: {
          title: 'DETALLE DE ORDEN',
          customerInfo: 'INFORMACIÓN DEL CLIENTE',
          generalInfo: 'INFORMACIÓN GENERAL',
          products: 'PRODUCTOS',
          shippingInfo: 'INFORMACIÓN DE ENVÍO',
          packageInfo: 'INFORMACIÓN DEL PAQUETE',
          name: 'Nombre:',
          email: 'Email:',
          phone: 'Teléfono:',
          address: 'Dirección:',
          orderId: 'ID de Orden:',
          status: 'Estado:',
          paymentStatus: 'Estado de Pago:',
          total: 'Total:',
          date: 'Fecha de Creación:',
          carrier: 'Transportista:',
          service: 'Servicio:',
          cost: 'Costo:',
          tracking: 'Tracking:',
          weight: 'Peso:',
          dimensions: 'Dimensiones:',
          product: 'Producto',
          quantity: 'Cantidad',
          price: 'Precio Unit.',
          subtotal: 'Subtotal',
          footer: 'Delizukar Bakery'
        },
        en: {
          title: 'ORDER DETAILS',
          customerInfo: 'CUSTOMER INFORMATION',
          generalInfo: 'GENERAL INFORMATION',
          products: 'PRODUCTS',
          shippingInfo: 'SHIPPING INFORMATION',
          packageInfo: 'PACKAGE INFORMATION',
          name: 'Name:',
          email: 'Email:',
          phone: 'Phone:',
          address: 'Address:',
          orderId: 'Order ID:',
          status: 'Status:',
          paymentStatus: 'Payment Status:',
          total: 'Total:',
          date: 'Creation Date:',
          carrier: 'Carrier:',
          service: 'Service:',
          cost: 'Cost:',
          tracking: 'Tracking:',
          weight: 'Weight:',
          dimensions: 'Dimensions:',
          product: 'Product',
          quantity: 'Quantity',
          price: 'Unit Price',
          subtotal: 'Subtotal',
          footer: 'Delizukar Bakery'
        }
      };

      // Preparar datos
      const orderId = selectedOrderDetails.id || 'N/A';
      const status = selectedOrderDetails.status || 'pending';
      const paymentStatus = selectedOrderDetails.paymentStatus || 'unknown';
      const total = selectedOrderDetails.total?.toFixed(2) || '0.00';
      const getStatusText = (status, lang) => {
        const statusMap = {
          es: { pending: 'Pendiente', processing: 'Procesando', shipped: 'Enviado', completed: 'Completado' },
          en: { pending: 'Pending', processing: 'Processing', shipped: 'Shipped', completed: 'Completed' }
        };
        return statusMap[lang]?.[status] || status.charAt(0).toUpperCase() + status.slice(1);
      };
      const getPaymentStatusText = (status, lang) => {
        const paymentMap = {
          es: { paid: 'Pagado', pending: 'Pendiente', failed: 'Fallido', refunded: 'Reembolsado' },
          en: { paid: 'Paid', pending: 'Pending', failed: 'Failed', refunded: 'Refunded' }
        };
        return paymentMap[lang]?.[status] || status.charAt(0).toUpperCase() + status.slice(1);
      };

      // Cargar logo una vez - esperar a que se cargue completamente
      let logoData = null;
      let logoWidth = 35;
      let logoHeight = 35;
      
      try {
        const response = await fetch('/LOGO.png');
        if (response.ok) {
          const blob = await response.blob();
          const reader = new FileReader();
          logoData = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
            setTimeout(() => resolve(null), 3000);
          });
          
          // Si tenemos logoData, cargar la imagen para obtener dimensiones
          if (logoData) {
            const logoImg = new Image();
            logoImg.src = logoData;
            await new Promise((resolve) => {
              logoImg.onload = () => {
                logoHeight = (logoWidth * logoImg.height) / logoImg.width;
                resolve();
              };
              logoImg.onerror = () => resolve();
              setTimeout(resolve, 2000);
            });
          }
        }
      } catch (logoError) {
        console.warn('Error al cargar logo:', logoError);
      }

      // Función auxiliar para generar una página con el nuevo diseño
      const generatePage = (lang) => {
        let yPosition = 15;

        // Agregar logo arriba centrado
        if (logoData) {
          try {
            const logoX = (pageWidth - logoWidth) / 2;
            pdf.addImage(logoData, 'PNG', logoX, yPosition, logoWidth, logoHeight);
            yPosition += logoHeight + 15;
          } catch (error) {
            console.warn('Error al agregar logo al PDF:', error);
            yPosition += 10;
          }
        } else {
          yPosition += 10;
        }

        // SHIP TO y BILL TO - Lado a lado debajo del logo
        const addressBoxWidth = (pageWidth - 2 * margin - 10) / 2;
        const shipToX = margin;
        const billToX = margin + addressBoxWidth + 10;
        let addressY = yPosition;

        // SHIP TO (Izquierda) - Dirección de envío del cliente
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(200, 98, 109);
        pdf.text('SHIP TO', shipToX, addressY);
        addressY += 6;

        if (selectedOrderDetails.customerInfo) {
          const customer = selectedOrderDetails.customerInfo;
          const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'N/A';
          
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          pdf.text(fullName, shipToX, addressY);
          addressY += 5;

          if (customer.address) {
            const addr = customer.address;
            const addressLines = [
              addr.line1 || '',
              addr.line2 || '',
              `${addr.city || ''}, ${addr.state || ''} ${addr.postal_code || ''}`.trim(),
              addr.country || ''
            ];
            addressLines.forEach(line => {
              if (line.trim()) {
                pdf.text(line, shipToX, addressY);
                addressY += 5;
              }
            });
          }
        }

        // BILL TO (Derecha) - Dirección de facturación (Delizukar)
        let billToY = yPosition;
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(200, 98, 109);
        pdf.text('BILL TO', billToX, billToY);
        billToY += 6;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text('Delizukar', billToX, billToY);
        billToY += 5;
        pdf.text('29 E 7TH ST', billToX, billToY);
        billToY += 5;
        pdf.text('CLIFTON, NJ 07011', billToX, billToY);
        billToY += 5;
        pdf.text('UNITED STATES', billToX, billToY);

        // Actualizar posición Y para la siguiente sección
        yPosition = Math.max(addressY, billToY) + 15;

        // TABLA DE ITEMS
        if (selectedOrderDetails.cartItems && selectedOrderDetails.cartItems.length > 0) {
          if (yPosition > pageHeight - 100) {
            pdf.addPage();
            yPosition = 15;
          }

          // Encabezados de tabla
          pdf.setFillColor(200, 98, 109);
          pdf.rect(margin, yPosition - 3, pageWidth - 2 * margin, 6, 'F');
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(255, 255, 255);
          pdf.text('Items', margin + 2, yPosition);
          pdf.text('Cantidad', margin + 110, yPosition, { align: 'right' });
          pdf.text('Precio', margin + 150, yPosition, { align: 'right' });
          pdf.text('Subtotal', pageWidth - margin - 2, yPosition, { align: 'right' });
          yPosition += 6;
          pdf.setTextColor(0, 0, 0);

          // Filas de productos
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          let totalAmount = 0;
          
          selectedOrderDetails.cartItems.forEach((item) => {
            const itemName = item.name || 'Producto sin nombre';
            const quantity = item.quantity || 0;
            const price = parseFloat(item.price || 0).toFixed(2);
            const subtotal = (parseFloat(item.price || 0) * (item.quantity || 0)).toFixed(2);
            totalAmount += parseFloat(subtotal);

            const nameLines = pdf.splitTextToSize(itemName, 95);
            pdf.text(nameLines, margin + 2, yPosition);
            pdf.text(String(quantity), margin + 110, yPosition, { align: 'right' });
            pdf.text(`$${price}`, margin + 150, yPosition, { align: 'right' });
            pdf.setFont('helvetica', 'bold');
            pdf.text(`$${subtotal}`, pageWidth - margin - 2, yPosition, { align: 'right' });
            pdf.setFont('helvetica', 'normal');
            yPosition += Math.max(nameLines.length * 4, 5);
            
            if (yPosition > pageHeight - 80) {
              pdf.addPage();
              yPosition = 15;
            }
          });

          // Total
          yPosition += 5;
          pdf.setDrawColor(200, 98, 109);
          pdf.setLineWidth(0.5);
          pdf.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 8;
          
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11);
          pdf.setTextColor(200, 98, 109);
          pdf.text('Total:', pageWidth - margin - 50, yPosition);
          pdf.text(`$${totalAmount.toFixed(2)}`, pageWidth - margin - 2, yPosition, { align: 'right' });
          yPosition += 10;
        }

        // Pie de página
        let footerY = pageHeight - 25;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text('Gracias por comprar con nosotros', pageWidth / 2, footerY, { align: 'center' });
        footerY += 5;
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(200, 98, 109);
        pdf.text('Delizukar - Galletas estilo New York', pageWidth / 2, footerY, { align: 'center' });
        footerY += 5;
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(102, 102, 102);
        pdf.text('delizukar@gmail.com', pageWidth / 2, footerY, { align: 'center' });
        footerY += 4;
        pdf.text('delizukar.com', pageWidth / 2, footerY, { align: 'center' });
      };

      // Generar página con el nuevo diseño
      generatePage('es');

      // Descargar el PDF
      const fileName = `orden-${orderId.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error al generar PDF de detalles:', error);
      alert('Error al generar el PDF: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'shipped':
        return 'success';
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'shipped':
        return <CheckCircle />;
      case 'pending':
        return <Pending />;
      default:
        return <LocalShipping />;
    }
  };

  // Filtrar órdenes según la pestaña activa
  const getFilteredOrders = () => {
    if (currentTab === 'labels') {
      // Solo órdenes con etiquetas compradas (status: 'shipped' y trackingCode)
      return orders.filter(order => 
        order.status === 'shipped' && 
        (order.trackingCode || order.labelUrl)
      );
    }
    return orders; // Todas las órdenes
  };

  const filteredOrders = getFilteredOrders();

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }
        }}
        sx={{
          zIndex: 9999 // Asegurar que esté por encima del header
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#C8626D', 
          color: 'white', 
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LocalShipping sx={{ fontSize: 24, color: 'white' }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
              Gestión de Pedidos y Envíos
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Email />}
              onClick={() => setTestEmailDialog(true)}
              sx={{
                borderColor: 'white',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Email de Prueba
            </Button>
            <IconButton
              onClick={onClose}
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
        
        <DialogContent sx={{ p: 0, backgroundColor: '#fafafa' }}>
          {/* Pestañas */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: 'white' }}>
            <Tabs 
              value={currentTab} 
              onChange={(e, newValue) => setCurrentTab(newValue)}
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  minHeight: 64
                },
                '& .Mui-selected': {
                  color: '#C8626D'
                }
              }}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab 
                icon={<LocalShipping />} 
                iconPosition="start"
                label="Todas las Órdenes" 
                value="all"
                sx={{ color: currentTab === 'all' ? '#C8626D' : '#666' }}
              />
              <Tab 
                icon={<Receipt />} 
                iconPosition="start"
                label={`Etiquetas Compradas (${orders.filter(o => o.status === 'shipped' && (o.trackingCode || o.labelUrl)).length})`} 
                value="labels"
                sx={{ color: currentTab === 'labels' ? '#C8626D' : '#666' }}
              />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#C8626D' }} />
              </Box>
            ) : filteredOrders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                {currentTab === 'labels' ? (
                  <>
                    <Receipt sx={{ fontSize: 64, color: '#C8626D', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#C8626D', mb: 2, fontWeight: 600 }}>
                      No hay etiquetas compradas
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#666' }}>
                      Las etiquetas compradas aparecerán aquí cuando uses el botón "Auto" para crear envíos.
                    </Typography>
                  </>
                ) : (
                  <>
                    <LocalShipping sx={{ fontSize: 64, color: '#C8626D', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#C8626D', mb: 2, fontWeight: 600 }}>
                      No hay pedidos registrados
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#666' }}>
                      Los pedidos aparecerán aquí cuando se completen las compras.
                    </Typography>
                  </>
                )}
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Pedido ID</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Seguimiento</TableCell>
                      {currentTab === 'labels' && <TableCell>Etiqueta</TableCell>}
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.id.substring(0, 8)}...</TableCell>
                      <TableCell>
                        {order.customerInfo?.firstName} {order.customerInfo?.lastName}
                      </TableCell>
                      <TableCell>
                        {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        ${order.total?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(order.status)}
                          label={order.status || 'pending'}
                          color={getStatusColor(order.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {order.trackingCode ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                              {order.trackingCode}
                            </Typography>
                            {order.trackingUrl && (
                              <Button
                                size="small"
                                href={order.trackingUrl}
                                target="_blank"
                                sx={{ mt: 0.5, fontSize: '0.7rem', p: 0 }}
                              >
                                Rastrear
                              </Button>
                            )}
                          </Box>
                        ) : '-'}
                      </TableCell>
                      {currentTab === 'labels' && (
                        <TableCell>
                          {order.labelUrl ? (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Print />}
                                onClick={() => {
                                  setLabelData({
                                    tracking_code: order.trackingCode,
                                    id: order.id,
                                    postage_label: {
                                      label_url: order.labelUrl
                                    }
                                  });
                                  setLabelDialogOpen(true);
                                }}
                                sx={{
                                  borderColor: '#C8626D',
                                  color: '#C8626D',
                                  '&:hover': {
                                    borderColor: '#b8555a',
                                    backgroundColor: '#C8626D10'
                                  }
                                }}
                              >
                                Ver/Imprimir
                              </Button>
                            </Box>
                          ) : (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={creatingForOrderId === order.id ? <CircularProgress size={16} /> : <LocalShipping />}
                              onClick={() => handleBuyUSPSLabel(order)}
                              disabled={creatingLabel}
                              sx={{
                                backgroundColor: '#4a90e2',
                                '&:hover': {
                                  backgroundColor: '#357abd'
                                }
                              }}
                            >
                              {creatingForOrderId === order.id ? 'Comprando...' : 'Comprar Etiqueta USPS'}
                            </Button>
                          )}
                        </TableCell>
                      )}
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                          {/* Botón Ver Detalles - Siempre visible */}
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => {
                              setSelectedOrderDetails(order);
                              setOrderDetailsDialog(true);
                            }}
                            sx={{
                              borderColor: '#C8626D',
                              color: '#C8626D',
                              '&:hover': { 
                                borderColor: '#b8555a',
                                backgroundColor: '#C8626D10'
                              }
                            }}
                          >
                            Ver Detalles
                          </Button>
                          
                          {currentTab === 'labels' ? (
                            // En la pestaña de etiquetas, mostrar botón para ver/imprimir
                            order.labelUrl && (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<Print />}
                                onClick={() => {
                                  setLabelData({
                                    tracking_code: order.trackingCode,
                                    id: order.id,
                                    postage_label: {
                                      label_url: order.labelUrl
                                    }
                                  });
                                  setLabelDialogOpen(true);
                                }}
                                sx={{
                                  backgroundColor: '#C8626D',
                                  '&:hover': { backgroundColor: '#b8555a' }
                                }}
                              >
                                Ver Etiqueta
                              </Button>
                            )
                          ) : (
                            // En la pestaña de todas las órdenes, mostrar botón para comprar etiqueta USPS
                            !order.labelUrl && (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={creatingForOrderId === order.id ? <CircularProgress size={16} /> : <LocalShipping />}
                                onClick={() => handleBuyUSPSLabel(order)}
                                disabled={creatingLabel || creatingForOrderId === order.id}
                                sx={{
                                  backgroundColor: '#4a90e2',
                                  '&:hover': { backgroundColor: '#357abd' }
                                }}
                              >
                                {creatingForOrderId === order.id ? 'Comprando...' : 'Comprar Etiqueta'}
                              </Button>
                            )
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialog para mostrar etiqueta */}
      <Dialog
        open={labelDialogOpen}
        onClose={() => setLabelDialogOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{
          zIndex: 17001, // Muy alto para estar por encima de todo
          '& .MuiDialog-paper': {
            zIndex: 17001
          },
          '& .MuiBackdrop-root': {
            zIndex: 17000
          }
        }}
        BackdropProps={{
          sx: {
            zIndex: 17000
          }
        }}
      >
        <DialogTitle sx={{ backgroundColor: '#C8626D', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalShipping />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {labelData?.pendingPayment ? '⚠️ Shipment Creado - Pendiente de Pago' : '✅ Etiqueta de Envío Generada'}
            </Typography>
          </Box>
          <IconButton
            onClick={() => setLabelDialogOpen(false)}
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
        {labelData && (
          <Box>
            {labelData.pendingPayment ? (
              // Shipment creado, pendiente de pago
              <>
                <Alert severity="error" sx={{ mb: 3 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                    ❌ Error: Falta método de pago en Shippo
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>El pago no pudo realizarse porque falta un método de pago válido en tu cuenta de Shippo.</strong>
                  </Typography>
                  <Typography variant="body2">
                    El shipment se creó correctamente, pero necesitas agregar un método de pago en EasyPost para poder pagar la etiqueta de envío. Haz clic en el botón "Ir a EasyPost" para agregar tu método de pago y completar el pago manualmente.
                  </Typography>
                </Alert>
                
                <Box sx={{ 
                  backgroundColor: '#f5f5f5', 
                  p: 2, 
                  borderRadius: '8px', 
                  mb: 3,
                  border: '1px solid #e0e0e0'
                }}>
                  <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                    <strong>Información del Shipment:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                    <strong>Shipment ID:</strong> {labelData.shipmentId}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                    <strong>Carrier:</strong> {labelData.carrier}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                    <strong>Servicio:</strong> {labelData.service}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                    <strong>Costo:</strong> ${labelData.shippingCost}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    <strong>ID de pedido:</strong> {labelData.id}
                  </Typography>
                </Box>

                <Box sx={{ 
                  backgroundColor: '#fff3cd', 
                  p: 2, 
                  borderRadius: '8px',
                  border: '1px solid #ffc107',
                  mb: 3
                }}>
                  <Typography variant="body2" sx={{ color: '#856404', mb: 1, fontWeight: 600 }}>
                    📋 Instrucciones para completar el pago:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#856404', fontSize: '0.9rem', mb: 1 }}>
                    <strong>Paso 1:</strong> Haz clic en el botón <strong>"Ir a EasyPost"</strong> que aparece abajo
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#856404', fontSize: '0.9rem', mb: 1 }}>
                    <strong>Paso 2:</strong> En Shippo, ve a la sección de <strong>"Billing"</strong> o <strong>"Payment Methods"</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#856404', fontSize: '0.9rem', mb: 1 }}>
                    <strong>Paso 3:</strong> Agrega tu tarjeta de crédito o método de pago
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#856404', fontSize: '0.9rem', mb: 1 }}>
                    <strong>Paso 4:</strong> Regresa al shipment y selecciona el rate para pagar la etiqueta
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#856404', fontSize: '0.9rem' }}>
                    <strong>Paso 5:</strong> Una vez pagada, la etiqueta estará disponible para imprimir
                  </Typography>
                </Box>
              </>
            ) : (
              // Etiqueta ya pagada
              <>
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                    ¡Etiqueta creada exitosamente!
                  </Typography>
                  <Typography variant="body2">
                    La etiqueta está lista para imprimir. El cliente recibirá un email con el código de seguimiento.
                  </Typography>
                </Alert>
                
                <Box sx={{ 
                  backgroundColor: '#f5f5f5', 
                  p: 2, 
                  borderRadius: '8px', 
                  mb: 3,
                  border: '1px solid #e0e0e0'
                }}>
                  <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                    <strong>Código de seguimiento:</strong>
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 2, color: '#C8626D', fontFamily: 'monospace', fontWeight: 600 }}>
                    {labelData.tracking_code}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    <strong>ID de pedido:</strong> {labelData.id}
                  </Typography>
                </Box>

                {/* Vista previa del PDF en formato vertical */}
                {labelVerticalPdfUrl && (
                  <Box sx={{ 
                    mb: 3, 
                    border: '2px solid #C8626D', 
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#fff'
                  }}>
                    <Box sx={{ 
                      backgroundColor: '#C8626D', 
                      color: 'white', 
                      p: 1, 
                      textAlign: 'center',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}>
                      📄 Vista Previa - Etiqueta en Formato Vertical
                    </Box>
                    <Box sx={{ 
                      width: '100%', 
                      height: '600px',
                      overflow: 'auto',
                      backgroundColor: '#f5f5f5'
                    }}>
                      <iframe
                        src={labelVerticalPdfUrl}
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none'
                        }}
                        title="Vista previa de etiqueta"
                      />
                    </Box>
                  </Box>
                )}

                <Box sx={{ 
                  backgroundColor: '#e8f4fd', 
                  p: 2, 
                  borderRadius: '8px',
                  border: '1px solid #b3d9ff'
                }}>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    <strong>📋 Instrucciones:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                    1. Haz clic en <strong>"Imprimir"</strong> para abrir la etiqueta en formato vertical en una nueva ventana<br/>
                    2. O haz clic en <strong>"Descargar PDF"</strong> para guardarla en formato vertical en tu computadora<br/>
                    3. Imprime la etiqueta y pégala en el paquete
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
        {labelData?.pendingPayment ? (
          // Botones para shipment pendiente de pago
          <>
            <Button
              variant="contained"
              startIcon={<LocalShipping />}
              onClick={() => {
                if (labelData.easypostUrl) {
                  window.open(labelData.easypostUrl, '_blank');
                }
              }}
              size="large"
              sx={{ 
                backgroundColor: '#C8626D', 
                '&:hover': { backgroundColor: '#b8555a' },
                minWidth: '150px'
              }}
            >
              🔗 Ir a Shippo
            </Button>
            <Button
              variant="text"
              onClick={() => setLabelDialogOpen(false)}
              sx={{ color: '#666' }}
            >
              Cerrar
            </Button>
          </>
        ) : (
          // Botones para etiqueta pagada
          <>
            <Button
              variant="contained"
              startIcon={<Print />}
              onClick={handlePrintLabel}
              size="large"
              sx={{ 
                backgroundColor: '#C8626D', 
                '&:hover': { backgroundColor: '#b8555a' },
                minWidth: '150px'
              }}
            >
              🖨️ Imprimir Etiqueta
            </Button>
            <Button
              variant="outlined"
              startIcon={<GetApp />}
              onClick={handleDownloadLabel}
              size="large"
              sx={{ 
                borderColor: '#C8626D', 
                color: '#C8626D',
                '&:hover': { 
                  borderColor: '#b8555a',
                  backgroundColor: '#C8626D10'
                },
                minWidth: '150px'
              }}
            >
              📥 Descargar PDF
            </Button>
            <Button
              variant="text"
              onClick={() => setLabelDialogOpen(false)}
              sx={{ color: '#666' }}
            >
              Cerrar
            </Button>
          </>
        )}
      </DialogActions>
      </Dialog>

      {/* Dialog para enviar email de prueba */}
      <Dialog
        open={testEmailDialog}
        onClose={() => !sendingTestEmail && setTestEmailDialog(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          zIndex: 16000
        }}
      >
        <DialogTitle sx={{ backgroundColor: '#C8626D', color: 'white' }}>
          Enviar Email de Prueba
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Ingresa el correo donde quieres recibir el email de prueba del envío.
          </Alert>
          <TextField
            autoFocus
            margin="dense"
            label="Correo electrónico"
            type="email"
            fullWidth
            variant="outlined"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="tu@email.com"
            disabled={sendingTestEmail}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setTestEmailDialog(false)}
            disabled={sendingTestEmail}
            sx={{ color: '#666' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSendTestEmail}
            disabled={sendingTestEmail || !testEmail}
            variant="contained"
            sx={{
              backgroundColor: '#C8626D',
              '&:hover': { backgroundColor: '#b8555a' }
            }}
          >
            {sendingTestEmail ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Enviando...
              </>
            ) : (
              'Enviar'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para ver detalles completos de la orden */}
      <Dialog
        open={orderDetailsDialog}
        onClose={() => setOrderDetailsDialog(false)}
        maxWidth="md"
        fullWidth
        sx={{
          zIndex: 18000, // Muy alto para estar por encima de todo
          '& .MuiDialog-paper': {
            zIndex: 18000
          },
          '& .MuiBackdrop-root': {
            zIndex: 17999
          }
        }}
        BackdropProps={{
          sx: {
            zIndex: 17999
          }
        }}
      >
        <DialogTitle sx={{ backgroundColor: '#C8626D', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Info />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Detalles de la Orden
            </Typography>
          </Box>
          <IconButton
            onClick={() => setOrderDetailsDialog(false)}
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedOrderDetails && (
            <Box>
              {/* Información General */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#C8626D', mb: 2, fontWeight: 600, borderBottom: '2px solid #C8626D', pb: 1 }}>
                  📋 Información General
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}><strong>ID de Orden:</strong></Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', mb: 2 }}>{selectedOrderDetails.id}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}><strong>Estado:</strong></Typography>
                    <Chip
                      icon={getStatusIcon(selectedOrderDetails.status)}
                      label={selectedOrderDetails.status || 'pending'}
                      color={getStatusColor(selectedOrderDetails.status)}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}><strong>Estado de Pago:</strong></Typography>
                    <Chip
                      label={selectedOrderDetails.paymentStatus || 'unknown'}
                      color={selectedOrderDetails.paymentStatus === 'paid' ? 'success' : 'warning'}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}><strong>Total:</strong></Typography>
                    <Typography variant="h6" sx={{ color: '#C8626D', mb: 2, fontWeight: 600 }}>
                      ${selectedOrderDetails.total?.toFixed(2) || '0.00'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}><strong>Fecha de Creación:</strong></Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {selectedOrderDetails.createdAt 
                        ? new Date(selectedOrderDetails.createdAt.seconds ? selectedOrderDetails.createdAt.seconds * 1000 : selectedOrderDetails.createdAt).toLocaleString('es-ES')
                        : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}><strong>Última Actualización:</strong></Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {selectedOrderDetails.updatedAt 
                        ? new Date(selectedOrderDetails.updatedAt.seconds ? selectedOrderDetails.updatedAt.seconds * 1000 : selectedOrderDetails.updatedAt).toLocaleString('es-ES')
                        : '-'}
                    </Typography>
                  </Grid>
                  {selectedOrderDetails.sessionId && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}><strong>Session ID:</strong></Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', mb: 2, fontSize: '0.9rem' }}>
                        {selectedOrderDetails.sessionId}
                      </Typography>
                    </Grid>
                  )}
                  {selectedOrderDetails.paymentIntentId && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}><strong>Payment Intent ID:</strong></Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', mb: 2, fontSize: '0.9rem' }}>
                        {selectedOrderDetails.paymentIntentId}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {/* Información del Cliente */}
              {selectedOrderDetails.customerInfo && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ color: '#C8626D', mb: 2, fontWeight: 600, borderBottom: '2px solid #C8626D', pb: 1 }}>
                    👤 Información del Cliente
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}><strong>Nombre:</strong></Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {selectedOrderDetails.customerInfo.firstName || ''} {selectedOrderDetails.customerInfo.lastName || ''}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}><strong>Email:</strong></Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>{selectedOrderDetails.customerInfo.email || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}><strong>Teléfono:</strong></Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>{selectedOrderDetails.customerInfo.phone || '-'}</Typography>
                    </Grid>
                    {selectedOrderDetails.customerInfo.address && (
                      <Grid item xs={12}>
                        <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}><strong>Dirección:</strong></Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {selectedOrderDetails.customerInfo.address.line1 || ''}
                          {selectedOrderDetails.customerInfo.address.line2 ? `, ${selectedOrderDetails.customerInfo.address.line2}` : ''}
                          <br />
                          {selectedOrderDetails.customerInfo.address.city || ''}, {selectedOrderDetails.customerInfo.address.state || ''} {selectedOrderDetails.customerInfo.address.postal_code || ''}
                          <br />
                          {selectedOrderDetails.customerInfo.address.country || ''}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}

              {/* Productos */}
              {selectedOrderDetails.cartItems && selectedOrderDetails.cartItems.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ color: '#C8626D', mb: 2, fontWeight: 600, borderBottom: '2px solid #C8626D', pb: 1 }}>
                    🛒 Productos ({selectedOrderDetails.cartItems.reduce((total, item) => total + (item.quantity || 0), 0)})
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Producto</strong></TableCell>
                          <TableCell align="right"><strong>Cantidad</strong></TableCell>
                          <TableCell align="right"><strong>Precio Unit.</strong></TableCell>
                          <TableCell align="right"><strong>Subtotal</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrderDetails.cartItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {item.image && (
                                  <img 
                                    src={item.image} 
                                    alt={item.name} 
                                    style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                                  />
                                )}
                                <Typography variant="body2">{item.name || 'Producto sin nombre'}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">{item.quantity || 0}</TableCell>
                            <TableCell align="right">${parseFloat(item.price || 0).toFixed(2)}</TableCell>
                            <TableCell align="right">
                              ${(parseFloat(item.price || 0) * (item.quantity || 0)).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Información de Envío */}
              {selectedOrderDetails.shippingInfo && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ color: '#C8626D', mb: 2, fontWeight: 600, borderBottom: '2px solid #C8626D', pb: 1 }}>
                    📦 Información de Envío
                  </Typography>
                  <Grid container spacing={2}>
                    {selectedOrderDetails.shippingInfo.carrier && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}><strong>Transportista:</strong></Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>{selectedOrderDetails.shippingInfo.carrier}</Typography>
                      </Grid>
                    )}
                    {selectedOrderDetails.shippingInfo.serviceLevel && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}><strong>Servicio:</strong></Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>{selectedOrderDetails.shippingInfo.serviceLevel}</Typography>
                      </Grid>
                    )}
                    {selectedOrderDetails.shippingInfo.cost && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}><strong>Costo de Envío:</strong></Typography>
                        <Typography variant="body1" sx={{ mb: 2, fontWeight: 600, color: '#C8626D' }}>
                          ${parseFloat(selectedOrderDetails.shippingInfo.cost).toFixed(2)}
                        </Typography>
                      </Grid>
                    )}
                    {selectedOrderDetails.trackingCode && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}><strong>Código de Seguimiento:</strong></Typography>
                        <Typography variant="body1" sx={{ fontFamily: 'monospace', mb: 2, fontWeight: 600 }}>
                          {selectedOrderDetails.trackingCode}
                        </Typography>
                      </Grid>
                    )}
                    {selectedOrderDetails.shippingInfo.rateId && (
                      <Grid item xs={12}>
                        <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}><strong>Rate ID:</strong></Typography>
                        <Typography variant="body1" sx={{ fontFamily: 'monospace', mb: 2, fontSize: '0.9rem' }}>
                          {selectedOrderDetails.shippingInfo.rateId}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}

              {/* Información del Paquete */}
              {selectedOrderDetails.packageInfo && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ color: '#C8626D', mb: 2, fontWeight: 600, borderBottom: '2px solid #C8626D', pb: 1 }}>
                    📏 Información del Paquete
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}><strong>Peso:</strong></Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {selectedOrderDetails.packageInfo.weight} {selectedOrderDetails.packageInfo.weightUnit || 'lb'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}><strong>Dimensiones:</strong></Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {selectedOrderDetails.packageInfo.length} × {selectedOrderDetails.packageInfo.width} × {selectedOrderDetails.packageInfo.height} {selectedOrderDetails.packageInfo.distanceUnit || 'in'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Datos JSON completos (para debugging) - OCULTO */}
              {false && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#C8626D', mb: 2, fontWeight: 600, borderBottom: '2px solid #C8626D', pb: 1 }}>
                  🔍 Datos Completos (JSON)
                </Typography>
                <Box sx={{ 
                  backgroundColor: '#f5f5f5', 
                  p: 2, 
                  borderRadius: '8px',
                  maxHeight: '400px',
                  overflow: 'auto'
                }}>
                  <pre style={{ 
                    margin: 0, 
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {JSON.stringify(selectedOrderDetails, null, 2)}
                  </pre>
                </Box>
              </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setOrderDetailsDialog(false)}
            variant="outlined"
            sx={{
              borderColor: '#C8626D',
              color: '#C8626D',
              '&:hover': {
                borderColor: '#b8555a',
                backgroundColor: 'rgba(200, 98, 109, 0.04)'
              }
            }}
          >
            Cerrar
          </Button>
          <Button
            onClick={handlePrintOrderDetails}
            variant="contained"
            startIcon={<PictureAsPdf />}
            sx={{
              backgroundColor: '#C8626D',
              '&:hover': { backgroundColor: '#b8555a' },
              marginRight: 1
            }}
          >
            Descargar PDF
          </Button>
          {selectedOrderDetails && !selectedOrderDetails.labelUrl && (
            <Button
              onClick={() => selectedOrderDetails && handleBuyUSPSLabel(selectedOrderDetails)}
              variant="contained"
              startIcon={creatingForOrderId === selectedOrderDetails?.id ? <CircularProgress size={16} /> : <LocalShipping />}
              disabled={creatingLabel || creatingForOrderId === selectedOrderDetails?.id}
              sx={{
                backgroundColor: '#4a90e2',
                '&:hover': { backgroundColor: '#357abd' }
              }}
            >
              {creatingForOrderId === selectedOrderDetails?.id ? 'Comprando...' : 'Comprar Etiqueta'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog para detalles de dirección */}
      <Dialog
        open={addressDetailsDialog}
        onClose={() => setAddressDetailsDialog(false)}
        maxWidth="md"
        fullWidth
        sx={{
          zIndex: 16000
        }}
      >
        <DialogTitle sx={{ backgroundColor: '#d32f2f', color: 'white' }}>
          ⚠️ Error al Crear Envío - Detalles de Dirección
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Error: {addressDetails?.error}
            </Typography>
          </Alert>
          
          {addressDetails && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                📋 Pedido ID: {addressDetails.orderId}
              </Typography>
              
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 700, color: '#C8626D' }}>
                Dirección Original (desde Firestore):
              </Typography>
              <Box sx={{ 
                backgroundColor: '#f5f5f5', 
                p: 2, 
                borderRadius: 1,
                mb: 2
              }}>
                <Typography variant="body1"><strong>Nombre:</strong> {addressDetails.original.name}</Typography>
                <Typography variant="body1"><strong>Calle:</strong> {addressDetails.original.street}</Typography>
                <Typography variant="body1"><strong>Ciudad:</strong> {addressDetails.original.city}</Typography>
                <Typography variant="body1"><strong>Estado:</strong> {addressDetails.original.state}</Typography>
                <Typography variant="body1"><strong>Zip:</strong> {addressDetails.original.zip}</Typography>
                <Typography variant="body1"><strong>País:</strong> {addressDetails.original.country}</Typography>
              </Box>

              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 700, color: '#1976d2' }}>
                ℹ️ Información para Shippo:
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Esta es la dirección exacta que estamos enviando a Shippo.
                  Revisa los logs del servidor (consola de terminal) para ver:
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  • Dirección corregida por Shippo (si aplica)<br/>
                  • Código de estado de verificación<br/>
                  • Respuesta completa de la API de Shippo
                </Typography>
              </Alert>

              <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: '#666' }}>
                💡 <strong>Sugerencia:</strong> Abre la consola de terminal donde corre el servidor Node.js 
                para ver los logs detallados con el prefijo <code>🔍 [Address Debug]</code> y 
                <code>📍 DIRECCIÓN EXACTA A ENVIAR A SHIPPO:</code>
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            onClick={() => setAddressDetailsDialog(false)}
            sx={{ 
              backgroundColor: '#C8626D', 
              '&:hover': { backgroundColor: '#b8555a' } 
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Widget de Shippo Shipping Elements */}
      <ShippoShippingElements
        open={shippoElementsOpen}
        onClose={handleShippoElementsClose}
        orderData={shippoOrderData}
      />

      {/* Dialog para Pirate Ship con opciones de envío */}
      <Dialog
        open={pirateShipDialogOpen}
        onClose={() => {
          setPirateShipDialogOpen(false);
          setPirateShipOrder(null);
          setShippingRates([]);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#4a90e2', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          🏴‍☠️ Exportar a Pirate Ship
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {pirateShipOrder && (
            <>
              <Typography variant="h6" gutterBottom>
                Pedido #{pirateShipOrder.id}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Cliente: {pirateShipOrder.customerInfo?.firstName} {pirateShipOrder.customerInfo?.lastName}
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
                Opciones de Envío Disponibles (USPS & UPS)
              </Typography>
              <Alert severity="success" sx={{ mb: 2 }}>
                <strong>Estas son las tarifas comerciales de USPS y UPS</strong> - las mismas que usa Pirate Ship. 
                Los precios mostrados son los que verás en Pirate Ship.
              </Alert>

              {loadingRates ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : shippingRates.length > 0 ? (
                <Box sx={{ mb: 3 }}>
                  {shippingRates.map((rate, index) => {
                    const carrier = rate.provider || rate.carrier || 'N/A';
                    const service = rate.servicelevel?.name || rate.service || 'Standard';
                    const amount = parseFloat(rate.amount_local || rate.amount || 0);
                    const estimatedDays = rate.estimated_days || rate.estimatedDays || 'N/A';
                    
                    return (
                      <Card key={index} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
                        <CardContent>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={6}>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {carrier.toUpperCase()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {service}
                              </Typography>
                              {estimatedDays !== 'N/A' && (
                                <Typography variant="caption" color="text.secondary">
                                  Tiempo estimado: {estimatedDays} días
                                </Typography>
                              )}
                            </Grid>
                            <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                              <Typography variant="h5" sx={{ color: '#4a90e2', fontWeight: 700 }}>
                                ${amount.toFixed(2)}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              ) : (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  No se pudieron calcular las tarifas. Puedes exportar el pedido e importarlo en Pirate Ship para ver todas las opciones disponibles.
                </Alert>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                <strong>Nota:</strong> Al exportar, se generará un archivo CSV que puedes importar en Pirate Ship. 
                Allí podrás ver todas las opciones de envío disponibles (USPS, UPS) y generar la etiqueta.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setPirateShipDialogOpen(false);
              setPirateShipOrder(null);
              setShippingRates([]);
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => pirateShipOrder && handleExportToPirateShip(pirateShipOrder)}
            variant="contained"
            startIcon={<FileDownload />}
            sx={{
              backgroundColor: '#4a90e2',
              '&:hover': { backgroundColor: '#357abd' }
            }}
          >
            Exportar CSV
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OrdersManager;
