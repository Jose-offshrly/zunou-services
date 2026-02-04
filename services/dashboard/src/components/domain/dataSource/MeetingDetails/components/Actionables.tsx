import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { useGetActionablesQuery } from '@zunou-queries/core/hooks/useGetActionablesQuery'
import { theme } from '@zunou-react/services/Theme'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'

interface ActionablesProps {
  organizationId: string
  pulseId?: string
  eventId?: string
}

export default function Actionables({
  organizationId,
  pulseId,
  eventId,
}: ActionablesProps) {
  const { data, isLoading } = useGetActionablesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      eventId,
      organizationId,
      pulseId,
    },
  })

  const actionables = data?.actionables ?? []

  if (isLoading) {
    return (
      <Stack alignItems="center" justifyContent="center" minHeight={400}>
        <LoadingSpinner />
      </Stack>
    )
  }

  if (actionables.length === 0) {
    return (
      <Stack spacing={2}>
        <Typography fontWeight="fontWeightMedium">Checklist</Typography>
        <Typography color="text.secondary" variant="body2">
          No checklist items found.
        </Typography>
      </Stack>
    )
  }

  return (
    <Stack spacing={2}>
      <Typography fontWeight="fontWeightMedium">Checklist</Typography>
      <List sx={{ border: 1, borderColor: 'grey.200', borderRadius: 2 }}>
        {actionables.map((item, index) => (
          <ListItem key={item.id}>
            <ListItemIcon>
              <Box
                sx={{
                  alignItems: 'center',
                  backgroundColor: theme.palette.common.sky,
                  borderRadius: '50%',
                  color: theme.palette.common.blue,
                  display: 'flex',
                  fontSize: 'small',
                  fontWeight: 'fontWeightMedium',
                  height: 24,
                  justifyContent: 'center',
                  width: 24,
                }}
              >
                {index + 1}
              </Box>
            </ListItemIcon>
            <ListItemText primary={item.description} />
          </ListItem>
        ))}
      </List>
    </Stack>
  )
}
