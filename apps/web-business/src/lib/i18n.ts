import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

export const AVAILABLE_LANGUAGES = ['en', 'el', 'lt'];

const DEFAULT_LANGUAGE = 'en';

// Migrate old 'gr' language code to 'el'
if (typeof window !== 'undefined') {
    const storedLng = localStorage.getItem('i18nextLng');
    if (storedLng === 'gr') {
        localStorage.setItem('i18nextLng', 'el');
    }
}

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: DEFAULT_LANGUAGE,
        // defaultNS: 'dashboard',

        backend: {
            loadPath: import.meta.env.PROD
                ? '/locales/{{lng}}.json'
                : '/src/locales/{{lng}}.json',
        },

        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
        },

        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;