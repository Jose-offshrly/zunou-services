import { Box, Button, Container, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import { Routes } from '~/services/Routes'

const BillingCancelPage = () => {
  const navigate = useNavigate()

  const handleTryAgain = () => {
    navigate(Routes.BillingAndPayment) // Redirect back to the billing page
  }

  return (
    <Container>
      <Box mt={5} textAlign="center">
        <Typography gutterBottom={true} variant="h4">
          Payment Canceled
        </Typography>
        <Typography gutterBottom={true} variant="body1">
          It looks like you canceled the payment. Would you like to try again?
        </Typography>
        <Button color="primary" onClick={handleTryAgain} variant="contained">
          Try Again
        </Button>
      </Box>
    </Container>
  )
}

export default BillingCancelPage
