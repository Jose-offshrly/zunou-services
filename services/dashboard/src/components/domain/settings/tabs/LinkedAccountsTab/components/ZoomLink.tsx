import zoomIcon from '@zunou-react/assets/images/zoom-icon.png'
import { useTranslation } from 'react-i18next'

import LinkAccountItem from './LinkAccountItem'

const ZoomLink = () => {
  const { t } = useTranslation()

  return (
    <LinkAccountItem
      description={t('zoom_description')}
      icon={zoomIcon}
      isDisabled={true}
      name={t('zoom')}
    />
  )
}

export default ZoomLink
