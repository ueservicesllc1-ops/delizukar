import React, { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Divider,
  Grid
} from '@mui/material';
import { LocalShipping, CheckCircle, Close } from '@mui/icons-material';
 
import useIphone16 from '../hooks/useIphone16';

const ShippingCalculator = ({ 
  open, 
  onClose, 
  orderData, 
  onShippingSelected 
}) => {
  const t = (k, fallback) => (typeof fallback === 'string' ? fallback : (typeof k === 'string' ? k : ''));
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState([]);
  const [selectedRate, setSelectedRate] = useState(null);
  const [error, setError] = useState(null);
  const isIphone16 = useIphone16();

  useEffect(() => {
    console.log('🔍 [ShippingCalculator] useEffect triggered:', { open, hasOrderData: !!orderData });
    if (open && orderData) {
      console.log('✅ [ShippingCalculator] Opening shipping calculator');
      console.log('📦 [ShippingCalculator] orderData completo:', JSON.stringify(orderData, null, 2));
      console.log('📦 [ShippingCalculator] Verificando estructura:');
      console.log('   - address_from:', !!orderData.address_from);
      console.log('   - address_to:', !!orderData.address_to);
      console.log('   - parcels:', !!orderData.parcels, Array.isArray(orderData.parcels) ? orderData.parcels.length : 'no es array');
      if (orderData.parcels && Array.isArray(orderData.parcels) && orderData.parcels.length > 0) {
        console.log('   - Primer parcel:', JSON.stringify(orderData.parcels[0], null, 2));
      }
      calculateRates();
    } else {
      console.warn('⚠️ [ShippingCalculator] No se puede calcular rates:', { open, hasOrderData: !!orderData });
    }
  }, [open, orderData]);

  const calculateRates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📦 [Calculate Rates] Starting calculateRates with order data:', orderData);
      
      // Verificar que orderData tenga la estructura correcta
      if (!orderData || !orderData.address_from || !orderData.address_to || !orderData.parcels) {
        console.error('❌ [Calculate Rates] Invalid order data structure:', orderData);
        throw new Error('Invalid order data structure');
      }
      
      console.log('✅ [Calculate Rates] Order data structure is valid');
      
      // CRÍTICO: Log detallado de los datos del paquete que se enviarán a Shippo
      // Log detallado de las direcciones que se usarán
      console.log('📍 [Calculate Rates] Direcciones que se usarán para calcular rates:');
      console.log('   📤 Origen (From):', {
        ciudad: orderData.address_from.city,
        estado: orderData.address_from.state,
        zip: orderData.address_from.zip || orderData.address_from.zipCode,
        calle: orderData.address_from.street1 || orderData.address_from.street
      });
      console.log('   📥 Destino (To):', {
        ciudad: orderData.address_to.city,
        estado: orderData.address_to.state,
        zip: orderData.address_to.zip || orderData.address_to.zipCode,
        calle: orderData.address_to.street1 || orderData.address_to.street,
        nombre: orderData.address_to.name
      });
      console.log('   ✅ Los rates se calcularán basándose en estas direcciones específicas');
      console.log('   ✅ Si cambias la dirección de destino, los rates cambiarán automáticamente');
      
      console.log('📦 [Calculate Rates] Datos del paquete que se enviarán a EasyPost:');
      orderData.parcels.forEach((parcel, idx) => {
        console.log(`   Paquete ${idx + 1}:`);
        console.log(`      - Peso: ${parcel.weight || parcel.mass} ${parcel.massUnit || parcel.mass_unit || 'lb'}`);
        console.log(`      - Dimensiones: ${parcel.length}" x ${parcel.width}" x ${parcel.height}"`);
        console.log(`      - Distance Unit: ${parcel.distanceUnit || parcel.distance_unit || 'in'}`);
        console.log(`      - Mass Unit: ${parcel.massUnit || parcel.mass_unit || 'lb'}`);
        console.log(`      - Parcel completo:`, JSON.stringify(parcel, null, 2));
      });
      console.log('✅ [Calculate Rates] Estos son los datos EXACTOS que EasyPost usará para calcular las tarifas');
      console.log('✅ [Calculate Rates] Los rates son dinámicos y cambiarán según la dirección de destino');
      
      // Obtener tarifas de EasyPost
      console.log('📦 [Calculate Rates] Getting rates from EasyPost...');
      
      // Preparar datos para EasyPost API (formato compatible con Shippo)
      const shipmentData = {
        address_from: orderData.address_from,
        address_to: orderData.address_to,
        parcels: orderData.parcels
      };
      
      // Llamar a EasyPost API
      // En desarrollo usa localhost:5000, en producción (Railway) usa window.location.origin
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:5000';
      
      console.log('🌐 [ShippingCalculator] Llamando a:', `${baseUrl}/api/easypost/shipments`);
      
      const response = await fetch(`${baseUrl}/api/easypost/shipments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shipmentData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error obteniendo tarifas de EasyPost');
      }
      
      const data = await response.json();
      const easyPostRates = data.rates || [];
      
      console.log('✅ [EasyPost] Rates recibidos de EasyPost:', easyPostRates);
      console.log('📊 [EasyPost] Cantidad total de rates:', easyPostRates.length);
      console.log('📊 [EasyPost] Total disponible antes de filtrar:', data.total_rates_available || easyPostRates.length);
      
      // Formatear rates de EasyPost al formato esperado por el componente
      const formattedRates = easyPostRates.map((rate) => {
        // Formatear nombre del servicio para mejor visualización
        let displayName = rate.service || rate.servicelevel?.name || 'Standard Shipping';
        
        // Mejorar nombres de servicios comunes
        if (displayName.includes('GroundAdvantage')) {
          displayName = 'USPS Ground Advantage';
        } else if (displayName.includes('Priority')) {
          displayName = displayName.replace('PRIORITY', 'Priority');
        } else if (displayName.includes('Express')) {
          displayName = displayName.replace('EXPRESS', 'Express');
        }
        
        return {
          id: rate.id || rate.object_id || rate.objectId,
          objectId: rate.id || rate.object_id || rate.objectId,
          carrier: rate.carrier || rate.provider || 'Unknown',
          provider: rate.provider || rate.carrier || 'Unknown',
          service: displayName,
          servicelevel: {
            name: displayName,
            token: rate.id || rate.object_id || rate.objectId
          },
          amount: parseFloat(rate.amount || rate.amount_local || rate.rate || 0),
          amount_local: parseFloat(rate.amount_local || rate.amount || rate.rate || 0),
          estimated_days: rate.estimated_days || rate.estimatedDays || rate.est_delivery_days || 3,
          currency: rate.currency || 'USD',
          easypostRateData: rate // Guardar datos completos de EasyPost
        };
      });
      
      // Ordenar por precio (más barato primero)
      const finalRates = formattedRates.sort((a, b) => {
        const priceA = parseFloat(a.amount || a.amount_local || 0);
        const priceB = parseFloat(b.amount || b.amount_local || 0);
        return priceA - priceB;
      });
      
      console.log('✅ [EasyPost] Rates FINALES que se mostrarán al usuario:', finalRates);
      finalRates.forEach((rate, idx) => {
        console.log(`   ${idx + 1}. ${rate.carrier} - ${rate.service}: $${parseFloat(rate.amount || rate.amount_local || 0).toFixed(2)}`);
      });
      
      setRates(finalRates);
    } catch (err) {
      console.error('Error calculating rates:', err);
      setError('No se pudieron obtener las tarifas de envío. Por favor, verifica la configuración de EasyPost.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRate = (rate) => {
    setSelectedRate(rate);
  };

  const handleConfirmShipping = () => {
    if (selectedRate) {
      // Para USPS, usar el service como identificador (no hay rateId como en Shippo)
      const rateId = selectedRate.uspsRateData?.mailClass || selectedRate.servicelevel?.token || selectedRate.service || 'USPS_GROUND_ADVANTAGE';
      
      // CRÍTICO: Guardar el packageInfo exacto que se usó para calcular estos rates
      // Esto asegura que cuando se cree el shipment, use las mismas dimensiones/peso
      const parcel = orderData?.parcels?.[0];
      const packageInfo = parcel ? {
        weight: String(parcel.weight || parcel.mass || '0.22'),
        weightUnit: parcel.massUnit || parcel.mass_unit || 'lb',
        length: String(parcel.length || '8'),
        width: String(parcel.width || '6'),
        height: String(parcel.height || '4'),
        distanceUnit: parcel.distanceUnit || parcel.distance_unit || 'in'
      } : null;
      
      console.log('📦 [PackageInfo] Guardando packageInfo exacto usado para calcular rates:');
      console.log('   Parcel original:', JSON.stringify(parcel, null, 2));
      console.log('   PackageInfo extraído:', JSON.stringify(packageInfo, null, 2));
      console.log('   ⚠️ Este packageInfo DEBE ser exactamente igual al usado cuando se cree el shipment');
      
          // Formatear el ETA antes de guardarlo
          const formattedETA = formatETA(selectedRate.eta, selectedRate);
          
          // Calcular transitDays en formato "2-3" basado en el carrier y service
          const calculateTransitDays = (rate) => {
            let minDays = 2;
            let maxDays = 3;
            
            const carrier = (rate.carrier || rate.provider || '').toLowerCase();
            const serviceLevel = (rate.service || rate.servicelevel?.name || '').toLowerCase();
            
            if (rate && carrier) {
              const provider = carrier;
              
              if (provider === 'usps') {
                if (serviceLevel.includes('ground') || serviceLevel.includes('advantage')) {
                  minDays = 2; maxDays = 3;
                } else if (serviceLevel.includes('priority')) {
                  minDays = 1; maxDays = 2;
                } else if (serviceLevel.includes('express')) {
                  minDays = 1; maxDays = 1;
                }
              } else if (provider === 'ups') {
                if (serviceLevel.includes('ground')) {
                  minDays = 1; maxDays = 5;
                } else if (serviceLevel.includes('standard')) {
                  minDays = 1; maxDays = 3;
                }
              } else if (provider === 'fedex' || provider === 'fedexdefault') {
                if (serviceLevel.includes('smart') || serviceLevel.includes('post')) {
                  minDays = 2; maxDays = 3;
                } else if (serviceLevel.includes('ground')) {
                  minDays = 1; maxDays = 5;
                } else if (serviceLevel.includes('standard')) {
                  minDays = 1; maxDays = 3;
                }
              } else if (provider === 'shippo') {
                minDays = 2; maxDays = 3;
              }
            }
            
            // SIEMPRE retornar con guión, incluso si es el mismo número
            // Esto evita que se guarde "23" en lugar de "2-3"
            if (minDays === maxDays) {
              return `${minDays}`;
            }
            return `${minDays}-${maxDays}`;
          };
          
          const transitDays = calculateTransitDays(selectedRate);
          const transitDaysDisplay = transitDays;
          const normalizedTransit = transitDays.replace('days', '').replace(/ /g, '').trim();
          let minTransit = 2;
          let maxTransit = 3;
          if (normalizedTransit.includes('-')) {
            const parts = normalizedTransit.split('-').map((p) => parseInt(p.trim(), 10));
            if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
              minTransit = parts[0];
              maxTransit = parts[1];
            }
          } else {
            const parsed = parseInt(normalizedTransit, 10);
            if (!Number.isNaN(parsed)) {
              minTransit = parsed;
              maxTransit = parsed;
            }
          }
          
          console.log('🔍 [ShippingCalculator] transitDays calculado:', transitDays);
          
          // Guardar TODA la información del rate para poder identificarlo después
          onShippingSelected({
            rate: {
              id: rateId,
              objectId: selectedRate.objectId || selectedRate.id,
              object_id: selectedRate.object_id || selectedRate.id,
              provider: selectedRate.provider || 'usps',
              carrier: selectedRate.carrier || 'USPS',
              service: selectedRate.service,
              servicelevel: selectedRate.servicelevel,
              amount: selectedRate.amount,
              amount_local: selectedRate.amount_local,
              // Guardar información única para identificación
              carrier_token: selectedRate.carrier_token || selectedRate.provider || 'usps',
              servicelevel_token: selectedRate.servicelevel_token || selectedRate.servicelevel?.token || rateId,
              // Guardar el rate completo como referencia (incluye datos de USPS)
              fullRate: selectedRate,
              // Guardar datos específicos de USPS para comprar etiqueta
              uspsRateData: selectedRate.uspsRateData || selectedRate
            },
            // Guardar el rateId directamente para uso en el backend (prioridad alta)
            // Para USPS, esto es el mailClass (ej: USPS_GROUND_ADVANTAGE)
            rateId: rateId,
            // CRÍTICO: Guardar packageInfo exacto usado para estos rates
            packageInfo: packageInfo,
            trackingNumber: 'PENDING', // Se generará al comprar la etiqueta
            labelUrl: null,
            packingSlipUrl: null,
            eta: formattedETA, // Usar el ETA formateado (ej: "del 15 de enero al 17 de enero")
            transitDays: transitDaysDisplay,
            minTransitDays: minTransit,
            maxTransitDays: maxTransit,
            cost: selectedRate.amount_local || selectedRate.amount,
            carrier: selectedRate.carrier || selectedRate.provider,
            serviceLevel: selectedRate.service || selectedRate.servicelevel?.name
          });
      onClose();
    }
  };

  const formatPrice = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Función para calcular fecha de envío según la lógica de la empresa
  // Recogen pedidos de lunes a jueves y envían el siguiente lunes
  const calculateShippingDate = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
    
    console.log('📆 Hoy es:', today.toLocaleDateString('es-ES'), 'Día de la semana:', currentDay);
    
    // Calcular días hasta el próximo lunes
    // Según la lógica: pedidos de lunes a jueves se envían el siguiente lunes
    // Pedidos de viernes a domingo se envían el lunes de la semana siguiente
    let daysToMonday;
    if (currentDay === 0) { // Domingo
      daysToMonday = 8; // Lunes de la semana siguiente (no el inmediato)
    } else if (currentDay === 1) { // Lunes
      daysToMonday = 7; // Siguiente lunes
    } else if (currentDay === 2) { // Martes
      daysToMonday = 6; // Siguiente lunes
    } else if (currentDay === 3) { // Miércoles
      daysToMonday = 5; // Siguiente lunes
    } else if (currentDay === 4) { // Jueves
      daysToMonday = 4; // Siguiente lunes
    } else if (currentDay === 5) { // Viernes
      daysToMonday = 10; // Lunes de la semana siguiente (no el inmediato)
    } else if (currentDay === 6) { // Sábado
      daysToMonday = 9; // Lunes de la semana siguiente (no el inmediato)
    }
    
    // Fecha de envío (próximo lunes)
    const shippingDate = new Date(today.getTime() + (daysToMonday * 24 * 60 * 60 * 1000));
    
    console.log('📦 Días hasta el lunes:', daysToMonday);
    console.log('📬 Fecha de envío:', shippingDate.toLocaleDateString('es-ES'));
    
    return shippingDate;
  };

  const formatETA = (eta, rate) => {
    // Calcular fecha de envío según la nueva lógica
    const shippingDate = calculateShippingDate();
    
    console.log('📅 Fecha de envío calculada:', shippingDate.toLocaleDateString('es-ES'));
    
    // Determinar rango de días de tránsito según el tipo de servicio
    let minDays = 2;
    let maxDays = 3;
    
    const carrier = (rate.carrier || rate.provider || '').toLowerCase();
    const serviceLevel = (rate.service || rate.servicelevel?.name || '').toLowerCase();
    
    console.log('🚚 Carrier:', carrier, 'Service:', serviceLevel);
    
    if (rate && carrier) {
      const provider = carrier;
      
      // Asignar rango de días de tránsito según el proveedor y servicio
      if (provider === 'usps') {
        if (serviceLevel.includes('ground') || serviceLevel.includes('advantage')) {
          minDays = 2; maxDays = 3; // 2-3 días
        } else if (serviceLevel.includes('priority')) {
          minDays = 1; maxDays = 2; // 1-2 días
        } else if (serviceLevel.includes('express')) {
          minDays = 1; maxDays = 1; // 1 día
        }
      } else if (provider === 'ups') {
        if (serviceLevel.includes('ground')) {
          minDays = 1; maxDays = 5; // 1-5 días
        } else if (serviceLevel.includes('standard')) {
          minDays = 1; maxDays = 3; // 1-3 días
        }
      } else if (provider === 'fedex' || provider === 'fedexdefault') {
        if (serviceLevel.includes('smart') || serviceLevel.includes('post')) {
          minDays = 2; maxDays = 3; // 2-3 días
        } else if (serviceLevel.includes('ground')) {
          minDays = 1; maxDays = 5; // 1-5 días
        } else if (serviceLevel.includes('standard')) {
          minDays = 1; maxDays = 3; // 1-3 días
        }
      } else if (provider === 'shippo') {
        // Shippo - usar valores por defecto si no hay información específica
        minDays = 2; maxDays = 3;
      }
    }
    
    console.log('📦 Días de tránsito:', minDays, '-', maxDays);
    
    // Calcular fechas de entrega: fecha de envío + rango de días
    const minDeliveryDate = new Date(shippingDate.getTime() + (minDays * 24 * 60 * 60 * 1000));
    const maxDeliveryDate = new Date(shippingDate.getTime() + (maxDays * 24 * 60 * 60 * 1000));
    
    console.log('📬 Fechas de entrega:', minDeliveryDate.toLocaleDateString('es-ES'), '-', maxDeliveryDate.toLocaleDateString('es-ES'));
    
    // Formatear fechas
    const formatDate = (date) => {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long'
      });
    };
    
    // Si es el mismo día, mostrar solo una fecha
    if (minDays === maxDays) {
      return `${formatDate(minDeliveryDate)}`;
    }
    
    // Mostrar rango de fechas
    return `del ${formatDate(minDeliveryDate)} al ${formatDate(maxDeliveryDate)}`;
  };

  const getCarrierColor = (carrier) => {
    const colors = {
      'fedex': '#4D148C',
      'ups': '#7B68EE',
      'usps': '#004B87',
      'dhl': '#D40511'
    };
    return colors[carrier] || '#c8626d';
  };

  const getCarrierName = (carrier) => {
    const names = {
      'fedex': 'FedEx',
      'ups': 'UPS',
      'usps': 'USPS',
      'dhl': 'DHL'
    };
    return names[carrier] || carrier.toUpperCase();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={
        isIphone16
          ? {
              zIndex: 1000001,
              '& .MuiDialog-container': {
                alignItems: 'center'
              }
            }
          : undefined
      }
      PaperProps={{
        sx: {
          borderRadius: '16px',
          ...(isIphone16
            ? {
                position: 'relative',
                zIndex: 1000002
              }
            : {})
        }
      }}
      slotProps={
        isIphone16
          ? {
              root: { className: 'iphone-modal-elevated' },
              backdrop: { className: 'iphone-modal-backdrop' }
            }
          : undefined
      }
      BackdropProps={
        isIphone16
          ? {
              sx: {
                zIndex: 1000000,
                backgroundColor: 'rgba(0,0,0,0.45)'
              }
            }
          : undefined
      }
    >
      <DialogTitle sx={{ 
        backgroundColor: '#c8626d', 
        color: 'white',
        borderRadius: '16px 16px 0 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalShipping />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('shippingOptions.title', 'Shipping Options')}
          </Typography>
        </Box>
        <Button
          onClick={onClose}
          sx={{ color: 'white', minWidth: 'auto', p: 1 }}
        >
          <Close />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={calculateRates}>
                Reintentar
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#c8626d', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              {t('shippingOptions.calculating', 'Calculando opciones de envío...')}
            </Typography>
          </Box>
        )}

        {!loading && rates.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
              No shipping options available
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Please check your address or try again later.
            </Typography>
            <Button 
              variant="contained" 
              onClick={calculateRates}
              sx={{ backgroundColor: '#c8626d' }}
            >
              Try Again
            </Button>
          </Box>
        )}

        {rates.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
              {t('shippingOptions.selectOption', 'Select a shipping option:')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, textAlign: 'center', color: 'text.secondary' }}>
              Found {rates.length} shipping options
            </Typography>

            <Grid container spacing={{ xs: 1, sm: 2 }} justifyContent="center">
              {rates.map((rate, index) => (
                <Grid 
                  item 
                  xs={12}        // 1 por línea en móvil
                  sm={6}         // 2 por línea en tablet
                  md={6}         // 2 por línea en laptop
                  lg={4}         // 3 por línea en desktop grande
                  xl={3}         // 4 por línea en pantallas extra grandes
                  key={index}
                >
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedRate?.object_id === rate.object_id ? '2px solid #c8626d' : '1px solid #e0e0e0',
                      transition: 'all 0.3s ease',
                      height: '100%', // Altura uniforme
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        borderColor: '#c8626d',
                        boxShadow: '0 4px 12px rgba(139, 69, 19, 0.15)',
                        transform: 'translateY(-2px)' // Efecto sutil
                      }
                    }}
                    onClick={() => handleSelectRate(rate)}
                  >
                    <CardContent 
                      sx={{ 
                        p: { xs: 1, sm: 1.5, md: 2 }, // Padding responsivo
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      {/* Header con chip y precio */}
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start', 
                        mb: { xs: 0.5, sm: 1 } 
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Chip
                            label={getCarrierName(rate.carrier || rate.provider)}
                            size="small"
                            sx={{
                              backgroundColor: getCarrierColor(rate.carrier || rate.provider),
                              color: 'white',
                              fontWeight: 600,
                              fontSize: { xs: '0.65rem', sm: '0.7rem' },
                              height: { xs: '18px', sm: '20px' }
                            }}
                          />
                        </Box>
                        
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: '#c8626d', 
                            fontWeight: 700, 
                            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' }
                          }}
                        >
                          {formatPrice(rate.amount_local || rate.amount)}
                        </Typography>
                      </Box>

                      {/* Nombre del servicio */}
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: 600, 
                          mb: { xs: 0.5, sm: 1 }, 
                          fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
                          lineHeight: 1.2
                        }}
                      >
                        {rate.service || rate.servicelevel?.name || 'Standard'}
                      </Typography>

                      {/* Información de entrega */}
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mt: 'auto' // Empuja hacia abajo
                      }}>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                            lineHeight: 1.3
                          }}
                        >
                          {formatETA(rate.eta, rate)}
                        </Typography>
                        
                        {selectedRate?.object_id === rate.object_id && (
                          <CheckCircle 
                            color="success" 
                            sx={{ 
                              fontSize: { xs: '1rem', sm: '1.2rem' }
                            }} 
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={onClose}
                sx={{
                  borderColor: '#c8626d',
                  color: '#c8626d',
                  '&:hover': {
                    borderColor: '#b5555a',
                    backgroundColor: '#c8626d10'
                  }
                }}
              >
                {t('shippingOptions.cancel', 'Cancel')}
              </Button>
              
              <Button
                variant="contained"
                onClick={handleConfirmShipping}
                disabled={!selectedRate}
                sx={{
                  backgroundColor: selectedRate ? '#c8626d' : '#ccc',
                  '&:hover': {
                    backgroundColor: selectedRate ? '#b5555a' : '#ccc'
                  }
                }}
              >
                {t('shippingOptions.confirm', 'Confirm Shipping')}
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShippingCalculator;
