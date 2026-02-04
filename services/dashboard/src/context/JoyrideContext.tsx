import { Paper, Stack, Typography } from '@mui/material'
import { Button } from '@zunou-react/components/form'
import React, { createContext, useContext, useState } from 'react'
import Joyride, { CallBackProps, Step, TooltipRenderProps } from 'react-joyride'

interface JoyrideContextType {
  startTour: (steps: Step[], onEndCallback?: () => void) => void
  stopTour: () => void
  running: boolean
}

const JoyrideContext = createContext<JoyrideContextType | null>(null)

export const JoyrideProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [steps, setSteps] = useState<Step[]>([])
  const [running, setRunning] = useState(false)
  const [onEndCallback, setOnEndCallback] = useState<(() => void) | null>(null)

  const startTour = (incomingSteps: Step[], onEndCallback?: () => void) => {
    const steps = incomingSteps.map((s) => ({ ...s, disableBeacon: true }))
    setSteps(steps)
    setRunning(true)
    setOnEndCallback(onEndCallback ? () => onEndCallback : null)
  }

  const stopTour = () => {
    setRunning(false)
    setSteps([])
    setOnEndCallback(null)
  }

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data
    if (['finished', 'skipped'].includes(status)) {
      // Call the callback before stopping the tour
      if (onEndCallback) {
        onEndCallback()
      }
      stopTour()
    }
  }

  const customStyles = {
    buttonBack: {
      backgroundColor: 'transparent',
      color: '#fff',
    },
    buttonNext: {
      backgroundColor: 'transparent',
      color: '#fff',
    },
    buttonSkip: {
      backgroundColor: 'transparent',
      color: '#fff',
    },
    options: {
      arrowColor: '#212121',
      backgroundColor: '#212121',
      overlayColor: 'rgb(0,0,0,0)',
      primaryColor: '#007bff',
      textColor: 'white',
      zIndex: 1000,
    },
  }

  const CustomTooltip = ({
    step,
    skipProps,
    primaryProps,
    index,
    size,
  }: TooltipRenderProps) => {
    const isLastStep = index === size - 1

    return (
      <Paper
        elevation={8}
        sx={{
          bgcolor: '#212121',
          borderRadius: 3,
          maxWidth: 300,
          p: 2,
        }}
      >
        {step.title && (
          <Typography color="common.white" sx={{ mb: 2 }} variant="body2">
            {step.title}
          </Typography>
        )}

        {step.content && (
          <Typography color="common.white" sx={{ mb: 2 }} variant="body2">
            {step.content}
          </Typography>
        )}

        <Stack
          alignItems="center"
          flexDirection="row"
          justifyContent="space-between"
        >
          <Stack alignItems="center" flexDirection="row">
            {!isLastStep && (
              <Button
                {...skipProps}
                size="small"
                sx={{
                  color: 'common.white',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                }}
                variant="text"
              >
                Skip
              </Button>
            )}
          </Stack>

          <Stack alignItems="center" flexDirection="row">
            {primaryProps && (
              <Button
                {...primaryProps}
                size="small"
                sx={{
                  color: 'common.white',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                }}
                variant="text"
              >
                {isLastStep ? 'End' : 'Next'}
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>
    )
  }

  return (
    <JoyrideContext.Provider value={{ running, startTour, stopTour }}>
      {children}
      <Joyride
        callback={handleJoyrideCallback}
        continuous={true}
        disableOverlayClose={true}
        disableScrollParentFix={true}
        hideCloseButton={true}
        run={running}
        showSkipButton={true}
        spotlightPadding={20}
        steps={steps}
        styles={customStyles}
        tooltipComponent={CustomTooltip}
      />
    </JoyrideContext.Provider>
  )
}

export const useJoyride = () => {
  const ctx = useContext(JoyrideContext)
  if (!ctx) throw new Error('useJoyride must be used within JoyrideProvider')
  return ctx
}
