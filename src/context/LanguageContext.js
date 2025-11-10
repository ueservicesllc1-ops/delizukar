import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const LanguageContext = createContext({ language: 'en', setLanguage: () => {} });

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem('selectedLanguage') || 'en'; } catch { return 'en'; }
  });
  const initialLanguageRef = useRef(language);

  const updateLanguage = (lang) => {
    setLanguage(lang);
    try { localStorage.setItem('selectedLanguage', lang); } catch {}
  };

  useEffect(() => {
    if (initialLanguageRef.current === 'es') {
      updateLanguage('en');
      initialLanguageRef.current = 'en';
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: updateLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);


