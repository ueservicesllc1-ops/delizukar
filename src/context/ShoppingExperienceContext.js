import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'delizukar_shopping_modality';

const ShoppingExperienceContext = createContext();

export const ShoppingExperienceProvider = ({ children }) => {
  const [modality, setModalityState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'pickup' || saved === 'shipping') {
        return saved;
      }
    } catch (e) {
      console.warn('Error reading shopping modality from localStorage:', e);
    }
    return null;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Ya no se abre el popup modal automáticamente al inicio.
  // La selección inicial se realiza con las cartillas flotantes en el hero.
  // El modal permanece disponible a través de openModal() desde el Header.

  const setModality = useCallback((mode) => {
    if (mode === 'pickup' || mode === 'shipping') {
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch (e) {
        console.warn('Error saving shopping modality to localStorage:', e);
      }
      setModalityState(mode);
      setIsModalOpen(false);
    }
  }, []);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    // Si el cliente cierra sin elegir, no asignar automáticamente una modalidad
    setIsModalOpen(false);
  }, []);

  const clearModality = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Error clearing shopping modality from localStorage:', e);
    }
    setModalityState(null);
  }, []);

  const value = {
    modality,
    isPickup: modality === 'pickup',
    isShipping: modality === 'shipping',
    hasSelectedModality: modality === 'pickup' || modality === 'shipping',
    isModalOpen,
    openModal,
    closeModal,
    setModality,
    clearModality
  };

  return (
    <ShoppingExperienceContext.Provider value={value}>
      {children}
    </ShoppingExperienceContext.Provider>
  );
};

export const useShoppingExperience = () => {
  const context = useContext(ShoppingExperienceContext);
  if (!context) {
    throw new Error('useShoppingExperience must be used within a ShoppingExperienceProvider');
  }
  return context;
};

export default ShoppingExperienceContext;
