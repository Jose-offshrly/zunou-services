import { Stack } from '@mui/system'
import { useTranslation } from 'react-i18next'

import { OS } from '~/hooks/useOSDetection'

import { DOWNLOAD_URLS, ProductType } from '.'
import RedirectButton from './RedirectButton'

const DownloadButtons = ({
  productType,
  os,
}: {
  productType: ProductType
  os: OS
}) => {
  const { t } = useTranslation(['onboarding'])
  const urls = DOWNLOAD_URLS[productType]

  if (os === OS.MacOS) {
    return (
      <Stack direction="row" gap={5}>
        <RedirectButton
          text={t('macosZip', { ns: 'onboarding' })}
          url={urls.macZIP}
        />
        <RedirectButton
          text={t('macosDmg', { ns: 'onboarding' })}
          url={urls.macDMG}
        />
      </Stack>
    )
  }

  return (
    <Stack direction="row" gap={5}>
      <RedirectButton
        text={t('windows', { ns: 'onboarding' })}
        url={urls.windows}
      />
    </Stack>
  )
}

export default DownloadButtons
