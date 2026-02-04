import { Stack, Typography } from '@mui/material'
import zunouLogoTransparent from '@zunou-react/assets/images/zunou-icon-white-transparent.svg'
import { Button } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import { useNavigate, useParams } from 'react-router-dom'

import { FloatingNav } from '~/components/domain/navigation/FloatingNav'
import { UserMenu } from '~/components/domain/vitals/header'
import { OrganizationToggler } from '~/components/domain/vitals/header/OrganizationToggler/OrganizationToggler'
import { ToggleThemeIcon } from '~/components/domain/vitals/header/VitalsSettingsModal/components/ToggleThemeIcon'
import { useVitalsContext } from '~/context/VitalsContext'
import { Routes } from '~/services/Routes'

export const Header = () => {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { setting } = useVitalsContext()
  const { organizationId } = useParams()

  const isDarkMode = setting.theme === 'dark'

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
        {organizationId && (
          <OrganizationToggler
            isDarkMode={isDarkMode}
            organizationId={organizationId}
          />
        )}
        <Typography color="common.white" variant="h5">
          Insights
        </Typography>
        <Typography color="common.white" variant="body2">
          POWERED BY ZUNOU
        </Typography>
      </Stack>

      <Stack alignItems="center" direction="row" spacing={2}>
        <Stack
          sx={{
            '&:hover': {
              bgcolor: isDarkMode
                ? theme.palette.grey[700]
                : theme.palette.common.white,
              color: isDarkMode
                ? theme.palette.common.white
                : theme.palette.grey[700],
            },
            bgcolor: isDarkMode ? 'grey.800' : 'white',
            borderColor: 'common.white',
            borderRadius: '50%',
            color: isDarkMode ? 'common.white' : 'text.primary',
            height: 32,
            transition: 'background-color 0.2s ease, color 0.2s ease',
            width: 32,
          }}
        >
          <ToggleThemeIcon />
        </Stack>
        <Button
          color="inherit"
          onClick={navigateToVitals}
          sx={{
            '&:hover': {
              bgcolor: isDarkMode
                ? theme.palette.grey[700]
                : theme.palette.primary.main,
              color: isDarkMode
                ? theme.palette.common.white
                : theme.palette.common.white,
            },
            bgcolor: isDarkMode ? 'grey.800' : 'white',
            border: '1px solid',
            borderColor: isDarkMode ? 'grey.700' : 'grey.300',
            borderRadius: 99,
            color: isDarkMode ? 'common.white' : 'text.primary',
            py: 0.5,
          }}
          variant="contained"
        >
          See Widgets
        </Button>

        <UserMenu user={user} />
      </Stack>
    </Stack>
  )
}
