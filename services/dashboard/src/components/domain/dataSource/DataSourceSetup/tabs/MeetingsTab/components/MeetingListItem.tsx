import { AccessTimeOutlined, CalendarTodayOutlined } from '@mui/icons-material'
import {
  alpha,
  Avatar,
  Box,
  CircularProgress,
  lighten,
  ListItem,
  Stack,
  Typography,
} from '@mui/material'
import { Button } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import dayjs from 'dayjs'
import { useState } from 'react'

interface MeetingListItemProps {
  date: string
  title: string
  onIgnore?: () => void
  onAdd?: () => void
  isLoading?: boolean
  organizer: string
}

export const MeetingListItem = ({
  date,
  title,
  onIgnore,
  onAdd,
  isLoading,
  organizer,
}: MeetingListItemProps) => {
  const [isAdded, setIsAdded] = useState(false)

  const handleAdd = () => {
    if (onAdd) {
      onAdd()
      setIsAdded(true)
    }
  }

  return (
    <Box position="relative" width="100%">
      {isLoading && (
        <Box
          alignItems="center"
          bgcolor={alpha(theme.palette.primary.main, 0.05)}
          borderRadius="4px"
          display="flex"
          justifyContent="center"
          position="absolute"
          sx={{
            inset: 0,
          }}
          zIndex={1}
        >
          <CircularProgress size={24} />
        </Box>
      )}
      <ListItem
        disableGutters={true}
        divider={true}
        secondaryAction={
          <Stack direction="row" mr={2} spacing={1}>
            {onIgnore && (
              <Button
                disabled={isLoading}
                onClick={onIgnore}
                size="small"
                sx={{
                  borderColor: lighten(theme.palette.primary.main, 0.9),
                  color: 'text.primary',
                }}
                type="button"
                variant="outlined"
              >
                Ignore
              </Button>
            )}
            <Button
              disabled={isLoading || isAdded}
              onClick={handleAdd}
              size="small"
              sx={{
                borderColor: lighten(theme.palette.primary.main, 0.9),
                color: 'text.primary',
              }}
              type="button"
              variant="outlined"
            >
              {isAdded ? 'Added' : 'Add'}
            </Button>
          </Stack>
        }
        sx={{ bgcolor: 'white', borderRadius: '4px', p: 2 }}
      >
        <Stack alignItems="center" direction="row" spacing={2}>
          <Avatar />
          <Stack spacing={1}>
            <Stack>
              <Typography fontSize={16} fontWeight="medium">
                {title}
              </Typography>
              <Typography color="text.secondary" fontSize={14}>
                {organizer}
              </Typography>
            </Stack>
            <Stack alignItems="center" direction="row" spacing={2}>
              <Stack direction="row" spacing={0.5}>
                <CalendarTodayOutlined
                  fontSize="small"
                  sx={{ color: 'text.secondary' }}
                />
                <Typography
                  color="text.secondary"
                  fontSize={14}
                  fontWeight="light"
                >
                  {dayjs(date).format('ddd, MMM D')}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.5}>
                <AccessTimeOutlined
                  fontSize="small"
                  sx={{ color: 'text.secondary' }}
                />
                <Typography
                  color="text.secondary"
                  fontSize={14}
                  fontWeight="light"
                >
                  {dayjs(date).format('LT')}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </ListItem>
    </Box>
  )
}
