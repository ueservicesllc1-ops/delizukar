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
  PictureAsPdf
} from '@mui/icons-material';
import { collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import emailjs from '@emailjs/browser';
import ShippoShippingElements from './ShippoShippingElements';
import jsPDF from 'jspdf';

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
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        // Descargar el PDF a través del backend para evitar problemas de CORS
        // En desarrollo usa directamente localhost:5000, en producción usa window.location.origin
        const baseURL = process.env.NODE_ENV === 'production' 
          ? window.location.origin 
          : 'http://localhost:5000'; // Usa directamente el backend en desarrollo
        const proxyUrl = `${baseURL}/api/shippo/label-pdf?url=${encodeURIComponent(labelData.postage_label.label_url)}`;
        
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
      console.log('✅ Etiqueta comprada desde Shippo Elements:', labelData);
      // Recargar órdenes para ver los cambios
      loadOrders();
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
            shippoUrl: result.data.shippoUrl,
            carrier: result.data.carrier,
            service: result.data.service,
            shippingCost: result.data.shippingCost,
            pendingPayment: true,
            error: result.error || result.message || 'Error al pagar la etiqueta',
            message: result.message || 'No se pudo procesar el pago porque no hay un método de pago válido en Shippo. Ve a Shippo para agregar un método de pago y pagar la etiqueta manualmente.'
          });
          setLabelDialogOpen(true);
          
          // Guardar información del shipment en Firestore
          const orderRef = doc(db, 'orders', order.id);
          await updateDoc(orderRef, {
            shippoShipmentId: result.data.shipmentId,
            shippoRateId: result.data.rateId,
            shippoUrl: result.data.shippoUrl,
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
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      // Descargar el PDF a través del backend para evitar problemas de CORS
      // En desarrollo usa directamente localhost:5000, en producción usa window.location.origin
      const baseURL = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:5000'; // Usa directamente el backend en desarrollo
      const proxyUrl = `${baseURL}/api/shippo/label-pdf?url=${encodeURIComponent(labelData.postage_label.label_url)}`;
      
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
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      // Descargar el PDF a través del backend para evitar problemas de CORS
      // En desarrollo usa directamente localhost:5000, en producción usa window.location.origin
      const baseURL = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:5000'; // Usa directamente el backend en desarrollo
      const proxyUrl = `${baseURL}/api/shippo/label-pdf?url=${encodeURIComponent(labelData.postage_label.label_url)}`;
      
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

  const handlePrintOrderDetails = () => {
    if (!selectedOrderDetails) return;

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      let yPosition = 20;
      const margin = 15;
      const lineHeight = 6;
      const sectionSpacing = 8;
      const col1X = margin;
      const col2X = pageWidth / 2 + 5;
      const colWidth = (pageWidth - 2 * margin - 10) / 2;

      // Función auxiliar para agregar texto con wrap
      const addText = (text, x, y, maxWidth, fontSize = 9, isBold = false, color = [0, 0, 0]) => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        pdf.setTextColor(color[0], color[1], color[2]);
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return lines.length * (fontSize * 0.4);
      };

      // Encabezado
      pdf.setFillColor(200, 98, 109); // #C8626D
      pdf.rect(0, 0, pageWidth, 20, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Detalles de la Orden', margin, 14);
      pdf.setTextColor(0, 0, 0);
      yPosition = 28;

      // Información General
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(200, 98, 109);
      pdf.text('Información General', margin, yPosition);
      yPosition += 5;
      pdf.setDrawColor(200, 98, 109);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 6;

      const orderId = selectedOrderDetails.id || 'N/A';
      const status = selectedOrderDetails.status || 'pending';
      const paymentStatus = selectedOrderDetails.paymentStatus || 'unknown';
      const total = selectedOrderDetails.total?.toFixed(2) || '0.00';
      const createdAt = selectedOrderDetails.createdAt 
        ? new Date(selectedOrderDetails.createdAt.seconds ? selectedOrderDetails.createdAt.seconds * 1000 : selectedOrderDetails.createdAt).toLocaleString('es-ES')
        : '-';
      const updatedAt = selectedOrderDetails.updatedAt 
        ? new Date(selectedOrderDetails.updatedAt.seconds ? selectedOrderDetails.updatedAt.seconds * 1000 : selectedOrderDetails.updatedAt).toLocaleString('es-ES')
        : '-';

      // Dos columnas para información general
      let yCol1 = yPosition;
      let yCol2 = yPosition;

      // Columna 1
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(102, 102, 102); // #666
      pdf.text('ID de Orden:', col1X, yCol1);
      yCol1 += lineHeight;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(9);
      pdf.text(orderId, col1X, yCol1);
      yCol1 += lineHeight + 2;

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(102, 102, 102);
      pdf.text('Estado:', col1X, yCol1);
      yCol1 += lineHeight;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(status, col1X, yCol1);
      yCol1 += lineHeight + 2;

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(102, 102, 102);
      pdf.text('Estado de Pago:', col1X, yCol1);
      yCol1 += lineHeight;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(paymentStatus, col1X, yCol1);
      yCol1 += lineHeight + 2;

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(102, 102, 102);
      pdf.text('Total:', col1X, yCol1);
      yCol1 += lineHeight;
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(200, 98, 109);
      pdf.setFontSize(11);
      pdf.text(`$${total}`, col1X, yCol1);
      yCol1 += lineHeight + 2;

      // Columna 2
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(102, 102, 102);
      pdf.text('Fecha de Creación:', col2X, yCol2);
      yCol2 += lineHeight;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(createdAt, col2X, yCol2);
      yCol2 += lineHeight + 2;

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(102, 102, 102);
      pdf.text('Última Actualización:', col2X, yCol2);
      yCol2 += lineHeight;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(updatedAt, col2X, yCol2);
      yCol2 += lineHeight + 2;
      
      if (selectedOrderDetails.sessionId) {
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(102, 102, 102);
        pdf.text('Session ID:', col2X, yCol2);
        yCol2 += lineHeight;
        pdf.setFont('courier', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);
        pdf.text(selectedOrderDetails.sessionId, col2X, yCol2);
        yCol2 += lineHeight + 2;
      }
      if (selectedOrderDetails.paymentIntentId) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(102, 102, 102);
        pdf.text('Payment Intent ID:', col2X, yCol2);
        yCol2 += lineHeight;
        pdf.setFont('courier', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);
        pdf.text(selectedOrderDetails.paymentIntentId, col2X, yCol2);
        yCol2 += lineHeight + 2;
      }

      // Usar el máximo Y de ambas columnas
      yPosition = Math.max(yCol1, yCol2) + sectionSpacing;

      // Información del Cliente
      if (selectedOrderDetails.customerInfo) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(200, 98, 109);
        pdf.text('Información del Cliente', margin, yPosition);
        yPosition += 5;
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 6;

        const customer = selectedOrderDetails.customerInfo;
        const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'N/A';
        const email = customer.email || 'N/A';
        const phone = customer.phone || 'N/A';

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(102, 102, 102);
        pdf.text('Nombre:', col1X, yPosition);
        yPosition += lineHeight;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(fullName, col1X, yPosition);
        yPosition += lineHeight + 2;

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(102, 102, 102);
        pdf.text('Email:', col1X, yPosition);
        yPosition += lineHeight;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(email, col1X, yPosition);
        yPosition += lineHeight + 2;

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(102, 102, 102);
        pdf.text('Teléfono:', col1X, yPosition);
        yPosition += lineHeight;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(phone, col1X, yPosition);
        yPosition += lineHeight + 2;

        if (customer.address) {
          const addr = customer.address;
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(102, 102, 102);
          pdf.text('Dirección:', col1X, yPosition);
          yPosition += lineHeight;
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          const addressLines = [
            `${addr.line1 || ''}${addr.line2 ? ', ' + addr.line2 : ''}`,
            `${addr.city || ''}, ${addr.state || ''} ${addr.postal_code || ''}`,
            addr.country || ''
          ];
          addressLines.forEach(line => {
            if (line.trim()) {
              pdf.text(line, col1X, yPosition);
              yPosition += lineHeight;
            }
          });
        }
        yPosition += sectionSpacing;
      }

      // Productos - Tabla
      if (selectedOrderDetails.cartItems && selectedOrderDetails.cartItems.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(200, 98, 109);
        pdf.text(`Productos (${selectedOrderDetails.cartItems.length})`, margin, yPosition);
        yPosition += 5;
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 6;

        // Encabezados de tabla
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text('Producto', margin, yPosition);
        pdf.text('Cantidad', margin + 100, yPosition, { align: 'right' });
        pdf.text('Precio Unit.', margin + 140, yPosition, { align: 'right' });
        pdf.text('Subtotal', pageWidth - margin, yPosition, { align: 'right' });
        yPosition += 4;
        pdf.setDrawColor(200, 98, 109);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;

        // Filas de productos
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        selectedOrderDetails.cartItems.forEach((item) => {
          const itemName = item.name || 'Producto sin nombre';
          const quantity = item.quantity || 0;
          const price = parseFloat(item.price || 0).toFixed(2);
          const subtotal = (parseFloat(item.price || 0) * (item.quantity || 0)).toFixed(2);

          // Nombre del producto (puede ser largo, usar wrap)
          const nameLines = pdf.splitTextToSize(itemName, 90);
          pdf.text(nameLines, margin, yPosition);
          pdf.text(String(quantity), margin + 100, yPosition, { align: 'right' });
          pdf.text(`$${price}`, margin + 140, yPosition, { align: 'right' });
          pdf.text(`$${subtotal}`, pageWidth - margin, yPosition, { align: 'right' });
          yPosition += Math.max(nameLines.length * 5, 6) + 2;
        });
        yPosition += sectionSpacing;
      }

      // Información de Envío
      if (selectedOrderDetails.shippingInfo) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(200, 98, 109);
        pdf.text('Información de Envío', margin, yPosition);
        yPosition += 5;
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 6;

        const shipping = selectedOrderDetails.shippingInfo;
        let yCol1 = yPosition;
        let yCol2 = yPosition;
        
        pdf.setFontSize(9);
        if (shipping.carrier) {
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(102, 102, 102);
          pdf.text('Transportista:', col1X, yCol1);
          yCol1 += lineHeight;
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          pdf.text(shipping.carrier, col1X, yCol1);
          yCol1 += lineHeight + 2;
        }
        if (shipping.serviceLevel) {
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(102, 102, 102);
          pdf.text('Servicio:', col1X, yCol1);
          yCol1 += lineHeight;
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          pdf.text(shipping.serviceLevel, col1X, yCol1);
          yCol1 += lineHeight + 2;
        }
        if (shipping.cost) {
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(102, 102, 102);
          pdf.text('Costo de Envío:', col1X, yCol1);
          yCol1 += lineHeight;
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(200, 98, 109);
          pdf.text(`$${parseFloat(shipping.cost).toFixed(2)}`, col1X, yCol1);
          yCol1 += lineHeight + 2;
        }
        if (selectedOrderDetails.trackingCode) {
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(102, 102, 102);
          pdf.text('Código de Seguimiento:', col1X, yCol1);
          yCol1 += lineHeight;
          pdf.setFont('helvetica', 'bold');
          pdf.setFont('courier', 'normal');
          pdf.setTextColor(0, 0, 0);
          pdf.text(selectedOrderDetails.trackingCode, col1X, yCol1);
          yCol1 += lineHeight + 2;
        }

        // Segunda columna para Rate ID si existe
        if (shipping.rateId) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.setTextColor(102, 102, 102);
          pdf.text('Rate ID:', col2X, yCol2);
          yCol2 += lineHeight;
          pdf.setFont('courier', 'normal');
          pdf.setFontSize(8);
          pdf.setTextColor(0, 0, 0);
          pdf.text(shipping.rateId, col2X, yCol2);
        }
        
        yPosition = Math.max(yCol1, yCol2) + sectionSpacing;
      }

      // Información del Paquete
      if (selectedOrderDetails.packageInfo && yPosition < pageHeight - 30) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(200, 98, 109);
        pdf.text('Información del Paquete', margin, yPosition);
        yPosition += 5;
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 6;

        const pkg = selectedOrderDetails.packageInfo;
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(102, 102, 102);
        pdf.text('Peso:', col1X, yPosition);
        yPosition += lineHeight;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${pkg.weight} ${pkg.weightUnit || 'lb'}`, col1X, yPosition);
        yPosition += lineHeight + 2;

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(102, 102, 102);
        pdf.text('Dimensiones:', col1X, yPosition);
        yPosition += lineHeight;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${pkg.length} × ${pkg.width} × ${pkg.height} ${pkg.distanceUnit || 'in'}`, col1X, yPosition);
      }

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
                          ) : '-'}
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
                            // En la pestaña de todas las órdenes, mostrar botones Auto/Widget
                            (order.status === 'pending' || !order.status || order.status === 'processing') && (
                              <>
                                <Button
                                  variant="contained"
                                  size="small"
                                  startIcon={<LocalShipping />}
                                  onClick={() => handleCreateShipment(order)}
                                  disabled={creatingLabel || creatingForOrderId === order.id}
                                  sx={{
                                    backgroundColor: '#C8626D',
                                    '&:hover': { backgroundColor: '#b8555a' }
                                  }}
                                >
                                  {creatingForOrderId === order.id ? 'Creando...' : 'Auto'}
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<LocalShipping />}
                                  onClick={() => handleOpenShippoElements(order)}
                                  disabled={shippoElementsOpen}
                                  sx={{
                                    borderColor: '#C8626D',
                                    color: '#C8626D',
                                    '&:hover': { 
                                      borderColor: '#b8555a',
                                      backgroundColor: '#C8626D10'
                                    }
                                  }}
                                >
                                  Widget
                                </Button>
                              </>
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
                    El shipment se creó correctamente, pero necesitas agregar un método de pago en Shippo para poder pagar la etiqueta de envío. Haz clic en el botón "Ir a Shippo" para agregar tu método de pago y completar el pago manualmente.
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
                    <strong>Paso 1:</strong> Haz clic en el botón <strong>"Ir a Shippo"</strong> que aparece abajo
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
                if (labelData.shippoUrl) {
                  window.open(labelData.shippoUrl, '_blank');
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
                    🛒 Productos ({selectedOrderDetails.cartItems.length})
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
              '&:hover': { backgroundColor: '#b8555a' }
            }}
          >
            Descargar PDF
          </Button>
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
    </>
  );
};

export default OrdersManager;
