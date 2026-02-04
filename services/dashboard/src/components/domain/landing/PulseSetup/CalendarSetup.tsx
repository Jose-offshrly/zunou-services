import { Google } from '@mui/icons-material'
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PulseSetupLayout } from '~/components/layouts'
import { useGoogleCalendarLink } from '~/hooks/useGoogleCalendarLink'

import FormContainer from '../FormContainer'
import LandingButton from '../LandingButton'

interface Props {
  currentStep: number
  totalSteps: number
  nextCallback?: () => void
  skipCallback?: () => Promise<void>
}

const CalendarSetup = ({
  currentStep,
  totalSteps,
  nextCallback,
  skipCallback,
}: Props) => {
  const { t } = useTranslation(['onboarding'])
  const { googleCalLinked, isLoadingLinkStatus, isSubmitting, linkCalendar } =
    useGoogleCalendarLink()

  const [skipping, setSkipping] = useState(false)

  const handleNext = () => {
    nextCallback?.()
  }

  const handleLinkCalendar = async () => {
    if (!googleCalLinked) {
      await linkCalendar()
    }
  }

  return (
    <PulseSetupLayout>
      <Stack
        alignItems="center"
        direction="row"
        gap={5}
        height="100%"
        justifyContent="space-between"
        width="100%"
      >
        {/* Left Section */}
        <Stack alignItems="start" gap={2} width={{ lg: '35%', md: '100%' }}>
          <Typography
            color="primary.main"
            fontSize="small"
            textTransform="uppercase"
          >
            {t('step', { ns: 'onboarding' })} {currentStep}{' '}
            {t('of', { ns: 'onboarding' })} {totalSteps}
          </Typography>
          <Typography fontWeight={600} variant="h2">
            {t('linkYour', { ns: 'onboarding' })}{' '}
            <Box color="primary.main" component="span">
              {t('calendar', { ns: 'onboarding' })}
            </Box>
          </Typography>
          <Typography>
            {t('calendarPrivacyNote', { ns: 'onboarding' })}
          </Typography>

          <Stack
            alignItems="center"
            direction="row"
            gap={2}
            justifyContent="space-between"
            width="100%"
          >
            <LandingButton disabled={!googleCalLinked} onClick={handleNext}>
              {t('next', { ns: 'onboarding' })}
            </LandingButton>

            {!googleCalLinked && (
              <LandingButton
                disabled={
                  isLoadingLinkStatus ||
                  isSubmitting ||
                  skipping ||
                  googleCalLinked
                }
                loading={skipping}
                onClick={async () => {
                  setSkipping(true)
                  await skipCallback?.()
                  setSkipping(false)
                }}
                sx={{ color: 'text.secondary', fontWeight: 700 }}
                variant="text"
              >
                {t('skip', { ns: 'onboarding' })}
              </LandingButton>
            )}
          </Stack>
        </Stack>

        {/* Right Section - Form */}
        <FormContainer>
          <Stack alignItems="center" gap={5} textAlign="center">
            <Typography variant="body1">
              {t('companionAutoJoinDescription', { ns: 'onboarding' })}
            </Typography>

            <LandingButton
              disabled={isSubmitting || isLoadingLinkStatus}
              onClick={handleLinkCalendar}
              startIcon={googleCalLinked ? null : <Google fontSize="large" />}
              sx={{
                width: 'fit-content',
              }}
              variant={googleCalLinked ? 'outlined' : 'contained'}
            >
              {isSubmitting
                ? t('connecting', { ns: 'onboarding' })
                : googleCalLinked
                  ? t('accountLinked', { ns: 'onboarding' })
                  : t('linkGoogleCalendar', { ns: 'onboarding' })}
            </LandingButton>

            <Stack width="100%">
              <Typography variant="body1">
                {t('byConnectingYourCalendar', { ns: 'onboarding' })}
              </Typography>

              <Stack mx="auto">
                <List
                  disablePadding={true}
                  sx={{ listStyleType: 'disc', pl: 3 }}
                >
                  <ListItem sx={{ display: 'list-item', py: 0 }}>
                    <ListItemText
                      primary={t('accessUpcomingMeetings', {
                        ns: 'onboarding',
                      })}
                    />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item', py: 0 }}>
                    <ListItemText
                      primary={t('joinSelectedMeetings', { ns: 'onboarding' })}
                    />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item', py: 0 }}>
                    <ListItemText
                      primary={t('captureKeyPoints', { ns: 'onboarding' })}
                    />
                  </ListItem>
                </List>
              </Stack>
            </Stack>

            <Typography variant="body1">
              {t('noMoreMissedDetails', { ns: 'onboarding' })}
            </Typography>
          </Stack>
        </FormContainer>
      </Stack>
    </PulseSetupLayout>
  )
}

export default CalendarSetup
