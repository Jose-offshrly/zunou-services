import { withAuthenticationRequired } from '@auth0/auth0-react'
import { MonitorHeart } from '@mui/icons-material'
import { Divider, Typography } from '@mui/material'
import { Box, Stack } from '@mui/system'
import zunouLogo from '@zunou-react/assets/images/zunou-logo.svg'
import { Image } from '@zunou-react/components/utility'
import { theme } from '@zunou-react/services/Theme'
import { useNavigate, useParams } from 'react-router-dom'

import CategoryCard from '~/components/domain/dashboard/CategoryCard'
import { Navbar } from '~/components/layouts/Navbar'
import chatCategoriesData from '~/libs/chatCategories.json'
import { Routes } from '~/services/Routes'

const DashboardPage = () => {
  const navigate = useNavigate()
  const { organizationId } = useParams()

  const { chatCategories } = chatCategoriesData

  if (!organizationId) throw new Error('No Organization ID found')

  const handleRedirect = () => {
    if (organizationId)
      navigate(
        Routes.ThreadDetail.replace(':organizationId', organizationId).replace(
          ':threadId',
          'new',
        ),
      )
  }

  return (
    <Box>
      <Navbar />
      <Stack
        alignItems="center"
        justifyContent="top"
        mb={10}
        overflow="auto"
        pt={6}
      >
        <Stack alignItems="center" gap={6} padding={2} width="100%">
          <Stack alignItems="center" gap={4} maxWidth={720}>
            <Image
              alt="zunou pulse logo"
              height={96}
              src={zunouLogo}
              style={{ width: 'auto' }}
            />
            <Typography fontSize={18} textAlign="center">
              Get instant help and guidance whenever you need it— quick, simple,
              and always here for you.
            </Typography>
          </Stack>
          <Divider
            sx={{
              backgroundColor: theme.palette.divider,
              borderColor: theme.palette.divider,
              width: '100%',
            }}
          />
          <Stack gap={2}>
            <Typography fontSize={18} textAlign="center">
              Please select a category below to start a chat about your
              inquiries or concerns.
            </Typography>
            <Stack direction="row" gap={1}>
              {chatCategories.map(
                ({ title, description, isAvailable }, index) => {
                  return (
                    <CategoryCard
                      action={handleRedirect}
                      description={description}
                      icon={MonitorHeart}
                      isAvailable={isAvailable}
                      key={index}
                      title={title}
                    />
                  )
                },
              )}
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  )
}

export default withAuthenticationRequired(DashboardPage, {
  onRedirecting: () => <div>Signing in...</div>,
})
