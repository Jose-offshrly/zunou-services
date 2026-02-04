import {
  AccountBalance,
  AccountBalanceOutlined,
  Apps,
  AutoAwesome,
  BackupTableOutlined,
  Business,
  Diversity2,
  Inventory2Outlined,
  MeetingRoomOutlined,
  RocketLaunch,
  Settings,
  StyleOutlined,
  TerminalOutlined,
  TextSnippet,
} from '@mui/icons-material'
import { PulseType } from '@zunou-graphql/core/graphql'

import { HeartbeatIcon } from '~/assets/heartbeat-icon'

export const getPulseIcon = (type?: PulseType | null): React.ComponentType => {
  const iconMap: Record<PulseType, React.ComponentType> = {
    account: AccountBalance,
    admin: Inventory2Outlined,
    app: Apps,
    book: BackupTableOutlined,
    diversity: Diversity2,
    finance: Business,
    generic: AutoAwesome,
    hr: HeartbeatIcon,
    linked: AccountBalanceOutlined,
    location: MeetingRoomOutlined,
    mcp: RocketLaunch,
    note: StyleOutlined,
    ops: Settings,
    rocket: RocketLaunch,
    sdk: TerminalOutlined,
    text: TextSnippet,
  }

  return type ? iconMap[type] : AutoAwesome
}
