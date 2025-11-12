import React, { createContext, useContext, useState, useMemo } from 'react';

const LanguageContext = createContext({ language: 'en', setLanguage: () => {} });

const getInitialLanguage = () => {
  if (typeof window === 'undefined') {
    return 'es';
  }

  try {
    const stored = localStorage.getItem('selectedLanguage');
    if (stored && typeof stored === 'string') {
      return stored;
    }
  } catch (error) {
    // Ignorar si no se puede leer (por ejemplo, restricciones de storage)
  }

  return 'es';
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(getInitialLanguage);

  const updateLanguage = (lang) => {
    setLanguage(lang);
    try {
      localStorage.setItem('selectedLanguage', lang);
    } catch (error) {
      // Ignorar si no se puede guardar (por ejemplo, restricciones de storage)
    }
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage: updateLanguage
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);


