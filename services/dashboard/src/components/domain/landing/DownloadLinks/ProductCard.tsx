import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from '@mui/material'
import { Button } from '@zunou-react/components/form'
import { useTranslation } from 'react-i18next'

import { OS } from '~/hooks/useOSDetection'

import ComingSoonAppStore from '../../../../assets/coming-soon-app-store.jpg'
import ComingSoonPlayStore from '../../../../assets/coming-soon-play-store.jpg'
import { ProductType } from '.'
import DownloadButtons from './DownloadButtons'

const ProductCard = ({
  productType,
  os,
  expanded,
  onToggle,
  children,
}: {
  productType: ProductType
  os: OS
  expanded: boolean
  onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void
  children?: React.ReactNode
}) => {
  const { t } = useTranslation(['onboarding'])

  // Get localized product info
  const getProductInfo = (type: ProductType) => {
    if (type === 'dashboard') {
      return {
        description: t('hubDescription', { ns: 'onboarding' }),
        title: t('desktopTitle', { ns: 'onboarding' }),
      }
    }
    return {
      description: t('scoutDescription', { ns: 'onboarding' }),
      title: t('mobileTitle', { ns: 'onboarding' }),
    }
  }

  const product = getProductInfo(productType)

  return (
    <Stack
      alignItems={productType === 'scout' ? 'center' : 'stretch'}
      bgcolor="common.white"
      border={1}
      borderColor="divider"
      borderRadius={4}
      direction={productType === 'scout' ? 'row' : 'column'}
      flexWrap="wrap-reverse"
      gap={4}
      height="100%"
      justifyContent={productType === 'scout' ? 'space-between' : 'stretch'}
      p={4}
      width="100%"
      zIndex={50}
    >
      <Stack flex={1} gap={3} justifyContent="space-between">
        <Stack gap={1}>
          <Typography fontWeight={700} variant="h5">
            {product.title}
          </Typography>
          <Typography color="text.secondary">{product.description}</Typography>
        </Stack>

        <Accordion
          disableGutters={true}
          elevation={0}
          expanded={expanded}
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onChange={() => {}}
          square={true}
          sx={{
            '&:before': { display: 'none' },
            border: 'none',
            p: productType === 'scout' ? 0 : undefined,
          }}
        >
          <AccordionSummary
            sx={{
              '& .MuiAccordionSummary-content': { margin: 0 },
              '& .MuiAccordionSummary-content.Mui-expanded': { margin: 0 },
              '&.MuiAccordionSummary-root': { minHeight: 'unset' },
              minHeight: 'unset',
              p: 0,
            }}
          >
            <Stack
              alignItems="center"
              direction="row"
              gap={2}
              justifyContent="space-between"
              width="100%"
            >
              <DownloadButtons os={os} productType={productType} />
              <Button
                onClick={onToggle}
                sx={{ color: 'text.secondary' }}
                variant="text"
              >
                {expanded
                  ? t('seeLess', { ns: 'onboarding' })
                  : t('seeMore', { ns: 'onboarding' })}
              </Button>
            </Stack>
          </AccordionSummary>

          <AccordionDetails sx={{ px: 0, py: 0.5 }}>
            <DownloadButtons
              os={os === OS.MacOS ? OS.Windows : OS.MacOS}
              productType={productType}
            />
          </AccordionDetails>
        </Accordion>

        {productType === 'scout' && (
          <Stack
            borderTop={1}
            direction="row"
            gap={2}
            pt={2.5}
            sx={{ borderColor: 'divider' }}
          >
            <img
              alt="Coming Soon - Play Store"
              src={ComingSoonPlayStore}
              width={120}
            />
            <img
              alt="Coming Soon - App Store"
              src={ComingSoonAppStore}
              width={120}
            />
          </Stack>
        )}
      </Stack>

      {children && <Stack width="fit-content">{children}</Stack>}
    </Stack>
  )
}

export default ProductCard
