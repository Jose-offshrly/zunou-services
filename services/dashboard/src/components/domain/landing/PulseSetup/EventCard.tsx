import { CheckCircle, Circle, CircleOutlined } from '@mui/icons-material'
import { Stack, Typography } from '@mui/material'
import { IconButton } from '@zunou-react/components/form'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface EventCardProps {
  id: string
  name: string
  date: string
  startTime: string
  endTime: string
  numParticipants: number
  onToggleSelect?: ({ id, selected }: { id: string; selected: boolean }) => void
  isReadOnly?: boolean
}

const EventCard = ({
  id,
  name,
  date,
  startTime,
  endTime,
  numParticipants,
  onToggleSelect,
  isReadOnly = false,
}: EventCardProps) => {
  const { t, i18n } = useTranslation(['onboarding'])
  const [selected, setSelected] = useState(isReadOnly)

  // Use locale-aware date formatting
  const currentLocale = i18n.language === 'ja' ? 'ja' : 'en'
  const formattedDate = dayjs(date).locale(currentLocale).format('MMM D')
  const formattedStartTime = dayjs(startTime)
    .locale(currentLocale)
    .format('h:mm A')
  const formattedEndTime = dayjs(endTime).locale(currentLocale).format('h:mm A')

  const handleToggle = () => {
    if (isReadOnly) return

    const newSelected = !selected
    setSelected(newSelected)
    onToggleSelect?.({ id, selected: newSelected })
  }

  // Determine singular or plural for participants
  const participantText =
    numParticipants === 1
      ? t('participant', { ns: 'onboarding' })
      : t('participants', { ns: 'onboarding' })

  return (
    <Stack
      alignItems="center"
      bgcolor="common.white"
      border={1}
      borderColor="divider"
      borderRadius={4}
      direction="row"
      gap={2}
      p={2.5}
    >
      <IconButton onClick={handleToggle}>
        {selected ? (
          <CheckCircle
            sx={{
              color: 'primary.main',
              fontSize: '28px',
            }}
          />
        ) : (
          <CircleOutlined
            sx={{
              color: 'grey.200',
              fontSize: '28px',
            }}
          />
        )}
      </IconButton>

      <Stack>
        <Typography fontWeight={700}>{name}</Typography>
        <Stack
          alignItems="center"
          color="text.secondary"
          direction="row"
          divider={<Circle sx={{ color: 'grey.200', fontSize: 5 }} />}
          gap={1}
          justifyContent="start"
        >
          <Typography fontSize="small">{formattedDate}</Typography>
          <Typography fontSize="small">
            {formattedStartTime} - {formattedEndTime}
          </Typography>
          <Typography fontSize="small">
            {numParticipants} {participantText}
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  )
}

export default EventCard
