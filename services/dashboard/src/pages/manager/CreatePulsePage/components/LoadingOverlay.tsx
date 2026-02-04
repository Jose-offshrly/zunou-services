import { Avatar, Stack, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'

import PulseLoadingGif from '~/assets/createPulseLoading.gif'

const phrases = [
  { color: 'text.primary', text: 'creating the pulse container' },
  { color: 'secondary.main', text: 'adding the data sources' },
  { color: 'primary.main', text: 'adding sources into vectors' },
  { color: 'text.primary', text: 'adding purpose and updating agents' },
  {
    color: 'text.primary',
    highlight: 'launch',
    highlightColor: 'primary.main',
    text: 'prepping ',
  },
]

export const LoadingOverlay = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setIsAnimating(false)
        setCurrentIndex((prev) => (prev + 1) % phrases.length)
      }, 400)
    }, 1000)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [currentIndex])

  const currentPhrase = phrases[currentIndex]

  return (
    <Stack
      alignItems="center"
      bgcolor={'white'}
      bottom={0}
      justifyContent="center"
      left={0}
      position="fixed"
      right={0}
      top={0}
      zIndex={9999}
    >
      <Stack alignItems="center" justifyContent="center" width="50%">
        <Avatar
          alt="Loading animation"
          src={PulseLoadingGif}
          sx={{ height: 360, width: 360 }}
        />
        <Typography
          color="text.primary"
          fontSize="3rem"
          mb={1}
          textAlign="center"
        >
          Creating your Pulse...
        </Typography>

        <Stack
          alignItems="center"
          height={48}
          justifyContent="center"
          overflow="hidden"
          position="relative"
          width="100%"
        >
          <Stack
            alignItems="center"
            justifyContent="center"
            position="absolute"
            sx={{
              transform: isAnimating ? 'translateY(-100%)' : 'translateY(0)',
              transition: 'transform 0.4s ease-in-out',
            }}
            width="100%"
          >
            <Typography
              color={currentPhrase.color}
              fontSize="2rem"
              textAlign="center"
              width="100%"
            >
              {currentPhrase.highlight ? (
                <>
                  {currentPhrase.text}
                  <span style={{ color: currentPhrase.highlightColor }}>
                    {currentPhrase.highlight}
                  </span>
                </>
              ) : (
                currentPhrase.text
              )}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}
