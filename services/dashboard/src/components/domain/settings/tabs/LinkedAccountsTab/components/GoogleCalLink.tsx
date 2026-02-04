import googleCalendarIcon from '@zunou-react/assets/images/google-calendar-icon.png'
import { useTranslation } from 'react-i18next'

import { useGoogleCalendarLink } from '~/hooks/useGoogleCalendarLink'

import LinkAccountItem from './LinkAccountItem'

interface GoogleCalLinkProps {
  onGoogleCalendarLink?: () => void
}

const GoogleCalLink = ({ onGoogleCalendarLink }: GoogleCalLinkProps) => {
  const { t } = useTranslation()

  const {
    googleCalLinked,
    isLoadingLinkStatus,
    error,
    isSubmitting,
    toggleLink,
  } = useGoogleCalendarLink({ onGoogleCalendarLink })

  return (
    <LinkAccountItem
      description={t('google_calendar_description')}
      error={error}
      icon={googleCalendarIcon}
      isLinked={googleCalLinked}
      isLoading={isLoadingLinkStatus}
      isSubmitting={isSubmitting}
      name={t('google_calendar')}
      onClick={toggleLink}
    />
  )
}

export default GoogleCalLink
