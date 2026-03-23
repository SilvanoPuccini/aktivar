import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import es from './locales/es.json';
import pt from './locales/pt.json';

const savedLang = localStorage.getItem('aktivar_lang') || 'es';

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    pt: { translation: pt },
  },
  lng: savedLang,
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false, // React already escapes
  },
  returnNull: false,
});

export default i18n;
