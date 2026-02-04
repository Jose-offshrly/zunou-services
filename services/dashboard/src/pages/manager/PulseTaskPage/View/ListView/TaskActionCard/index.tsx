import { InboxOutlined } from '@mui/icons-material'
import { CardActionArea, Stack, Typography } from '@mui/material'
import { Card, CardContent } from '@zunou-react/components/layout'

interface TaskActionCardProps {
  title: string
  description: string
  onClick: () => void
}

export const TaskActionCard = ({
  description,
  onClick,
  title,
}: TaskActionCardProps) => {
  return (
    <Card sx={{ width: 296 }}>
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <CardContent sx={{ height: '100%' }}>
          <Stack alignItems="center" p={2} spacing={1}>
            <Stack
              alignItems="center"
              bgcolor="grey.200"
              borderRadius={99}
              justifyContent="center"
              p={1}
            >
              <InboxOutlined sx={{ color: 'grey.500' }} />
            </Stack>
            <Stack>
              <Typography color="text.primary" textAlign="center" variant="h6">
                {title}
              </Typography>
              <Typography
                color="text.secondary"
                fontSize="small"
                textAlign="center"
              >
                {description}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
