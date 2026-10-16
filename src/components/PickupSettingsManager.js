import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  MenuItem,
  Grid,
  Tabs,
  Tab,
  IconButton,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Close,
  Save,
  Add,
  Delete,
  Storefront,
  AccessTime,
  EventBusy,
  ContentCopy,
  Info
} from '@mui/icons-material';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const DAY_LABELS = {
  mon: 'Lunes',
  tue: 'Martes',
  wed: 'Miércoles',
  thu: 'Jueves',
  fri: 'Viernes',
  sat: 'Sábado',
  sun: 'Domingo'
};

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const TIMEZONES = [
  { value: 'America/New_York', label: 'Hora del Este (ET) - Miami / Nueva York' },
  { value: 'America/Chicago', label: 'Hora Central (CT) - Chicago / Houston' },
  { value: 'America/Denver', label: 'Hora de la Montaña (MT) - Denver' },
  { value: 'America/Los_Angeles', label: 'Hora del Pacífico (PT) - Los Ángeles' },
  { value: 'America/Puerto_Rico', label: 'Puerto Rico (AST)' }
];

const DEFAULT_SETTINGS = {
  enabled: false,
  address: '',
  instructions: 'Toca el timbre o llama al llegar. Ten tu código de recogida listo.',
  instructionsEn: 'Ring the bell or call upon arrival. Please have your pickup code ready.',
  timezone: 'America/New_York',
  leadTimeHours: 24,
  maxDaysAhead: 30,
  slotDurationMin: 30,
  capacityPerSlot: 2,
  weeklySchedule: {
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [{ start: '10:00', end: '17:30' }],
    sun: []
  },
  blockedDates: [],
  extraDates: []
};

