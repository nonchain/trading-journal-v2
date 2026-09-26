import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/assets/locales/en.json';
import fa from '@/assets/locales/fa.json';
import type { Locale } from './schemas';

const resources = {
  en: { translation: en },
  fa: { translation: fa },
};

let initialized = false;

export async function initI18n(locale: Locale = 'en') {
  if (!initialized) {
    await i18n.use(initReactI18next).init({
      resources,
      lng: locale,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
    });
    initialized = true;
  } else if (i18n.language !== locale) {
    await i18n.changeLanguage(locale);
  }
  applyDocumentDirection(locale);
  return i18n;
}

export function applyDocumentDirection(locale: Locale) {
  const dir = locale === 'fa' ? 'rtl' : 'ltr';
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }
}

export async function setLocale(locale: Locale) {
  await i18n.changeLanguage(locale);
  applyDocumentDirection(locale);
}

export { i18n };
