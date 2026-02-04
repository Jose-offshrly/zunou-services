import { BarChartOutlined, CloseOutlined } from '@mui/icons-material'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'

interface ProgressFieldProps {
  disabled?: boolean
  onRemove: () => void
  progress: string
  onChange?: (progress: string) => void
}

export const ProgressField = ({
  disabled,
  onRemove,
  progress,
  onChange,
}: ProgressFieldProps) => {
  const progressValue = parseInt(progress) || 0
  const [isDragging, setIsDragging] = useState(false)
  const [localProgress, setLocalProgress] = useState(progressValue)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return
      setIsDragging(true)
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const newProgress = Math.max(
        0,
        Math.min(100, Math.round((x / rect.width) * 100)),
      )
      setLocalProgress(newProgress)
      onChange?.(String(newProgress))
    },
    [disabled, onChange],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || disabled) return
      const slider = document.getElementById('progress-slider')
      if (!slider) return
      const rect = slider.getBoundingClientRect()
      const x = e.clientX - rect.left
      const newProgress = Math.max(
        0,
        Math.min(100, Math.round((x / rect.width) * 100)),
      )
      setLocalProgress(newProgress)
      onChange?.(String(newProgress))
    },
    [isDragging, disabled, onChange],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Update local progress when prop changes (but not while dragging)
  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(progressValue)
    }
  }, [progressValue, isDragging])

  const displayProgress = isDragging ? localProgress : progressValue

  // Add global mouse event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <Box
      sx={{
        backgroundColor: '#fafafa',
        borderRadius: '8px',
        p: 2,
      }}
    >
      {/* Top row: icon, text, percentage, close button */}
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Stack alignItems="center" direction="row" spacing={1}>
          <BarChartOutlined sx={{ color: 'text.secondary' }} />
          <Typography color="text.secondary" variant="body2">
            Progress {displayProgress}%
          </Typography>
        </Stack>

        <IconButton
          disabled={disabled}
          onClick={onRemove}
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          <CloseOutlined fontSize="small" />
        </IconButton>
      </Box>

      {/* Bottom: full-width progress bar */}
      <Box
        id="progress-slider"
        onMouseDown={handleMouseDown}
        sx={{
          backgroundColor: 'grey.300',
          borderRadius: '4px',
          cursor: disabled ? 'default' : 'pointer',
          height: 8,
          position: 'relative',
          userSelect: 'none',
          width: '100%',
        }}
      >
        <Box
          sx={{
            backgroundColor: 'primary.main',
            borderRadius: '4px',
            height: '100%',
            transition: isDragging ? 'none' : 'width 0.1s ease',
            width: `${displayProgress}%`,
          }}
        />
      </Box>
    </Box>
  )
}
