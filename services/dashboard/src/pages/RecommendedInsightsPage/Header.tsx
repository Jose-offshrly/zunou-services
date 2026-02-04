import { LightModeOutlined } from '@mui/icons-material'
import { Stack, Typography } from '@mui/material'
import zunouLogoTransparent from '@zunou-react/assets/images/zunou-icon-white-transparent.svg'
import { Button, IconButton } from '@zunou-react/components/form'
import { pathFor } from '@zunou-react/services/Routes'
import { useNavigate, useParams } from 'react-router-dom'

import { FloatingNav } from '~/components/domain/navigation/FloatingNav'
import { Routes } from '~/services/Routes'

export const Header = () => {
  const navigate = useNavigate()
  const { organizationId } = useParams()

  const navigateToVitals = () =>
    navigate(
      pathFor({
        pathname: Routes.Vitals,
        query: {
          organizationId,
        },
      }),
    )

  const pathToZunou = pathFor({
    pathname: Routes.OrganizationBootstrap,
    query: { organizationId },
  })

  return (
    <Stack direction="row" justifyContent="space-between">
      <FloatingNav logoSrc={zunouLogoTransparent} pathTo={pathToZunou} />

      <Stack alignItems="center" direction="row" spacing={3}>
        <Typography color="common.white" variant="h5">
          Insights
        </Typography>
        <Typography color="common.white" variant="body2">
          POWERED BY ZUNOU
        </Typography>
      </Stack>

      <Stack alignItems="center" direction="row" spacing={2}>
        <IconButton
          sx={{
            '&:hover': {
              bgcolor: 'primary.main',
              color: 'common.white',
            },
            bgcolor: 'common.white',
            border: '1px solid',
            borderColor: 'common.white',
            color: 'text.primary',
            height: 32,
            transition: 'background-color 0.2s ease, color 0.2s ease',
            width: 32,
          }}
        >
          <LightModeOutlined fontSize="small" />
        </IconButton>
        <Button
          color="inherit"
          onClick={navigateToVitals}
          sx={{
            '&:hover': {
              bgcolor: 'primary.main',
              color: 'common.white',
            },
            bgcolor: 'white',
            border: '1px solid',
            borderColor: 'grey.300',
            borderRadius: 99,
            color: 'text.primary',
            py: 0.5,
          }}
          variant="contained"
        >
          See Widgets
        </Button>
      </Stack>
    </Stack>
  )
}
