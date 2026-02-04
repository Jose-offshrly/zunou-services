import { Box } from '@mui/material'
import { theme } from '@zunou-react/services/Theme'

type Size = 'extraSmall' | 'small' | 'medium' | 'large'
type Speed = 'slow' | 'normal' | 'fast'
type Mode = 'sequence' | 'random'

interface AudioVisualizerProps {
  size?: Size
  color?: string
  speed?: Speed
  barCount?: number
  mode?: Mode
  isPaused?: boolean
}

interface SizeConfig {
  barWidth: number
  barHeight: number
  gap: number
}

interface SpeedConfig {
  duration: number
  delay: number
}

export const AudioVisualizer = ({
  size = 'medium',
  color = theme.palette.common.lime,
  speed = 'normal',
  barCount = 6,
  mode = 'random',
  isPaused = false,
}: AudioVisualizerProps) => {
  const sizeConfig: Record<Size, SizeConfig> = {
    extraSmall: { barHeight: 5, barWidth: 3, gap: 1.5 },
    large: { barHeight: 12, barWidth: 5, gap: 2 },
    medium: { barHeight: 8, barWidth: 5, gap: 2 },
    small: { barHeight: 7, barWidth: 4, gap: 2 },
  }

  const speedConfig: Record<Speed, SpeedConfig> = {
    fast: { delay: 0.1, duration: 0.5 },
    normal: { delay: 0.15, duration: 0.8 },
    slow: { delay: 0.2, duration: 1.2 },
  }

  const { barWidth, barHeight, gap } = sizeConfig[size] || sizeConfig.medium
  const { duration, delay } = speedConfig[speed] || speedConfig.normal

  const getDelays = (): number[] => {
    if (mode === 'random') {
      // Create random delays between 0 and animationDuration
      return Array(barCount)
        .fill(0)
        .map(() => Math.random() * duration)
    } else {
      // Sequential delays
      return Array(barCount)
        .fill(0)
        .map((_, i) => i * delay)
    }
  }

  const delays = getDelays()

  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        gap: `${gap}px`,
        height: `${barHeight * 2}px`,
      }}
    >
      {[...Array(barCount)].map((_, i) => (
        <Box
          key={i}
          sx={{
            '@keyframes wave': {
              '0%, 100%': { transform: 'scaleY(1)' },
              '50%': { transform: 'scaleY(2)' },
            },
            animation: `wave ${duration}s infinite ease-in-out`,
            animationDelay: `${delays[i]}s`,
            animationPlayState: isPaused ? 'paused' : 'running',
            backgroundColor: isPaused ? 'lightgray' : color,
            borderRadius: `${barWidth / 1.5}px`,
            height: `${barHeight}px`,
            width: `${barWidth}px`,
          }}
        />
      ))}
    </Box>
  )
}
