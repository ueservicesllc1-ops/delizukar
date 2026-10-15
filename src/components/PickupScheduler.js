import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, IconButton, Button, Alert, CircularProgress } from '@mui/material';
import { ChevronLeft, ChevronRight, Place, InfoOutlined } from '@mui/icons-material';
import {
  getPickupText,
  getLocale,
  formatPickupDate,
  formatPickupTime
} from '../utils/pickup';

const WEEKDAYS = {
  es: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
  en: ['S', 'M', 'T', 'W', 'T', 'F', 'S']
};

const pad = (n) => String(n).padStart(2, '0');

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

  const monthOf = (dateStr) => {
    const [y, m] = dateStr.split('-').map(Number);
    return { y, m: m - 1 };
  };

  const [viewMonth, setViewMonth] = useState(null);

  // Mostrar el mes del primer día disponible (o del día ya elegido)
  useEffect(() => {
    if (!availableDates.length) return;
    setViewMonth((prev) => prev || monthOf(value?.date && slotsByDate[value.date] ? value.date : availableDates[0]));
  }, [availableDates, slotsByDate, value]);

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

  if (!availableDates.length || !viewMonth) {
    return (
      <Box>
        {header}
        <Alert severity="info">{text.noSlots}</Alert>
      </Box>
    );
  }

  const { y, m } = viewMonth;
  const firstWeekday = new Date(Date.UTC(y, m, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const firstMonth = monthOf(availableDates[0]);
  const lastMonth = monthOf(availableDates[availableDates.length - 1]);
  const canPrev = y > firstMonth.y || (y === firstMonth.y && m > firstMonth.m);
  const canNext = y < lastMonth.y || (y === lastMonth.y && m < lastMonth.m);
  const monthLabel = new Date(Date.UTC(y, m, 1)).toLocaleDateString(getLocale(language), {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  });

  const goMonth = (delta) => {
    const d = new Date(Date.UTC(y, m + delta, 1));
    setViewMonth({ y: d.getUTCFullYear(), m: d.getUTCMonth() });
  };

  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(`${y}-${pad(m + 1)}-${pad(d)}`);

  const selectedDate = value?.date || null;
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

      {/* Calendario */}
      <Box sx={{ border: '1px solid #eee', borderRadius: '12px', p: 1.5, backgroundColor: '#fff' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <IconButton size="small" onClick={() => goMonth(-1)} disabled={!canPrev} aria-label="prev-month">
            <ChevronLeft />
          </IconButton>
          <Typography sx={{ fontWeight: 700, textTransform: 'capitalize', color: '#333' }}>{monthLabel}</Typography>
          <IconButton size="small" onClick={() => goMonth(1)} disabled={!canNext} aria-label="next-month">
            <ChevronRight />
          </IconButton>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, textAlign: 'center' }}>
          {WEEKDAYS[lang].map((label, index) => (
            <Typography key={`${label}-${index}`} variant="caption" sx={{ color: '#999', fontWeight: 700 }}>
              {label}
            </Typography>
          ))}
          {cells.map((dateStr, index) => {
            if (!dateStr) return <Box key={`empty-${index}`} />;
            const available = !!slotsByDate[dateStr];
            const selected = selectedDate === dateStr;
            return (
              <Button
                key={dateStr}
                disabled={!available}
                onClick={() => onChange({ date: dateStr, time: null })}
                sx={{
                  minWidth: 0,
                  p: 0,
                  height: 38,
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: selected ? '#fff' : available ? '#c8626d' : '#bbb',
                  backgroundColor: selected ? '#c8626d' : available ? '#fdeeee' : 'transparent',
                  '&:hover': { backgroundColor: selected ? '#b5555a' : '#fbdcdc' },
                  '&.Mui-disabled': { color: '#ccc' }
                }}
              >
                {Number(dateStr.slice(8))}
              </Button>
            );
          })}
        </Box>
      </Box>

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
