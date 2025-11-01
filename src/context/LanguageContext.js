import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext({ language: 'es', setLanguage: () => {} });

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem('selectedLanguage') || 'es'; } catch { return 'es'; }
  });

  const updateLanguage = (lang) => {
    setLanguage(lang);
    try { localStorage.setItem('selectedLanguage', lang); } catch {}
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: updateLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);


