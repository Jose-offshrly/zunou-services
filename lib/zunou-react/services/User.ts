import { User } from '@zunou-graphql/core/graphql'

export const hasPermission = (user: User | undefined, perm: string) => {
  return user?.permissions.includes(perm)
}
