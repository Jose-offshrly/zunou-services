import microsoftTeamsIcon from '@zunou-react/assets/images/microsoft-teams-icon.png'
import { useTranslation } from 'react-i18next'

import LinkAccountItem from './LinkAccountItem'

const TeamsLink = () => {
  const { t } = useTranslation()

  return (
    <LinkAccountItem
      description={t('microsoft_teams_description')}
      icon={microsoftTeamsIcon}
      isDisabled={true}
      name={t('microsoft_teams')}
    />
  )
}

export default TeamsLink
