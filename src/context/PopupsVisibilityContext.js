import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const DEFAULT_POPUPS_VISIBILITY = {
  showCookieBoxPromo: true,   // Popup inferior derecho ("Arma tu caja de galletas")
  showPickupFlyer: true,      // Cartilla izquierda en cabecera (Recogida Local)
  showShippingFlyer: true,    // Cartilla derecha en cabecera (Envíos Nacionales)
  showCookieWeightChip: true, // Chip flotante de peso sobre el banner
  showPopupHero: true,        // Popup central de bienvenida / ofertas
  showExperienceModal: true   // Modal emergente de modalidad de compra
};

const PopupsVisibilityContext = createContext({
  visibility: DEFAULT_POPUPS_VISIBILITY,
  updateVisibility: async () => {},
  loading: false
});

export const PopupsVisibilityProvider = ({ children }) => {
  const [visibility, setVisibility] = useState(DEFAULT_POPUPS_VISIBILITY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'popupsVisibility');
    const unsubscribe = onSnapshot(
      settingsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setVisibility({
            ...DEFAULT_POPUPS_VISIBILITY,
            ...data
          });
        } else {
          setVisibility(DEFAULT_POPUPS_VISIBILITY);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Error escuchando configuración de popups:', error);
        setVisibility(DEFAULT_POPUPS_VISIBILITY);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateVisibility = async (newSettings) => {
    const settingsRef = doc(db, 'settings', 'popupsVisibility');
    const merged = { ...visibility, ...newSettings };
    await setDoc(settingsRef, merged, { merge: true });
    setVisibility(merged);
  };

  return (
    <PopupsVisibilityContext.Provider value={{ visibility, updateVisibility, loading }}>
      {children}
    </PopupsVisibilityContext.Provider>
  );
};

export const usePopupsVisibility = () => useContext(PopupsVisibilityContext);
export default PopupsVisibilityContext;
