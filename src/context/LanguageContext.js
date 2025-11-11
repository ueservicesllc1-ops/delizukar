import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext({ language: 'en', setLanguage: () => {} });

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const updateLanguage = (lang) => {
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: updateLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);


