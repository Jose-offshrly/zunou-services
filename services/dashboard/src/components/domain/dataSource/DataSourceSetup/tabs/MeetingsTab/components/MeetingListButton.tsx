import { Button } from '@zunou-react/components/form'
import React from 'react'

interface MeetingListButtonProps extends React.ComponentProps<typeof Button> {
  isActive: boolean
}

const MeetingListButton = ({
  isActive,
  sx,
  ...props
}: MeetingListButtonProps) => {
  return (
    <Button
      disableRipple={true}
      disableTouchRipple={true}
      sx={{
        '&:hover': {
          backgroundColor: 'transparent',
          boxShadow: 'none',
        },
        borderBottom: '2px solid',
        borderColor: isActive ? 'primary.main' : 'transparent',
        borderRadius: 0,
        color: 'text.primary',
        fontWeight: isActive ? '600' : '400',
        minWidth: 'unset',
        padding: 0,
        paddingBottom: 0.5,
        ...sx,
      }}
      {...props}
    />
  )
}

export default MeetingListButton
