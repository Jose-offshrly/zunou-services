import BaseLoadingButton, { LoadingButtonProps } from '@mui/lab/LoadingButton'
import { styled } from '@mui/material/styles'
import { Image } from '@zunou-react/components/utility'
import { PropsWithChildren } from 'react'

interface OnboardingSlackButtonProps extends LoadingButtonProps {
  onClick: () => void
  iconSrc?: string
  iconAlt?: string
}

const Button = styled(BaseLoadingButton)(({ theme }) => ({
  borderColor: theme.palette.grey['300'],
  borderRadius: theme.spacing(1),
  color: theme.palette.grey['700'],
  fontWeight: theme.typography.fontWeightMedium,
  padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
  textTransform: 'none',
  width: 'fit-content',
}))

export const OnboardingSlackButton = ({
  children,
  iconAlt,
  iconSrc,
  onClick,
}: PropsWithChildren<OnboardingSlackButtonProps>) => {
  return (
    <Button
      fullWidth={false}
      onClick={onClick}
      startIcon={iconSrc && <Image alt={iconAlt} src={iconSrc} />}
      variant="outlined"
    >
      {children}
    </Button>
  )
}
