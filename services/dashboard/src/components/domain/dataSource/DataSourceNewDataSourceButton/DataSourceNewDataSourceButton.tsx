import { styled } from '@mui/material/styles'
import { Button as BaseButton } from '@zunou-react/components/form'
import { ReactElement } from 'react'

interface DataSourceNewDataSourceButtonProps {
  onClick: () => void
  text: string
  icon?: ReactElement
}

const Button = styled(BaseButton)(({ theme }) => ({
  borderColor: theme.palette.grey['300'],
  borderRadius: theme.spacing(1),
  color: theme.palette.grey['700'],
  fontWeight: theme.typography.fontWeightMedium,
  padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
  width: 'fit-content',
}))

export const DataSourceNewDataSourceButton = ({
  icon,
  onClick,
  text,
}: DataSourceNewDataSourceButtonProps) => {
  return (
    <Button
      fullWidth={false}
      onClick={onClick}
      startIcon={icon}
      variant="outlined"
    >
      {text}
    </Button>
  )
}
