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
 
import shippoService from '../services/shippoService';
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
      console.log('📦 [Calculate Rates] Datos del paquete que se enviarán a Shippo:');
      orderData.parcels.forEach((parcel, idx) => {
        console.log(`   Paquete ${idx + 1}:`);
        console.log(`      - Peso: ${parcel.weight || parcel.mass} ${parcel.massUnit || parcel.mass_unit || 'lb'}`);
        console.log(`      - Dimensiones: ${parcel.length}" x ${parcel.width}" x ${parcel.height}"`);
        console.log(`      - Distance Unit: ${parcel.distanceUnit || parcel.distance_unit || 'in'}`);
        console.log(`      - Mass Unit: ${parcel.massUnit || parcel.mass_unit || 'lb'}`);
        console.log(`      - Parcel completo:`, JSON.stringify(parcel, null, 2));
      });
      console.log('⚠️ [Calculate Rates] IMPORTANTE: Estos son los datos EXACTOS que Shippo usará para calcular las tarifas');
      console.log('⚠️ [Calculate Rates] Si estos datos son diferentes a los reales, los precios serán incorrectos');
      
      // Obtener tarifas de Shippo
      console.log('📦 [Calculate Rates] Getting rates from Shippo...');
      const rates = await shippoService.getShippingRates(
        orderData.address_from,
        orderData.address_to,
        orderData.parcels
      );
      
      console.log('📦 [Rates] Rates recibidos de Shippo (SIN FILTRAR):', rates);
      console.log('📦 [Rates] Cantidad total de rates:', rates.length);
      
      // Log detallado de cada rate recibido
      rates.forEach((rate, idx) => {
        const rateId = rate.id || rate.objectId || rate.object_id;
        const carrier = rate.provider || rate.carrier;
        const service = rate.servicelevel?.name || rate.service;
        const amount = rate.amount_local || rate.amount;
        const amountOriginal = rate.amount;
        const amountLocal = rate.amount_local;
        console.log(`   Rate ${idx + 1}:`);
        console.log(`      ID: ${rateId}`);
        console.log(`      Carrier: ${carrier}`);
        console.log(`      Service: ${service}`);
        console.log(`      Amount (original): $${amountOriginal}`);
        console.log(`      Amount (local): $${amountLocal}`);
        console.log(`      Amount (usado): $${amount}`);
        console.log(`      Rate completo:`, JSON.stringify(rate, null, 2));
      });
      
      // Log los carriers/providers disponibles para debugging
      const carriers = rates.map(rate => ({
        carrier: rate.carrier,
        provider: rate.provider,
        service: rate.service || rate.servicelevel?.name
      }));
      console.log('Available carriers/providers:', carriers);
      
      // Filtrar solo USPS, UPS, FedEx y DHL
      // Shippo puede usar 'provider' o 'carrier' en diferentes versiones de la API
      // También puede tener diferentes formatos de nombres
      const filteredRates = rates.filter(rate => {
        const carrierName = (rate.provider || rate.carrier || rate.servicelevel?.token || '').toLowerCase();
        const serviceName = (rate.service || rate.servicelevel?.name || '').toLowerCase();
        
        // Buscar en el nombre del carrier/provider y también en el servicio
        const searchText = `${carrierName} ${serviceName}`;
        
        const isUSPS = searchText.includes('usps') || 
                      searchText.includes('united states postal service') ||
                      searchText.includes('united states post');
        const isUPS = (searchText.includes('ups') || searchText.includes('united parcel')) && 
                     !searchText.includes('usps');
        const isFedEx = searchText.includes('fedex') || 
                       searchText.includes('federal express') ||
                       searchText.includes('fedex_');
        const isDHL = searchText.includes('dhl') || 
                     searchText.includes('dhl_') ||
                     searchText.includes('dhlecommerce') ||
                     searchText.includes('dhl ecommerce');
        
        return isUSPS || isUPS || isFedEx || isDHL;
      });
      
      // Log detallado para debugging
      console.log('🔍 Debugging carriers:');
      rates.forEach((rate, idx) => {
        const carrierName = rate.provider || rate.carrier || 'N/A';
        const serviceName = rate.service || rate.servicelevel?.name || 'N/A';
        console.log(`  Rate ${idx}: provider="${carrierName}", carrier="${rate.carrier}", service="${serviceName}"`);
      });
      
      // Separar por carrier y limitar a 3 opciones por carrier
      const groupedRates = {
        usps: [],
        ups: [],
        fedex: [],
        dhl: []
      };
      
      filteredRates.forEach(rate => {
        const carrierName = (rate.provider || rate.carrier || rate.servicelevel?.token || '').toLowerCase();
        const serviceName = (rate.service || rate.servicelevel?.name || '').toLowerCase();
        const searchText = `${carrierName} ${serviceName}`;
        const amount = parseFloat(rate.amount || rate.amount_local || 0);
        
        if (searchText.includes('usps') || searchText.includes('united states postal service') || searchText.includes('united states post')) {
          groupedRates.usps.push(rate);
        } else if ((searchText.includes('ups') || searchText.includes('united parcel')) && !searchText.includes('usps')) {
          groupedRates.ups.push(rate);
        } else if (searchText.includes('fedex') || searchText.includes('federal express') || searchText.includes('fedex_')) {
          groupedRates.fedex.push(rate);
        } else if (searchText.includes('dhl') || searchText.includes('dhl_') || searchText.includes('dhlecommerce') || searchText.includes('dhl ecommerce')) {
          groupedRates.dhl.push(rate);
        }
      });
      
      console.log('📊 Rates agrupados:', {
        usps: groupedRates.usps.length,
        ups: groupedRates.ups.length,
        fedex: groupedRates.fedex.length,
        dhl: groupedRates.dhl.length
      });
      
      // Ordenar por precio (más barato primero) y limitar a 3 por carrier
      const limitRates = (ratesArray, limit = 3) => {
        return ratesArray
          .sort((a, b) => {
            const priceA = parseFloat(a.amount || a.amount_local || 0);
            const priceB = parseFloat(b.amount || b.amount_local || 0);
            return priceA - priceB;
          })
          .slice(0, limit);
      };
      
      // Limitar a 3 opciones de cada carrier (las 3 más baratas)
      const finalRates = [
        ...limitRates(groupedRates.usps, 3), // Máximo 3 de USPS
        ...limitRates(groupedRates.ups, 3),  // Máximo 3 de UPS
        ...limitRates(groupedRates.fedex, 3), // Máximo 3 de FedEx
        ...limitRates(groupedRates.dhl, 3)   // Máximo 3 de DHL
      ];
      
      console.log('📦 [Rates] Filtered rates (máximo 3 de cada carrier):', finalRates);
      console.log(`📦 [Rates] Found ${finalRates.length} rates: USPS(${limitRates(groupedRates.usps, 3).length}), UPS(${limitRates(groupedRates.ups, 3).length}), FedEx(${limitRates(groupedRates.fedex, 3).length}), DHL(${limitRates(groupedRates.dhl, 3).length})`);
      
      // Log detallado de los rates finales que se mostrarán al usuario
      console.log('📦 [Rates] Rates FINALES que se mostrarán al usuario:');
      finalRates.forEach((rate, idx) => {
        const rateId = rate.id || rate.objectId || rate.object_id;
        const carrier = rate.provider || rate.carrier;
        const service = rate.servicelevel?.name || rate.service;
        const amount = parseFloat(rate.amount || rate.amount_local || 0);
        console.log(`   ${idx + 1}. ${carrier} - ${service}: $${amount.toFixed(2)}`);
        console.log(`      Rate ID: ${rateId}`);
        console.log(`      Amount original: $${rate.amount}`);
        console.log(`      Amount local: $${rate.amount_local}`);
        console.log(`      Amount usado: $${amount}`);
      });
      
      setRates(finalRates);
    } catch (err) {
      console.error('Error calculating rates:', err);
      setError('No se pudieron obtener las tarifas de envío. Por favor, verifica la configuración de Shippo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRate = (rate) => {
    setSelectedRate(rate);
  };

  const handleConfirmShipping = () => {
    if (selectedRate) {
      // Obtener el ID del rate para guardarlo directamente
      const rateId = selectedRate.id || selectedRate.objectId || selectedRate.object_id;
      
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
          const transitDaysDisplay = transitDays.includes('-') ? `${transitDays} days` : `${transitDays} days`;
          
          console.log('🔍 [ShippingCalculator] transitDays calculado:', transitDays);
          
          // Guardar TODA la información del rate para poder identificarlo después
          onShippingSelected({
            rate: {
              id: rateId,
              objectId: selectedRate.objectId || selectedRate.id,
              object_id: selectedRate.object_id || selectedRate.id,
              provider: selectedRate.provider,
              carrier: selectedRate.carrier,
              service: selectedRate.service,
              servicelevel: selectedRate.servicelevel,
              amount: selectedRate.amount,
              amount_local: selectedRate.amount_local,
              // Guardar información única para identificación
              carrier_token: selectedRate.carrier_token || selectedRate.provider,
              servicelevel_token: selectedRate.servicelevel_token || selectedRate.servicelevel?.token,
              // Guardar el rate completo como referencia
              fullRate: selectedRate
            },
            // Guardar el rateId directamente para uso en el backend (prioridad alta)
            rateId: rateId,
            // CRÍTICO: Guardar packageInfo exacto usado para estos rates
            packageInfo: packageInfo,
            trackingNumber: 'PENDING', // Se generará al comprar la etiqueta
            labelUrl: null,
            packingSlipUrl: null,
            eta: formattedETA, // Usar el ETA formateado (ej: "del 15 de enero al 17 de enero")
            transitDays: transitDaysDisplay,
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
