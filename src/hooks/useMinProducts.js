import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export const useMinProducts = () => {
  const [minProducts, setMinProducts] = useState(1); // Cambiado temporalmente a 1
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
        const firebaseValue = data.value || 1;
        setMinProducts(firebaseValue);
        
        // Actualizar localStorage con el valor de Firebase
        localStorage.setItem('minProducts', firebaseValue.toString());
      }
    } catch (error) {
      console.error('Error loading min products from Firebase:', error);
      // Si hay error, usar el valor de localStorage o por defecto
      const cachedValue = localStorage.getItem('minProducts');
      if (cachedValue) {
        setMinProducts(parseInt(cachedValue));
      }
    } finally {
      setLoading(false);
    }
  };

  return { minProducts, loading, refreshMinProducts: loadMinProducts };
};

