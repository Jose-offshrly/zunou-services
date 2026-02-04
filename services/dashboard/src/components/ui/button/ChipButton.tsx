import { alpha, ChipProps } from '@mui/material'
import { Chip } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'

interface ChipButtonProps extends ChipProps {
  label: React.ReactNode | string
  isActive?: boolean
}

export const ChipButton = ({
  isActive,
  label,
  variant,
  sx,
  ...props
}: ChipButtonProps) => {
  return (
    <Chip
      {...props}
      label={label}
      sx={{
        '&:hover': {
          bgcolor: isActive
            ? alpha(theme.palette.primary.main, 0.2)
            : undefined,
        },
        backgroundColor: isActive
          ? alpha(theme.palette.primary.main, 0.1)
          : undefined,
        border: 1,
        borderColor: isActive
          ? alpha(theme.palette.primary.main, 0.2)
          : alpha(theme.palette.text.secondary, 0.5),
        ...sx,
      }}
      variant={variant ?? isActive ? 'filled' : 'outlined'}
    />
  )
}
