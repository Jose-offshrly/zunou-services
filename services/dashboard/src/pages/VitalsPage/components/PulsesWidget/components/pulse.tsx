import {
  AccountBalance,
  AccountBalanceOutlined,
  AdminPanelSettings,
  Analytics,
  Apps,
  AutoAwesome,
  BackupTableOutlined,
  BookmarkBorder,
  Business,
  Diversity2,
  GroupsOutlined,
  MeetingRoomOutlined,
  NotificationsOutlined,
  RocketLaunch,
  Settings,
  StyleOutlined,
  TerminalOutlined,
  TextSnippet,
} from '@mui/icons-material'
import {
  alpha,
  Avatar,
  Stack,
  SvgIcon,
  Typography,
  useTheme,
} from '@mui/material'
import { PulseCategory, PulseType } from '@zunou-graphql/core/graphql'
import { useGetPulseMembersQuery } from '@zunou-queries/core/hooks/useGetPulseMembersQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useMemo } from 'react'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'

const iconMap: Record<PulseType, React.ComponentType> = {
  account: AccountBalance,
  admin: AdminPanelSettings,
  app: Apps,
  book: BackupTableOutlined,
  diversity: Diversity2,
  finance: Business,
  generic: AutoAwesome,
  hr: Analytics,
  linked: AccountBalanceOutlined,
  location: MeetingRoomOutlined,
  mcp: RocketLaunch,
  note: StyleOutlined,
  ops: Settings,
  rocket: RocketLaunch,
  sdk: TerminalOutlined,
  text: TextSnippet,
}

interface PulseProps {
  id: string
  category: PulseCategory
  name: string
  icon?: PulseType | null
  notification_count: string
  member_count: string
  saved_message_count: string
  handleRedirectToPulse: (id: string) => void
  isDarkMode?: boolean
}

const Pulse = ({
  id,
  category,
  name,
  icon,
  notification_count,
  member_count,
  saved_message_count,
  handleRedirectToPulse,
  isDarkMode = false,
}: PulseProps) => {
  const { user } = useAuthContext()

  const muiTheme = useTheme()

  const IconComponent = iconMap[icon!] ?? AutoAwesome

  const { data: membersData, isLoading: isLoadingPulseMembers } =
    useGetPulseMembersQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      enabled: Boolean(id) && category === PulseCategory.Onetoone,
      variables: {
        pulseId: id,
      },
    })

  const otherMember = useMemo(() => {
    return (
      membersData?.pulseMembers.data.find(
        (member) => member.user.id !== user?.id,
      ) ?? null
    )
  }, [membersData, id, user, category])

  const pulseName = useMemo(() => {
    if (category === PulseCategory.Onetoone)
      return otherMember?.user.name ?? 'One to One'
    else if (category === PulseCategory.Personal) return 'Zunou Assistant'
    else return name
  }, [category, otherMember, name])

  return (
    <Stack
      alignItems="center"
      direction="row"
      onClick={() => handleRedirectToPulse(id)}
      padding={2}
      spacing={2}
      sx={{
        '&:hover': {
          backgroundColor: isDarkMode
            ? alpha(muiTheme.palette.primary.main, 0.1)
            : alpha(muiTheme.palette.secondary.main, 0.1),
        },
        color: isDarkMode ? 'grey.300' : 'inherit',
        cursor: 'pointer',
      }}
    >
      <Avatar
        sx={{
          alignItems: 'center',
          bgcolor: isDarkMode
            ? muiTheme.palette.primary.main
            : alpha(muiTheme.palette.primary.main, 0.1),
          display: 'flex',
          fontSize: 12,
          height: 32,
          justifyContent: 'center',
          width: 32,
        }}
        variant="rounded"
      >
        <SvgIcon
          component={IconComponent}
          sx={{
            color: isDarkMode ? 'common.white' : muiTheme.palette.primary.main,
            fontSize: 18,
          }}
        />
      </Avatar>

      <Stack flex={1} spacing={0.5}>
        {isLoadingPulseMembers && category === PulseCategory.Onetoone ? (
          <LoadingSkeleton height={12} width="100%" />
        ) : (
          <Typography
            sx={{
              color: isDarkMode ? 'grey.100' : 'text.primary',
              fontSize: '12px',
            }}
            variant="body2"
          >
            {pulseName}
          </Typography>
        )}

        <Stack direction="row" spacing={1}>
          <Stack alignItems="center" direction="row" spacing={1}>
            <NotificationsOutlined
              sx={{
                color: isDarkMode ? 'grey.500' : 'text.secondary',
                fontSize: 'x-small',
              }}
            />
            <Typography
              color={isDarkMode ? 'grey.500' : 'text.secondary'}
              fontSize="x-small"
              variant="body2"
            >
              {notification_count ?? 0}
            </Typography>
          </Stack>
          <Stack alignItems="center" direction="row" spacing={1}>
            <GroupsOutlined
              sx={{
                color: isDarkMode ? 'grey.500' : 'text.secondary',
                fontSize: 'x-small',
              }}
            />
            <Typography
              color={isDarkMode ? 'grey.500' : 'text.secondary'}
              fontSize="x-small"
              variant="body2"
            >
              {member_count ?? 0}
            </Typography>
          </Stack>
          <Stack alignItems="center" direction="row" spacing={1}>
            <BookmarkBorder
              sx={{
                color: isDarkMode ? 'grey.500' : 'text.secondary',
                fontSize: 'x-small',
              }}
            />
            <Typography
              color={isDarkMode ? 'grey.500' : 'text.secondary'}
              fontSize="x-small"
              variant="body2"
            >
              {saved_message_count ?? 0}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}

export default Pulse
