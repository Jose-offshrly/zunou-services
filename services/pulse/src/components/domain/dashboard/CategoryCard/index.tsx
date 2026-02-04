import { SvgIconComponent } from '@mui/icons-material'
import { Card, CardContent, Stack, SvgIcon, Typography } from '@mui/material'
import { theme } from '@zunou-react/services/Theme'

interface TopicCardProps {
  action: () => void
  description: string
  icon: SvgIconComponent
  isAvailable: boolean
  title: string
}

const TopicCard = ({
  action,
  description,
  icon,
  isAvailable,
  title,
}: TopicCardProps) => {
  return (
    <Card
      onClick={action}
      sx={{
        '&:hover': {
          boxShadow: 1,
        },
        cursor: isAvailable ? 'pointer' : '',
        flex: 1,
        maxWidth: 240,
        minWidth: 160,
        pointerEvents: isAvailable ? '' : 'none',
      }}
      variant="outlined"
    >
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          height: '100%',
        }}
      >
        <Stack
          alignItems="center"
          height={28}
          justifyContent="center"
          sx={{
            backgroundColor: theme.palette.primary.light,
            borderRadius: 99,
          }}
          width={28}
        >
          <SvgIcon
            component={icon}
            sx={{ color: 'white', height: 18, width: 18 }}
          />
        </Stack>
        <Stack spacing={2}>
          <Typography fontWeight={600} height={48} variant="body1">
            {title}
          </Typography>
          <Typography
            color={
              isAvailable
                ? theme.palette.text.primary
                : theme.palette.text.disabled
            }
            variant="body2"
          >
            {description}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default TopicCard
