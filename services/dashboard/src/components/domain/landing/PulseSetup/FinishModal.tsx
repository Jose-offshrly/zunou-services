import { Stack, Typography } from '@mui/material'
import { Event } from '@zunou-graphql/core/graphql'
import { Button, LoadingButton } from '@zunou-react/components/form'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { CustomModal } from '~/components/ui/CustomModal'

import preview from '../../../../assets/landing-meet-preview.png'
import done from '../../../../assets/landing-setup-done.gif'
import EventCard from './EventCard'

interface Props {
  isOpen: boolean
  nextCallback?: () => Promise<void>
  events: Event[]
}

export const FinishModal = ({ isOpen, nextCallback, events }: Props) => {
  const { t } = useTranslation(['onboarding'])
  const [mode, setMode] = useState<'initial' | 'end'>('initial')
  const [ending, setEnding] = useState(false)

  return (
    <CustomModal headerActions={[]} isOpen={isOpen} style={{ maxWidth: 500 }}>
      {mode === 'initial' && (
        <Stack
          alignItems="center"
          gap={3}
          justifyContent="center"
          p="5%"
          sx={{ height: '100%', minHeight: 0 }}
        >
          <Stack
            alignItems="center"
            borderRadius={4}
            justifyContent="center"
            overflow="hidden"
            width="100%"
          >
            <img
              src={done}
              style={{
                height: 'auto',
                maxWidth: 120,
                objectFit: 'contain',
              }}
            />
          </Stack>

          <Stack>
            <Typography variant="h6">
              {t('youAreAllSet', { ns: 'onboarding' })}
            </Typography>
            <Typography variant="body2">
              {t('wellAutomaticallyJoin', { ns: 'onboarding' })}
            </Typography>
          </Stack>

          <Stack
            gap={2}
            sx={{
              maxHeight: 300,
              overflowX: 'hidden',
              overflowY: 'auto',
              pr: 2,
              width: '100%',
            }}
          >
            {events.map((event) => (
              <EventCard
                date={event.date}
                endTime={event.end_at}
                id={event.id}
                isReadOnly={true}
                key={event.id}
                name={event.name}
                numParticipants={event.participants.length}
                startTime={event.start_at}
              />
            ))}
          </Stack>

          <Button onClick={() => setMode('end')} variant="contained">
            {t('continue', { ns: 'onboarding' })}
          </Button>
        </Stack>
      )}

      {mode === 'end' && (
        <Stack alignItems="center" gap={5} justifyContent="center" p="2%">
          <Typography variant="h6">
            {t('beforeYourFirstMeeting', { ns: 'onboarding' })}
          </Typography>

          <Stack borderRadius={4} overflow="hidden" width="100%">
            <img src={preview} />
          </Stack>

          <Typography variant="body2">
            {t('importantCheckCompanion', { ns: 'onboarding' })}
          </Typography>

          <LoadingButton
            loading={ending}
            onClick={async () => {
              setEnding(true)
              await nextCallback?.()
              setEnding(false)
            }}
            variant="contained"
          >
            {t('continue', { ns: 'onboarding' })}
          </LoadingButton>
        </Stack>
      )}
    </CustomModal>
  )
}
