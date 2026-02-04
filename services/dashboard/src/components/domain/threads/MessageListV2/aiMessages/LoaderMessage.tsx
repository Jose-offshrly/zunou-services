import { Box, keyframes, Typography } from '@mui/material'
import { alpha, Stack } from '@mui/system'
import Avatar from '@zunou-react/components/utility/Avatar'
import { TypingIndicator } from '@zunou-react/components/utility/TypingIndicator'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useState } from 'react'

import pulseLogo from '~/assets/pulse-logo.png'
import { usePulseStore } from '~/store/usePulseStore'

const light = alpha(theme.palette.primary.main, 0.2)

const middleCircleAnimation = keyframes`
   0% {
    background-color: transparent;
    transform: scale(0.1);
    opacity: 0;
  }
  30% {
    background-color: transparent;
    transform: scale(0.1);
    opacity: 0;
  }
  35% {
    background-color: ${light};
    transform: scale(0.3);
    opacity: 0.3;
  }
  40% {
    background-color: ${light};
    transform: scale(0.6);
    opacity: 0.6;
  }
  45% {
    background-color: ${light};
    transform: scale(0.9);
    opacity: 0.9;
  }
  50% {
    background-color: ${light};
    transform: scale(1);
    opacity: 1;
  }
  80% {
    background-color: ${light};
    transform: scale(1);
    opacity: 1;
  }
  90% {
    background-color: ${light};
    transform: scale(0.5);
    opacity: 0.5;
  }
  95% {
    background-color: ${light};
    transform: scale(0.2);
    opacity: 0.2;
  }
  100% {
    background-color: transparent;
    transform: scale(0.1);
    opacity: 0;
  }
`

const innerDotAnimation = keyframes`
  0% {
    transform: scale(1);
  }
  70% {
    transform: scale(1);
  }
  85% {
    transform: scale(3.5);
  }
  100% {
    transform: scale(1);
  }
`

const AnimatedCircle = () => (
  <Box
    sx={{
      alignItems: 'center',
      display: 'flex',
      height: 24,
      justifyContent: 'center',
      position: 'relative',
      width: 24,
    }}
  >
    {/* Outer circle with border that fills */}
    <Box
      sx={{
        border: 2,
        borderColor: light,
        borderRadius: '50%',
        height: 28,
        position: 'absolute',
        width: 28,
        zIndex: 1,
      }}
    />

    {/* Middle circle that appears outward */}
    <Box
      sx={{
        alignItems: 'center',
        animation: `${middleCircleAnimation} 2s ease-in-out infinite`,
        borderRadius: '50%',
        display: 'flex',
        height: 18,
        justifyContent: 'center',
        position: 'relative',
        width: 18,
        zIndex: 2,
      }}
    ></Box>

    {/* Static inner dot */}
    <Box
      sx={{
        animation: `${innerDotAnimation} 2s ease-in-out infinite`,
        backgroundColor: 'primary.main',
        borderRadius: '50%',
        height: 8,
        position: 'absolute',
        width: 8,
        zIndex: 3,
      }}
    />
  </Box>
)

const LOADER_MESSAGE = [
  'Analyzing sources',
  'Piecing everything together',
  'Finding the best response',
  'Processing information',
  'Gathering relevant details',
  'Organizing thoughts',
  'Refining the output',
  'Almost there',
  'Got it! Here’s what I came up with.',
]

const INTERVAL = 5000

const LoaderMessage = () => {
  const { pulseDelayedLoader } = usePulseStore()
  const [currentMessageIndex, setCurrentMessageIndex] = useState(-1) // -1 means showing dynamic message
  const [displayMessage, setDisplayMessage] = useState('')

  useEffect(() => {
    if (!pulseDelayedLoader.isShowing) {
      // Reset state when component unmounts or loader is hidden
      setCurrentMessageIndex(-1)
      setDisplayMessage('')
      return
    }

    // Initially show the dynamic message
    setDisplayMessage(
      pulseDelayedLoader.message || 'Almost ready... Finalizing results!',
    )

    const timer = setTimeout(() => {
      setCurrentMessageIndex(0)
      setDisplayMessage(LOADER_MESSAGE[0])
    }, INTERVAL)

    return () => clearTimeout(timer)
  }, [pulseDelayedLoader.isShowing, pulseDelayedLoader.message])

  useEffect(() => {
    if (!pulseDelayedLoader.isShowing || currentMessageIndex === -1) {
      return
    }

    if (currentMessageIndex >= LOADER_MESSAGE.length - 1) {
      return
    }

    const timer = setTimeout(() => {
      setCurrentMessageIndex((prevIndex) => {
        const nextIndex = prevIndex + 1
        setDisplayMessage(LOADER_MESSAGE[nextIndex])
        return nextIndex
      })
    }, INTERVAL)

    return () => clearTimeout(timer)
  }, [currentMessageIndex, pulseDelayedLoader.isShowing])

  if (!pulseDelayedLoader.isShowing) return null

  return (
    <Stack>
      <Stack
        alignItems="center"
        direction="row"
        gap={2}
        position="relative"
        sx={{ width: '100%' }}
      >
        <Stack>
          <Avatar
            placeholder="assistant"
            size="small"
            src={pulseLogo}
            variant="circular"
          />
        </Stack>

        <Stack
          alignItems="flex-start"
          gap={2}
          justifyContent="center"
          maxWidth="100%"
        >
          <Stack alignItems="center" direction="row" gap={1.5} py={1}>
            <AnimatedCircle />
            <Typography color="text.secondary" variant="body2">
              {displayMessage.replace(/\.\.\.$/, '')}
            </Typography>
            <TypingIndicator />
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}

export default LoaderMessage
