import { Stack } from '@mui/system'
import { theme } from '@zunou-react/services/Theme'
import { ReactNode } from 'react'

const PreviewContainer = ({
  children,
  color = theme.palette.grey[200],
}: {
  children: ReactNode
  color?: string
}) => {
  return (
    <Stack
      sx={{
        borderLeft: `2px solid ${color}`,
        overflow: 'hidden',
        pl: 2,
        width: '100%', // prevents children from expanding past bounds
      }}
    >
      <Stack
        sx={{
          '*': {
            maxWidth: '100%',
            wordBreak: 'break-word',
          },
          code: {
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          },
          color: 'text.secondary',
          fontSize: 'small',
          maxWidth: '100%',
          overflowX: 'auto',
          pre: {
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
          },
          whiteSpace: 'pre-wrap',
          width: '100%',
          wordBreak: 'break-word',
        }}
      >
        {children}
      </Stack>
    </Stack>
  )
}

export default PreviewContainer
