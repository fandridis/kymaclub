import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => void;
  availableLanguages: { code: string; name: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'el', name: 'Ελληνικά' }
  ];

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    setCurrentLanguage(language);

    // Update HTML lang attribute
    document.documentElement.lang = language;

    // Store in localStorage
    localStorage.setItem('kymaclub-i18nextLng', language);
  };

  useEffect(() => {
    // Set initial language
    const savedLanguage = localStorage.getItem('kymaclub-i18nextLng') || i18n.language || 'en';
    if (savedLanguage !== currentLanguage) {
      changeLanguage(savedLanguage);
    }

    // Update HTML lang attribute on mount
    document.documentElement.lang = currentLanguage;
  }, []);

  const value = {
    currentLanguage,
    changeLanguage,
    availableLanguages
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
