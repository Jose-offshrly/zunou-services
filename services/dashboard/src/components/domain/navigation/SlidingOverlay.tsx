import { Box } from '@mui/material'
import { forwardRef } from 'react'

interface SlidingOverlayProps {
  backgroundColor?: string
}

const SlidingOverlay = forwardRef<HTMLDivElement, SlidingOverlayProps>(
  ({ backgroundColor = 'secondary.main' }, ref) => {
    return (
      <Box
        ref={ref}
        sx={{
          backgroundColor,
          borderRadius: { sm: '0 0 10px 10px', xs: '0 0 5px 5px' },
          clipPath: 'inset(0 0 -20px 0)',
          height: '100%',
          left: 0,
          position: 'fixed',
          top: 0,
          transform: 'translateY(-100%)',
          transition: 'transform 0.4s cubic-bezier(0.645, 0.045, 0.355, 1.000)',
          visibility: 'hidden',
          width: '100%',
          zIndex: 9999,
        }}
      />
    )
  },
)

SlidingOverlay.displayName = 'SlidingOverlay'

export default SlidingOverlay
