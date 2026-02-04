import { Stack } from '@mui/material'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import { QRCodeCanvas } from 'qrcode.react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import useOSDetection from '~/hooks/useOSDetection'
import { Routes } from '~/services/Routes'
import { HAS_TRIGGERED_LANDING_PAGE_KEY } from '~/utils/localStorageKeys'

import BackgroundBlur from './BackgroundBlur'
import ProductCard from './ProductCard'
import WelcomeSection from './WelcomeSection'

// Constants
export const DOWNLOAD_URLS = {
  dashboard: {
    macDMG: import.meta.env.VITE_DASHBOARD_MAC_DMG || '',
    macZIP: import.meta.env.VITE_DASHBOARD_MAC_ZIP || '',
    windows: import.meta.env.VITE_DASHBOARD_WINDOWS || '',
  },
  scout: {
    app: import.meta.env.VITE_SCOUT_WEB_APP || '',
    macDMG: import.meta.env.VITE_SCOUT_MAC_DMG || '',
    macZIP: import.meta.env.VITE_SCOUT_MAC_ZIP || '',
    windows: import.meta.env.VITE_SCOUT_WINDOWS || '',
  },
} as const

// Types
export type ProductType = 'dashboard' | 'scout'
export type AccordionState = Record<ProductType, boolean>

function DownloadLinks() {
  const { user, isLoading } = useAuthContext()
  const navigate = useNavigate()
  const { organizationId } = useOrganization()
  const os = useOSDetection()

  const [accordionExpanded, setAccordionExpanded] = useState<AccordionState>({
    dashboard: false,
    scout: false,
  })

  const handleContinueToWebApp = () => {
    // Add flag for hiding landing page
    localStorage.setItem(HAS_TRIGGERED_LANDING_PAGE_KEY, 'true')

    navigate(
      pathFor({
        pathname: Routes.OrganizationBootstrap,
        query: { organizationId },
      }),
    )
  }

  const createToggleHandler =
    (productType: ProductType) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      setAccordionExpanded((prev) => ({
        ...prev,
        [productType]: !prev[productType],
      }))
    }

  return (
    <Stack
      alignItems={{ lg: 'center' }}
      direction={{ lg: 'row', md: 'column' }}
      gap={5}
      height="100vh"
      justifyContent={{ lg: 'space-between' }}
      p="5%"
      width="100vw"
    >
      <WelcomeSection
        isLoading={isLoading}
        name={user?.name ?? ''}
        onContinue={handleContinueToWebApp}
      />

      <Stack gap={5} position="relative" width={{ lg: '50%', md: '100%' }}>
        <BackgroundBlur />

        <ProductCard
          expanded={accordionExpanded.dashboard}
          onToggle={createToggleHandler('dashboard')}
          os={os}
          productType="dashboard"
        />

        <ProductCard
          expanded={accordionExpanded.scout}
          onToggle={createToggleHandler('scout')}
          os={os}
          productType="scout"
        >
          <QRCodeCanvas
            bgColor="#ffffff"
            fgColor={theme.palette.primary.main}
            level="H"
            size={120}
            value={DOWNLOAD_URLS.scout.app}
          />
        </ProductCard>
      </Stack>
    </Stack>
  )
}

export default DownloadLinks
