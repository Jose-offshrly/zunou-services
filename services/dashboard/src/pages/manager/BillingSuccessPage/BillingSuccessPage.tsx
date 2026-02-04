import { Box, Button, Container, Typography } from '@mui/material'
import { pathFor } from '@zunou-react/services/Routes'
import { useNavigate } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

const BillingSuccessPage = () => {
  const navigate = useNavigate()
  const { organizationId } = useOrganization()

  const handleContinue = () => {
    navigate(
      pathFor({
        pathname: Routes.OrganizationBootstrap,
        query: { organizationId },
      }),
    )
  }

  return (
    <Container>
      <Box mt={5} textAlign="center">
        <Typography gutterBottom={true} variant="h4">
          Payment Successful!
        </Typography>
        <Typography gutterBottom={true} variant="body1">
          Thank you for your purchase. Your subscription is now active.
        </Typography>
        <Button color="primary" onClick={handleContinue} variant="contained">
          Continue
        </Button>
      </Box>
    </Container>
  )
}

export default BillingSuccessPage
