import { Box, lighten, Stack, Typography } from '@mui/material'
import zunouLogo from '@zunou-react/assets/images/zunou-icon.png'
import { Button } from '@zunou-react/components/form/Button'
import { Image } from '@zunou-react/components/utility'
import { theme } from '@zunou-react/services/Theme'
import { useNavigate } from 'react-router-dom'

export const NotFoundPage = () => {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1) // Go back to the last visited page
  }

  // Get the full URL
  const fullUrl = window.location.href

  return (
    <Stack
      sx={{
        alignItems: 'center',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        justifyContent: 'center',
        minHeight: '100vh',
        p: 3,
        textAlign: 'center',
      }}
    >
      <Image
        alt="Logo"
        height={160}
        src={zunouLogo}
        style={{ borderRadius: 99, width: 'auto' }}
      />

      {/* 404 Error Badge */}
      <Typography
        sx={{
          backgroundColor: lighten(theme.palette.primary.main, 0.9),
          borderRadius: '20px',
          color: theme.palette.primary.main,
          display: 'inline-block',
          fontSize: '14px',
          px: 2,
          py: 0.5,
        }}
      >
        404 Error
      </Typography>

      {/* Page Not Found Text */}
      <Typography color="text.primary" fontSize={36} fontWeight="700">
        The page you are looking for can&apos;t be found.
      </Typography>

      {/* Full URL Display */}
      <Typography
        color="text.secondary"
        fontSize={14}
        sx={{
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          fontFamily: 'monospace',
          maxWidth: '90%',
          overflow: 'hidden',
          px: 2,
          py: 1,
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {fullUrl}
      </Typography>

      <Box
        sx={{
          backgroundColor: theme.palette.secondary.main,
          height: '1px',
          mt: -1,
          width: '60px',
        }}
      />

      <Button
        onClick={handleBack}
        size="large"
        sx={{
          borderRadius: '1',
          fontWeight: 'bold',
          mt: 2,
          padding: '10px 24px',
        }}
        variant="contained"
      >
        Back to home
      </Button>
    </Stack>
  )
}
