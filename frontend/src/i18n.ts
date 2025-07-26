import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import language files
import enTranslation from './locales/en.json';
import viTranslation from './locales/vi.json';

// Resources object with translations
const resources = {
  en: {
    translation: enTranslation
  },
  vi: {
    translation: viTranslation
  }
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n; 