import { Link as BaseLink, LinkProps } from '@mui/material'
import { forwardRef, PropsWithChildren } from 'react'
import {
  Link as RouterLink,
  LinkProps as RouterLinkProps,
} from 'react-router-dom'

interface BehaviorProps extends Omit<RouterLinkProps, 'to'> {
  href: string
}

interface Props extends Omit<LinkProps, 'href'> {
  href: string
}

const LinkBehavior = forwardRef<HTMLAnchorElement, BehaviorProps>(
  ({ href, ...props }, ref) => (
    <RouterLink ref={ref} to={href} {...props} role={undefined} />
  ),
)

export const Link = ({
  children,
  href,
  ...props
}: PropsWithChildren<Props>) => {
  return (
    <BaseLink component={LinkBehavior} href={href} {...props}>
      {children}
    </BaseLink>
  )
}
