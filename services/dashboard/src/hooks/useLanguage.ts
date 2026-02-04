import i18n from 'i18next'
import { useCookies } from 'react-cookie'

type Language = 'en' | 'ja'

interface UseLanguageReturn {
  selectedLanguage: Language
  setLanguage: (lang: Language) => void
}

export const useLanguage = (): UseLanguageReturn => {
  const [cookies, setCookie] = useCookies(['lng'])

  const rawLanguage = cookies.lng || 'en'
  const selectedLanguage = rawLanguage.split('-')[0] as Language

  const setLanguage = (lang: Language) => {
    const expires = new Date()
    expires.setDate(expires.getDate() + 7)

    setCookie('lng', lang, {
      expires,
      path: '/',
      sameSite: 'lax',
      secure: true,
    })

    i18n.changeLanguage(lang)
  }

  return {
    selectedLanguage,
    setLanguage,
  }
}
