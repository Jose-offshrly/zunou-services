import { DataSourceType, Strategy } from '@zunou-graphql/core/graphql'

export interface PulseFormData {
  automations: Strategy[]
  companyName?: string
  missionText?: string
  missions: Strategy[]
}

export interface Person {
  id: string
  name: string
  role: string
  avatarSrc?: string
  selected?: boolean
  isOwner?: boolean
}

export interface IconOption {
  iconType: string | React.ComponentType
  label: string
  value: string
}

export interface DataSource {
  fileKey: string
  name: string
  type: DataSourceType
  description: string
}
