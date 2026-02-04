import { ButtonProps } from '@mui/material'
import { forwardRef, PropsWithChildren } from 'react'
import {
  Link as RouterLink,
  LinkProps as RouterLinkProps,
} from 'react-router-dom'

import { Button } from '../form/Button'

interface BehaviorProps extends Omit<RouterLinkProps, 'to'> {
  href: string
  target?: 'blank'
}

interface Props extends Omit<ButtonProps, 'href'> {
  href: string
  target?: '_blank'
}

const LinkBehavior = forwardRef<HTMLAnchorElement, BehaviorProps>(
  ({ href, target, ...props }, ref) => (
    <RouterLink
      ref={ref}
      target={target}
      to={href}
      {...props}
      role={undefined}
    />
  ),
)

export const ButtonLink = ({
  children,
  href,
  ...props
}: PropsWithChildren<Props>) => {
  return (
    <Button component={LinkBehavior} href={href} {...props}>
      {children}
    </Button>
  )
}
