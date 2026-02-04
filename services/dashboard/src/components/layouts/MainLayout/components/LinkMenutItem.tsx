import { MenuItem } from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'

export const LinkMenuItem = ({
  to,
  label,
  onClick,
  isDisabled,
}: {
  to: string
  label: string
  onClick: () => void
  isDisabled?: boolean
}) => {
  const navigate = useNavigate()
  const isExternalLink = to.startsWith('http')

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault()
    onClick()
    setTimeout(() => {
      isExternalLink ? window.open(to, '_blank') : navigate(to)
    }, 0)
  }

  const linkProps = isExternalLink
    ? {}
    : { component: Link as React.ElementType, to }

  return (
    <MenuItem onClick={handleClick} {...linkProps} disabled={isDisabled}>
      {label}
    </MenuItem>
  )
}
