import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    debug: true,
    defaultNS: 'common',
    detection: {
      caches: ['cookie'],
      cookieMinutes: 7 * 24 * 60 * 1000,
      lookupCookie: 'lng',
      order: ['cookie', 'localStorage', 'navigator'],
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    load: 'languageOnly',
    ns: [
      'common',
      'agent',
      'settings',
      'feed',
      'sources',
      'org',
      'notes',
      'topics',
    ],
    supportedLngs: ['en', 'ja'],
  })

export default i18n
