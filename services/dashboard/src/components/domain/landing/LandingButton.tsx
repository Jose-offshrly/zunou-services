import { LoadingButtonProps } from '@mui/lab/LoadingButton'
import { LoadingButton } from '@zunou-react/components/form'
import React from 'react'

interface LandingButtonProps extends LoadingButtonProps {
  onClick: () => void
}

const LandingButton: React.FC<LandingButtonProps> = ({
  children,
  onClick,
  sx,
  variant = 'contained',
  ...rest
}) => {
  return (
    <LoadingButton
      onClick={onClick}
      size="large"
      // Custom styling for landing page buttons
      sx={{
        borderRadius: 2,
        fontSize: 'large',
        px: 4,
        py: 1.5,
        ...sx,
      }}
      variant={variant}
      {...rest}
    >
      {children}
    </LoadingButton>
  )
}

export default LandingButton
