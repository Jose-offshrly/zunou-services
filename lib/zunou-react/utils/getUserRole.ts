import { OrganizationUserRole, User } from '@zunou-graphql/core/graphql'
import { UserRoleEnum } from '@zunou-react/enums/roleEnums'
import { UserRoleType } from '@zunou-react/types/role'

const userRoleMap: Record<OrganizationUserRole, UserRoleType> = {
  [OrganizationUserRole.User]: UserRoleEnum.EMPLOYEE,
  [OrganizationUserRole.Owner]: UserRoleEnum.MANAGER,
  [OrganizationUserRole.Guest]: UserRoleEnum.GUEST,
}

export const getUserRole = (user: User): UserRoleType => {
  let organizationUser

  const lastOrganizationId = user.lastOrganizationId

  if (lastOrganizationId) {
    organizationUser = user.organizationUsers.data.find(
      (orguser) => orguser.organizationId === lastOrganizationId,
    )
  } else {
    ;[organizationUser] = user.organizationUsers.data
  }

  return userRoleMap[organizationUser?.role ?? OrganizationUserRole.Guest]
}
