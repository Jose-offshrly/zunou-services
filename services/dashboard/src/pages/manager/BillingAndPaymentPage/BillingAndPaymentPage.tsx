import {
  Box,
  Button,
  Container,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { SelectChangeEvent } from '@mui/material/Select'
import { useCreateCheckoutSessionMutation } from '@zunou-queries/core/hooks/useCreateCheckoutSessionMutation'
import { Card } from '@zunou-react/components/layout'
import { useLoadingContext } from '@zunou-react/contexts/LoadingContext'
import { useState } from 'react'

import { Routes } from '~/services/Routes'

const BillingAndPaymentPage = () => {
  const [plan, setPlan] = useState('price_1Ppn2zP18Wh8ZpV3ri6uXtWK')
  const [quantity, setQuantity] = useState(1)
  const { useTrackQuery } = useLoadingContext()

  const { isPending, mutateAsync: createCheckoutSession } =
    useCreateCheckoutSessionMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const handlePlanChange = (event: SelectChangeEvent) => {
    // Update the event type
    setPlan(event.target.value)
  }

  const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(parseInt(event.target.value))
  }

  const handleCheckout = async () => {
    try {
      const response = await createCheckoutSession({
        price_id: plan,
        quantity,
      })
      if (response.createCheckoutSession.url) {
        window.location.href = response.createCheckoutSession.url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    }
  }

  useTrackQuery(`${Routes.BillingAndPayment}:createCheckoutSession`, isPending)

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
        width: '100%',
      }}
    >
      <Box
        sx={{
          bgcolor: (theme) => theme.palette.background.default,
          padding: 2,
          width: '300px',
        }}
      >
        <Typography variant="h6">Billing and Payment</Typography>
      </Box>
      <Box
        sx={{
          bgcolor: (theme) => theme.palette.background.default,
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
        }}
      >
        <Container
          sx={{
            bgcolor: (theme) => theme.palette.background.default,
          }}
        >
          <Card>
            <Box display="flex" flexDirection="column" gap={2} padding={3}>
              <Typography variant="h5">Select Your Plan</Typography>
              <Select
                displayEmpty={true}
                fullWidth={true}
                onChange={handlePlanChange}
                value={plan}
              >
                <MenuItem disabled={true} value="">
                  Select a plan
                </MenuItem>
                <MenuItem value="price_1Ppn2zP18Wh8ZpV3ri6uXtWK">
                  Monthly Subscription
                </MenuItem>
              </Select>
              <TextField
                fullWidth={true}
                inputProps={{ min: 1 }}
                label="Quantity"
                margin="normal"
                onChange={handleQuantityChange}
                type="number"
                value={quantity}
              />
              <Button
                color="primary"
                disabled={!plan || quantity < 1 || isPending}
                onClick={handleCheckout}
                variant="contained"
              >
                Proceed to Checkout
              </Button>
            </Box>
          </Card>
        </Container>
      </Box>
    </Box>
  )
}

export default BillingAndPaymentPage
