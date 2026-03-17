import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export const useMinProducts = () => {
  const [minProducts, setMinProducts] = useState(4); // Default to 4 as per the 'rule of 4'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMinProducts();
  }, []);

  const loadMinProducts = async () => {
    try {
      // Primero intentar cargar desde localStorage para respuesta rápida
      const cachedMinProducts = localStorage.getItem('minProducts');
      if (cachedMinProducts) {
        setMinProducts(parseInt(cachedMinProducts));
        setLoading(false);
      }

      // Luego cargar desde Firebase para obtener el valor más actualizado
      const docRef = doc(db, 'settings', 'minProducts');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Default to 4 if value is 0, undefined or 1 (as per the new policy)
        const firebaseValue = (data.value !== undefined && data.value > 0) ? data.value : 4;
        setMinProducts(firebaseValue);
        
        // Actualizar localStorage con el valor de Firebase
        localStorage.setItem('minProducts', firebaseValue.toString());
      } else {
        // If document doesn't exist, ensure we use 4
        setMinProducts(4);
        localStorage.setItem('minProducts', '4');
      }
    } catch (error) {
      console.error('Error loading min products from Firebase:', error);
      // Si hay error, usar el valor de localStorage o por defecto (4)
      const cachedValue = localStorage.getItem('minProducts');
      if (cachedValue) {
        setMinProducts(parseInt(cachedValue));
      } else {
        setMinProducts(4);
      }
    } finally {
      setLoading(false);
    }
  };

  return { minProducts, loading, refreshMinProducts: loadMinProducts };
};

