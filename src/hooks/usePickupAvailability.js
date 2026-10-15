import { useState, useEffect, useCallback } from 'react';
import { getApiBase } from '../utils/pickup';

/**
 * Carga la disponibilidad de pickup (horarios configurados por el admin) desde el backend.
 */
const usePickupAvailability = () => {
  const [state, setState] = useState({
    loading: true,
    error: false,
    enabled: false,
    slots: [],
    address: '',
    instructions: '',
    instructionsEn: '',
    leadTimeHours: 0
  });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: false }));
    try {
      const response = await fetch(`${getApiBase()}/api/pickup/availability`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setState({
        loading: false,
        error: false,
        enabled: !!data.enabled,
        slots: Array.isArray(data.slots) ? data.slots : [],
        address: data.address || '',
        instructions: data.instructions || '',
        instructionsEn: data.instructionsEn || '',
        leadTimeHours: data.leadTimeHours || 0
      });
    } catch (error) {
      console.warn('⚠️ [Pickup] No se pudo cargar la disponibilidad:', error.message);
      // Si falla, el pickup simplemente no se ofrece (el envío sigue funcionando)
      setState((prev) => ({ ...prev, loading: false, error: true, enabled: prev.enabled }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
};

export default usePickupAvailability;
