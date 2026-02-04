import { PulseMemberRole } from '@zunou-graphql/core/graphql'
import { ValueOf } from 'zunou-react/utils/valueOf'

export const PulsePermissionEnum = {
  CREATE_DATA_SOURCE: 'create:data-source',
  CREATE_PULSE: 'create:pulse',
  CREATE_PULSE_TASK: 'create:pulse-task',
  CREATE_PULSE_TASK_LIST: 'create:pulse-task-list',
  DELETE_DATA_SOURCE: 'delete:data-source',
  DELETE_PULSE: 'delete:pulse',
  DELETE_PULSE_MEMBER: 'delete:pulse-member',
  READ_PULSE_MEMBER: 'read:pulse-member',
  UPDATE_DATA_SOURCE: 'update:data-sources',
  UPDATE_PULSE: 'update:pulse',
  UPDATE_PULSE_MEMBER: 'update:pulse-member',
} as const

export type PulsePermission = ValueOf<typeof PulsePermissionEnum>

export const PulsePermissionMap: Record<PulseMemberRole, PulsePermission[]> = {
  // Set of permissions for a pulse OWNER
  [PulseMemberRole.Owner]: [
    PulsePermissionEnum.CREATE_DATA_SOURCE,
    PulsePermissionEnum.DELETE_PULSE,
    PulsePermissionEnum.UPDATE_PULSE_MEMBER,
    PulsePermissionEnum.READ_PULSE_MEMBER,
    PulsePermissionEnum.UPDATE_DATA_SOURCE,
    PulsePermissionEnum.DELETE_DATA_SOURCE,
    PulsePermissionEnum.CREATE_PULSE_TASK,
    PulsePermissionEnum.CREATE_PULSE_TASK_LIST,
  ],
  // Set of permissions for a pulse ADMIN
  [PulseMemberRole.Admin]: [
    PulsePermissionEnum.CREATE_DATA_SOURCE,
    PulsePermissionEnum.UPDATE_PULSE_MEMBER,
    PulsePermissionEnum.READ_PULSE_MEMBER,
    PulsePermissionEnum.UPDATE_DATA_SOURCE,
    PulsePermissionEnum.DELETE_DATA_SOURCE,
    PulsePermissionEnum.CREATE_PULSE_TASK,
    PulsePermissionEnum.CREATE_PULSE_TASK_LIST,
  ],
  // Set of permissions for a pulse GUEST
  [PulseMemberRole.Guest]: [],
  // Set of permissions for a pulse STAFF
  [PulseMemberRole.Staff]: [],
}
