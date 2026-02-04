import { Upload } from '@mui/icons-material'
import { Icon, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { theme } from '@zunou-react/services/Theme'

interface DragOverlayProps {
  isDragOver: boolean
}

export const DragOverlay = ({ isDragOver }: DragOverlayProps) => {
  if (!isDragOver) {
    return null
  }

  return (
    <Stack
      alignItems="center"
      bgcolor={alpha(theme.palette.primary.main, 0.02)}
      display="flex"
      height="100%"
      justifyContent="center"
      left={0}
      position="absolute"
      sx={{ pointerEvents: 'none' }}
      top={0}
      width="100%"
      zIndex={10}
    >
      <Stack>
        <Icon
          component={Upload}
          fontSize="large"
          sx={{
            border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
            borderRadius: '100%',
            color: theme.palette.primary.main,
            mb: 1,
            p: 1,
          }}
        />
      </Stack>
      <Typography
        color={theme.palette.primary.main}
        fontSize={16}
        fontWeight="bold"
        textAlign="center"
      >
        Drop to upload
      </Typography>
      <Typography
        color={theme.palette.text.primary}
        fontSize={12}
        textAlign="center"
      >
        You can upload files or images here
      </Typography>
    </Stack>
  )
}
