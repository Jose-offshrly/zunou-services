import { ButtonProps } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { LoadingButton } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { ReactNode } from 'react'

interface NavButtonProps extends Omit<ButtonProps, 'sx'> {
  label?: string | number | null
  customSx?: ButtonProps['sx']
  startIcon?: ReactNode
  endIcon?: ReactNode
  loading?: boolean
  outlined?: boolean
}

export const NavButton = ({
  label = null,
  customSx,
  startIcon,
  endIcon,
  onClick,
  loading = false,
  outlined = true,
  ...props
}: NavButtonProps) => {
  const isIconOnly = label === null || label === undefined || label === ''

  return (
    <LoadingButton
      endIcon={endIcon}
      loading={loading}
      onClick={onClick}
      startIcon={startIcon}
      sx={{
        '& .MuiButton-startIcon, & .MuiButton-endIcon': {
          margin: isIconOnly ? 0 : undefined,
        },
        '&.Mui-disabled:not(.MuiLoadingButton-loading)': {
          color: alpha(theme.palette.text.primary, 0.5),
        },
        '&:not(.Mui-disabled):hover': outlined
          ? {
              backgroundColor: 'primary.main',
              borderColor: 'primary.main',
              color: 'white',
            }
          : undefined,
        borderColor: outlined
          ? (theme) => alpha(theme.palette.text.primary, 0.2)
          : 'transparent',
        borderRadius: isIconOnly ? '50%' : 20,
        color: 'text.primary',
        height: isIconOnly ? 40 : undefined,
        minWidth: isIconOnly ? 40 : undefined,
        width: isIconOnly ? 40 : undefined,
        ...customSx,
      }}
      variant={outlined ? 'outlined' : 'text'}
      {...props}
    >
      {label}
    </LoadingButton>
  )
}
