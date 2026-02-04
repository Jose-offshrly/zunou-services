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
      loadPath: '/src/{{ns}}/locales/{{lng}}.json',
    },
    defaultNS: 'i18n',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    load: 'languageOnly', // Load 'en.json' instead of 'en-US.json'.
    ns: ['i18n'],
  })

export default i18n