const PickupSettingsManager = ({ open, onClose }) => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Estados para añadir fechas
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [newExtraDate, setNewExtraDate] = useState({ date: '', start: '10:00', end: '14:00' });

  useEffect(() => {
    if (!open) return;
    loadSettings();
  }, [open]);

  const loadSettings = async () => {
    setLoading(true);
    setAlert(null);
    try {
      const snap = await getDoc(doc(db, 'settings', 'pickup'));
      if (snap.exists()) {
        const data = snap.data();
        setSettings({
          ...DEFAULT_SETTINGS,
          ...data,
          weeklySchedule: {
            ...DEFAULT_SETTINGS.weeklySchedule,
            ...(data.weeklySchedule || {})
          },
          blockedDates: Array.isArray(data.blockedDates) ? data.blockedDates : [],
          extraDates: Array.isArray(data.extraDates) ? data.extraDates : []
        });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (err) {
      console.error('Error cargando configuración de pickup:', err);
      setAlert({ severity: 'error', text: 'Error al cargar configuración: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setAlert(null);
    try {
      const payload = {
        enabled: Boolean(settings.enabled),
        address: (settings.address || '').trim(),
        instructions: (settings.instructions || '').trim(),
        instructionsEn: (settings.instructionsEn || '').trim(),
        timezone: settings.timezone || 'America/New_York',
        leadTimeHours: Math.max(0, Number(settings.leadTimeHours) || 0),
        maxDaysAhead: Math.max(1, Number(settings.maxDaysAhead) || 30),
        slotDurationMin: Math.max(5, Number(settings.slotDurationMin) || 30),
        capacityPerSlot: Math.max(1, Number(settings.capacityPerSlot) || 1),
        weeklySchedule: settings.weeklySchedule,
        blockedDates: settings.blockedDates,
        extraDates: settings.extraDates,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'settings', 'pickup'), payload, { merge: true });
      setAlert({ severity: 'success', text: '¡Configuración de recogida guardada exitosamente!' });
    } catch (err) {
      console.error('Error guardando configuración de pickup:', err);
      setAlert({ severity: 'error', text: 'Error al guardar: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  // Horarios semanales
  const handleAddRange = (day) => {
    const current = settings.weeklySchedule[day] || [];
    const next = [...current, { start: '10:00', end: '14:00' }];
    setSettings({
      ...settings,
      weeklySchedule: { ...settings.weeklySchedule, [day]: next }
    });
  };

  const handleRemoveRange = (day, index) => {
    const current = settings.weeklySchedule[day] || [];
    const next = current.filter((_, i) => i !== index);
    setSettings({
      ...settings,
      weeklySchedule: { ...settings.weeklySchedule, [day]: next }
    });
  };

  const handleRangeChange = (day, index, field, value) => {
    const current = [...(settings.weeklySchedule[day] || [])];
    current[index] = { ...current[index], [field]: value };
    setSettings({
      ...settings,
      weeklySchedule: { ...settings.weeklySchedule, [day]: current }
    });
  };

  const handleCopyMondayToWeekdays = () => {
    const mondayRanges = settings.weeklySchedule.mon || [];
    setSettings({
      ...settings,
      weeklySchedule: {
        ...settings.weeklySchedule,
        tue: JSON.parse(JSON.stringify(mondayRanges)),
        wed: JSON.parse(JSON.stringify(mondayRanges)),
        thu: JSON.parse(JSON.stringify(mondayRanges)),
        fri: JSON.parse(JSON.stringify(mondayRanges))
      }
    });
    setAlert({ severity: 'info', text: 'Horario del lunes copiado a martes, miércoles, jueves y viernes.' });
  };

  // Fechas bloqueadas
  const handleAddBlockedDate = () => {
    if (!newBlockedDate || !/^\d{4}-\d{2}-\d{2}$/.test(newBlockedDate)) return;
    if (settings.blockedDates.includes(newBlockedDate)) return;
    setSettings({
      ...settings,
      blockedDates: [...settings.blockedDates, newBlockedDate].sort()
    });
    setNewBlockedDate('');
  };

  const handleRemoveBlockedDate = (date) => {
    setSettings({
      ...settings,
      blockedDates: settings.blockedDates.filter((d) => d !== date)
    });
  };

  // Fechas extraordinarias
  const handleAddExtraDate = () => {
    if (!newExtraDate.date || !/^\d{4}-\d{2}-\d{2}$/.test(newExtraDate.date)) return;
    setSettings({
      ...settings,
      extraDates: [...settings.extraDates, { ...newExtraDate }]
    });
    setNewExtraDate({ date: '', start: '10:00', end: '14:00' });
  };

  const handleRemoveExtraDate = (index) => {
    setSettings({
      ...settings,
      extraDates: settings.extraDates.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#c8626d', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Storefront />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Configuración de Recogida en Tienda (Pickup)
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#fff' }} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1, backgroundColor: '#fdf6f7' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="inherit"
          TabIndicatorProps={{ style: { backgroundColor: '#c8626d' } }}
        >
          <Tab icon={<Storefront />} iconPosition="start" label="General y Dirección" />
          <Tab icon={<AccessTime />} iconPosition="start" label="Horario Semanal" />
          <Tab icon={<EventBusy />} iconPosition="start" label="Fechas Bloqueadas / Extra" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {alert && (
          <Alert severity={alert.severity} sx={{ mb: 2 }} onClose={() => setAlert(null)}>
            {alert.text}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: '#c8626d' }} />
          </Box>
        ) : (
          <>
            {/* TAB 0: GENERAL */}
            {tab === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Card sx={{ border: '1px solid #f0d0d5', backgroundColor: '#fff9fa' }}>
                  <CardContent sx={{ pb: '16px !important' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.enabled}
                          onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                          color="error"
                        />
                      }
                      label={
                        <Typography sx={{ fontWeight: 700, color: settings.enabled ? '#2e7d32' : '#c8626d' }}>
                          {settings.enabled
                            ? '✓ Sistema de recogida ACTIVADO para los clientes en Checkout'
                            : '✗ Sistema de recogida DESACTIVADO (los clientes solo verán envío)'}
                        </Typography>
                      }
                    />
                  </CardContent>
                </Card>

                <TextField
                  label="Dirección de recogida (tienda / punto de entrega)"
                  placeholder="Ej: 123 Sweet Street, Suite 4, Miami, FL 33101"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  fullWidth
                  required
                  helperText="Esta dirección aparecerá en el Checkout, en el Ticket de confirmación y en el correo del cliente."
                />

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Instrucciones de recogida (Español)"
                      placeholder="Ej: Toca el timbre o llama al llegar. Ten tu código listo."
                      value={settings.instructions}
                      onChange={(e) => setSettings({ ...settings, instructions: e.target.value })}
                      fullWidth
                      multiline
                      rows={3}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Instrucciones de recogida (English)"
                      placeholder="Ex: Ring the bell or call upon arrival. Please have your code ready."
                      value={settings.instructionsEn}
                      onChange={(e) => setSettings({ ...settings, instructionsEn: e.target.value })}
                      fullWidth
                      multiline
                      rows={3}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#c8626d' }}>
                  Reglas de Capacidad y Anticipación
                </Typography>

                <Alert severity="info" icon={<AccessTime />} sx={{ my: 1, borderRadius: '10px' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Regla automática de Sábados de Recogida:
                  </Typography>
                  <Typography variant="body2">
                    Los clientes ven <strong>1 solo sábado</strong> calculado automáticamente: los pedidos recibidos <strong>hasta el jueves al mediodía (12:00 PM)</strong> se agendan para ese mismo sábado. Los pedidos recibidos después pasan automáticamente al <strong>siguiente sábado</strong>.
                  </Typography>
                </Alert>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Anticipación mínima (horas)"
                      type="number"
                      value={settings.leadTimeHours}
                      onChange={(e) => setSettings({ ...settings, leadTimeHours: e.target.value })}
                      fullWidth
                      helperText="Tiempo para hornear las galletas (ej: 24h)"
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Días a futuro disponibles"
                      type="number"
                      value={settings.maxDaysAhead}
                      onChange={(e) => setSettings({ ...settings, maxDaysAhead: e.target.value })}
                      fullWidth
                      helperText="Hasta cuántos días adelante pueden agendar"
                      inputProps={{ min: 1, max: 90 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Capacidad por franja"
                      type="number"
                      value={settings.capacityPerSlot}
                      onChange={(e) => setSettings({ ...settings, capacityPerSlot: e.target.value })}
                      fullWidth
                      helperText="Pedidos máximos por cada hora/franja"
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Duración de franja (min)"
                      type="number"
                      value={settings.slotDurationMin}
                      onChange={(e) => setSettings({ ...settings, slotDurationMin: e.target.value })}
                      fullWidth
                      helperText="Intervalo de horas (ej: 30 min)"
                      inputProps={{ min: 10, max: 120, step: 5 }}
                    />
                  </Grid>
                </Grid>

                <TextField
                  select
                  label="Zona horaria de la tienda"
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  fullWidth
                  helperText="Todas las horas se calculan y muestran en esta zona horaria."
                >
                  {TIMEZONES.map((tz) => (
                    <MenuItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            )}

            {/* TAB 1: HORARIO SEMANAL */}
            {tab === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Configura los rangos de recogida para cada día de la semana. Los clientes solo podrán elegir franjas dentro de estos horarios.
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<ContentCopy />}
                    onClick={handleCopyMondayToWeekdays}
                    sx={{ color: '#c8626d', textTransform: 'none' }}
                  >
                    Copiar Lunes a Lun-Vie
                  </Button>
                </Box>

                {DAY_KEYS.map((day) => {
                  const ranges = settings.weeklySchedule[day] || [];
                  return (
                    <Card key={day} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: ranges.length ? 1 : 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontWeight: 700, width: 95 }}>
                            {DAY_LABELS[day]}
                          </Typography>
                          {ranges.length === 0 ? (
                            <Chip label="Cerrado" size="small" sx={{ backgroundColor: '#f0f0f0', color: '#888' }} />
                          ) : (
                            <Chip label={`${ranges.length} rango(s)`} size="small" color="primary" variant="outlined" />
                          )}
                        </Box>
                        <Button
                          size="small"
                          startIcon={<Add />}
                          onClick={() => handleAddRange(day)}
                          sx={{ textTransform: 'none', color: '#c8626d' }}
                        >
                          Añadir horario
                        </Button>
                      </Box>

                      {ranges.map((range, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 0.8, pl: 2 }}>
                          <TextField
                            label="Desde"
                            type="time"
                            size="small"
                            value={range.start || '10:00'}
                            onChange={(e) => handleRangeChange(day, index, 'start', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ width: 130 }}
                          />
                          <Typography variant="body2" sx={{ color: '#888' }}>a</Typography>
                          <TextField
                            label="Hasta"
                            type="time"
                            size="small"
                            value={range.end || '18:00'}
                            onChange={(e) => handleRangeChange(day, index, 'end', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ width: 130 }}
                          />
                          <IconButton size="small" color="error" onClick={() => handleRemoveRange(day, index)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Card>
                  );
                })}
              </Box>
            )}

            {/* TAB 2: FECHAS BLOQUEADAS Y EXTRA */}
            {tab === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Fechas bloqueadas */}
                <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#c8626d', mb: 0.5 }}>
                    🚫 Fechas Bloqueadas (Feriados, Vacaciones, Días cerrados)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1.5 }}>
                    En estas fechas específicas NO se permitirá seleccionar recogida.
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
                    <TextField
                      label="Fecha a bloquear"
                      type="date"
                      size="small"
                      value={newBlockedDate}
                      onChange={(e) => setNewBlockedDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ width: 220 }}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={handleAddBlockedDate}
                      disabled={!newBlockedDate}
                      sx={{ color: '#c8626d', borderColor: '#c8626d', textTransform: 'none' }}
                    >
                      Bloquear fecha
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {settings.blockedDates.length === 0 ? (
                      <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
                        No hay fechas bloqueadas.
                      </Typography>
                    ) : (
                      settings.blockedDates.map((date) => (
                        <Chip
                          key={date}
                          label={date}
                          onDelete={() => handleRemoveBlockedDate(date)}
                          color="error"
                          variant="outlined"
                        />
                      ))
                    )}
                  </Box>
                </Card>

                {/* Fechas extraordinarias */}
                <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2e7d32', mb: 0.5 }}>
                    ⭐ Fechas Especiales con Horario Extraordinario
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1.5 }}>
                    Añade días específicos con horarios adicionales (ej: eventos especiales, vísperas).
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', mb: 2 }}>
                    <TextField
                      label="Fecha especial"
                      type="date"
                      size="small"
                      value={newExtraDate.date}
                      onChange={(e) => setNewExtraDate({ ...newExtraDate, date: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={{ width: 180 }}
                    />
                    <TextField
                      label="Desde"
                      type="time"
                      size="small"
                      value={newExtraDate.start}
                      onChange={(e) => setNewExtraDate({ ...newExtraDate, start: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={{ width: 130 }}
                    />
                    <TextField
                      label="Hasta"
                      type="time"
                      size="small"
                      value={newExtraDate.end}
                      onChange={(e) => setNewExtraDate({ ...newExtraDate, end: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={{ width: 130 }}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={handleAddExtraDate}
                      disabled={!newExtraDate.date}
                      sx={{ color: '#2e7d32', borderColor: '#2e7d32', textTransform: 'none' }}
                    >
                      Añadir fecha especial
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {settings.extraDates.length === 0 ? (
                      <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
                        No hay fechas especiales configuradas.
                      </Typography>
                    ) : (
                      settings.extraDates.map((item, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 1,
                            backgroundColor: '#f6fbf6',
                            border: '1px solid #c8e6c9',
                            borderRadius: 1
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            📅 {item.date} — de {item.start} a {item.end}
                          </Typography>
                          <IconButton size="small" color="error" onClick={() => handleRemoveExtraDate(index)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      ))
                    )}
                  </Box>
                </Card>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, backgroundColor: '#fafafa', borderTop: '1px solid #eee' }}>
        <Button onClick={onClose} sx={{ color: '#666', textTransform: 'none' }}>
          Cerrar
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <Save />}
          onClick={handleSave}
          disabled={saving || loading}
          sx={{
            backgroundColor: '#c8626d',
            '&:hover': { backgroundColor: '#b0525d' },
            textTransform: 'none',
            fontWeight: 600,
            px: 3
          }}
        >
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PickupSettingsManager;
