import { Box, Stack, Typography } from '@mui/material'
import { Button } from '@zunou-react/components/form'
import { useNavigate } from 'react-router-dom'

import zunouLogo from '~/assets/zunou-logo.png'
import { useReturnToLogin } from '~/hooks/useReturnToLogin'
import { Routes } from '~/services/Routes'

const NoAccountPage = () => {
  const navigate = useNavigate()
  const { returnToLogin } = useReturnToLogin()

  const handleRegisterInterest = () => {
    navigate(Routes.RegisterInterest, { replace: true })
  }

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      p={4}
      spacing={3}
    >
      {/* Logo */}
      <Box
        alt="Zunou"
        component="img"
        src={zunouLogo}
        sx={{ maxHeight: 48, mb: 2, width: 'auto' }}
      />

      <Stack alignItems="center" maxWidth={500} spacing={2}>
        <Typography fontWeight={700} textAlign="center" variant="h4">
          No account found
        </Typography>
        <Typography color="text.secondary" fontSize="1.1rem" textAlign="center">
          You need an invitation from an administrator to access{' '}
          <Typography color="primary.main" component="span" fontWeight={600}>
            Zunou
          </Typography>
          , or you can register your interest below.
        </Typography>
        <Stack direction="row" gap={2} mt={2}>
          <Button onClick={handleRegisterInterest} variant="contained">
            Register Interest
          </Button>
          <Button onClick={returnToLogin} variant="outlined">
            Back to Login
          </Button>
        </Stack>
      </Stack>
    </Stack>
  )
}

export default NoAccountPage
