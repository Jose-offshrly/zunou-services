import { CircularProgress, SvgIconProps, Typography } from '@mui/material'
import { Button } from '@zunou-react/components/form'
import React, { ElementType } from 'react'

import { useVitalsContext } from '~/context/VitalsContext'

interface ActionButtonProps {
  icon?: ElementType<SvgIconProps> | null
  handleClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  text: string
  isLoading?: boolean
  disabled?: boolean
}

const ActionButton = ({
  icon: Icon = null,
  handleClick,
  text,
  isLoading = false,
  disabled = false,
}: ActionButtonProps) => {
  const { setting } = useVitalsContext()
  const isDarkMode = setting.theme === 'dark'

  return (
    <Button
      disabled={isLoading || disabled}
      onClick={handleClick}
      size="small"
      startIcon={
        !isLoading && Icon ? <Icon sx={{ fontSize: '0.8rem' }} /> : null
      }
      sx={{
        '& .MuiButton-startIcon': {
          marginRight: '2px',
        },
        color: isDarkMode ? 'secondary.main' : 'primary.main',
        fontSize: '0.65rem',
        height: '20px',
        minWidth: 'auto',
        p: '1px 4px',
        textTransform: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {isLoading ? (
        <CircularProgress size={10} />
      ) : (
        <Typography fontSize="0.7rem">{text}</Typography>
      )}
    </Button>
  )
}

export default ActionButton
