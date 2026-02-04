import { useAuthContext } from '@zunou-react/contexts/AuthContext'

import { PulsePermission } from '~/types/permissions'

export const useAccessControl = () => {
  const { user } = useAuthContext()

  const checkAccess = (
    requiredPermissions: PulsePermission[],
    permissions: string[],
  ) => {
    if (!user)
      return {
        grant: false,
      }

    return _internalCheckAccess({
      permissions,
      requiredPermissions,
    })
  }

  return {
    checkAccess,
  }
}

const _internalCheckAccess = ({
  requiredPermissions,
  permissions,
}: {
  requiredPermissions: PulsePermission[]
  permissions: string[]
}): { grant: boolean } => {
  if (!permissions) {
    return { grant: false }
  }

  const grant = requiredPermissions.every((requiredPermission) =>
    permissions.includes(requiredPermission),
  )

  return {
    grant,
  }
}
