import { LightbulbOutlined } from '@mui/icons-material'
import { alpha, Stack, Typography } from '@mui/material'
import { theme } from '@zunou-react/services/Theme'

interface MessageStrategyItemProps {
  onClick: () => void
  title: string
  type: string
}

export const MessageStrategyItem = ({
  onClick,
  title,
  type,
}: MessageStrategyItemProps) => {
  return (
    <Stack
      alignItems="center"
      bgcolor={alpha(theme.palette.primary.main, 0.1)}
      border={`1px solid ${alpha(theme.palette.primary.main, 0.2)}`}
      borderRadius={2}
      direction="row"
      onClick={onClick}
      spacing={2}
      sx={{
        cursor: 'pointer',
      }}
    >
      <Stack
        alignItems="center"
        bgcolor={alpha(theme.palette.primary.main, 0.2)}
        borderRadius="8px 0 0 8px"
        flex={1}
        justifyContent="center"
        p={2}
      >
        <LightbulbOutlined color="primary" fontSize="large" />
      </Stack>
      <Stack flex={4} pr={2}>
        <Typography color="text.primary" fontSize={14} fontWeight={600}>
          {title}
        </Typography>
        <Typography
          color={alpha(theme.palette.primary.main, 0.5)}
          fontSize={12}
          fontWeight={400}
        >
          Review {type}
        </Typography>
      </Stack>
    </Stack>
  )
}
