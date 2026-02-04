import { Stack, Typography } from '@mui/material'
import { Chip } from '@zunou-react/components/form'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'

interface Props {
  content: string[]
  isLoading?: boolean
}

export default function Strategies({ content, isLoading = false }: Props) {
  if (isLoading) {
    return (
      <Stack
        alignItems="center"
        height="100%"
        justifyContent="center"
        minHeight={400}
      >
        <LoadingSpinner />
      </Stack>
    )
  }
  return (
    <Stack>
      {content.map((strategy, index) => (
        <Stack
          border={1}
          borderRadius={2}
          key={index}
          mb={2}
          p={2}
          spacing={1}
          sx={{
            borderColor: 'divider',
          }}
        >
          <Chip
            label="STRATEGY"
            size="small"
            sx={{
              borderRadius: 9999,
              fontSize: 10,
              width: 'fit-content',
            }}
          />
          <Typography variant="body2"> {strategy}</Typography>
        </Stack>
      ))}
    </Stack>
  )
}
