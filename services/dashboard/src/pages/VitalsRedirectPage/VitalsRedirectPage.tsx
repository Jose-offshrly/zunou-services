import { CircularProgress, Container, Stack } from '@mui/material'
import { pathFor } from '@zunou-react/services/Routes'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Routes } from '~/services/Routes'

const VitalsRedirectPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    navigate(
      pathFor({
        pathname: Routes.Bootstrap,
      }),
      { replace: true },
    )
  }, [])

  return (
    <Container maxWidth="xl">
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: '100vh' }}
      >
        <CircularProgress color="primary" />
      </Stack>
    </Container>
  )
}

export default VitalsRedirectPage
