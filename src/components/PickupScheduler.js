import React, { useEffect, useMemo } from 'react';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import { Place, InfoOutlined, EventAvailable } from '@mui/icons-material';
import {
  getPickupText,
  formatPickupDate,
  formatPickupTime
} from '../utils/pickup';


/**
 * Calendario de fechas + horas disponibles para recoger el pedido.
 * `availability` viene de usePickupAvailability(); `value` = { date, time } | null.
 */
const PickupScheduler = ({ availability, value, onChange, language }) => {
  const text = getPickupText(language);
  const lang = language === 'en' ? 'en' : 'es';
  const { loading, error, slots, address, instructions, instructionsEn, refresh } = availability;

  const slotsByDate = useMemo(() => {
    const map = {};
    (slots || []).forEach((slot) => {
      if (!map[slot.date]) map[slot.date] = [];
      map[slot.date].push(slot);
    });
    return map;
  }, [slots]);

  const availableDates = useMemo(() => Object.keys(slotsByDate).sort(), [slotsByDate]);

  // Auto-seleccionar la fecha automáticamente en cuanto se carguen las opciones
  useEffect(() => {
    if (!availableDates.length || typeof onChange !== 'function') return;
    if (!value?.date || !availableDates.includes(value.date)) {
      onChange({ date: availableDates[0], time: null });
    }
  }, [availableDates, value?.date, onChange]);

  // Si la selección ya no está disponible (se llenó/venció), limpiarla
  useEffect(() => {
    if (!value) return;
    const daySlots = slotsByDate[value.date] || [];
    const stillThere = value.time ? daySlots.some((s) => s.time === value.time) : daySlots.length > 0;
    if (!stillThere && typeof onChange === 'function') onChange(null);
  }, [slotsByDate, value, onChange]);

  const instructionsText = lang === 'en' ? (instructionsEn || instructions) : instructions;

  const header = (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#333' }}>
        {text.pickupTitle}
      </Typography>
      <Typography variant="body2" sx={{ color: '#777' }}>
        {text.pickupSubtitle}
      </Typography>
    </Box>
  );

  if (loading && !slots.length) {
    return (
      <Box>
        {header}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
          <CircularProgress size={20} sx={{ color: '#c8626d' }} />
          <Typography variant="body2" sx={{ color: '#666' }}>{text.loading}</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        {header}
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={refresh}>{text.retry}</Button>}>
          {text.loadError}
        </Alert>
      </Box>
    );
  }

  if (!availableDates.length) {
    return (
      <Box>
        {header}
        <Alert severity="info">{text.noSlots}</Alert>
      </Box>
    );
  }

  const selectedDate = value?.date || availableDates[0] || null;
  const timesForSelected = selectedDate ? slotsByDate[selectedDate] || [] : [];

  return (
    <Box>
      {header}

      {(address || instructionsText) && (
        <Box sx={{ mb: 2, p: 1.5, borderRadius: '10px', backgroundColor: '#faf5f4', border: '1px solid #f0dcd9' }}>
          {address && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Place sx={{ color: '#c8626d', fontSize: '1.2rem', mt: '2px' }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#888', textTransform: 'uppercase' }}>{text.address}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>{address}</Typography>
              </Box>
            </Box>
          )}
          {instructionsText && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mt: address ? 1 : 0 }}>
              <InfoOutlined sx={{ color: '#c8626d', fontSize: '1.2rem', mt: '2px' }} />
              <Typography variant="body2" sx={{ color: '#555' }}>{instructionsText}</Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Sábado de recogida: automático si es 1 fecha, o lista si hay varias */}
      {availableDates.length === 1 ? (
        <Box
          sx={{
            p: 1.8,
            borderRadius: '12px',
            border: '2px solid #c8626d',
            backgroundColor: '#c8626d',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            boxShadow: '0 3px 10px rgba(200, 98, 109, 0.25)'
          }}
        >
          <EventAvailable sx={{ color: '#fff', fontSize: '1.8rem' }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#ffebee', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, display: 'block' }}>
              {text.autoDateBadge}
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', textTransform: 'capitalize' }}>
              {formatPickupDate(availableDates[0], language)}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {availableDates.map((dateStr) => {
            const selected = selectedDate === dateStr;
            return (
              <Button
                key={dateStr}
                onClick={() => onChange({ date: dateStr, time: null })}
                startIcon={<EventAvailable />}
                sx={{
                  justifyContent: 'flex-start',
                  textTransform: 'capitalize',
                  p: 1.5,
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  border: '2px solid',
                  borderColor: selected ? '#c8626d' : '#f0dcd9',
                  color: selected ? '#fff' : '#c8626d',
                  backgroundColor: selected ? '#c8626d' : '#fdeeee',
                  '&:hover': { backgroundColor: selected ? '#b5555a' : '#fbdcdc' }
                }}
              >
                {formatPickupDate(dateStr, language)}
              </Button>
            );
          })}
        </Box>
      )}

      {/* Horas */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#333', mb: 1 }}>
          {selectedDate ? formatPickupDate(selectedDate, language) : text.selectDate}
          {selectedDate ? ` · ${text.selectTime}` : ''}
        </Typography>
        {selectedDate && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {timesForSelected.map((slot) => {
              const selected = value?.time === slot.time;
              return (
                <Button
                  key={slot.time}
                  onClick={() => onChange({ date: slot.date, time: slot.time })}
                  variant={selected ? 'contained' : 'outlined'}
                  size="small"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: '20px',
                    px: 2,
                    borderColor: '#c8626d',
                    color: selected ? '#fff' : '#c8626d',
                    backgroundColor: selected ? '#c8626d' : 'transparent',
                    '&:hover': { backgroundColor: selected ? '#b5555a' : '#fdeeee', borderColor: '#c8626d' }
                  }}
                >
                  {formatPickupTime(slot.time)}
                </Button>
              );
            })}
          </Box>
        )}
      </Box>

      {value?.date && value?.time && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {text.selected
            .replace('{date}', formatPickupDate(value.date, language))
            .replace('{time}', formatPickupTime(value.time))}
        </Alert>
      )}
    </Box>
  );
};

export default PickupScheduler;
