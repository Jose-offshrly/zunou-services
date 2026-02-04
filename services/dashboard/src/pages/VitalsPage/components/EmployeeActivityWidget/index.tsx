import { GroupsOutlined } from '@mui/icons-material'
import { Divider, Typography, useTheme } from '@mui/material'
import { alpha, Stack } from '@mui/system'
import { UserPresence } from '@zunou-graphql/core/graphql'
import { useGetOrganizationUsersQuery } from '@zunou-queries/core/hooks/useGetOrganizationUsersQuery'
import Avatar from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { WidgetKeysEnum } from '~/components/domain/vitals/widgets'
import { Widget } from '~/components/domain/vitals/widgets/Widget/Widget'
import { useVitalsContext } from '~/context/VitalsContext'
import { useOrganization } from '~/hooks/useOrganization'
import { usePresence } from '~/hooks/usePresence'
import { getPresenceColor, getPresenceText } from '~/utils/presenceUtils'

import EmptyWidgetPlaceholder from '../EmptyWidgetPlaceholder'
import { Filter, FilterType } from './components/Filter'

interface EmployeeActivityWidgetProps {
  widgetId: string
  isExpanded?: boolean
  onExpand?: (isExpanded: boolean) => void
}

export const EmployeeActivityWidget: React.FC<EmployeeActivityWidgetProps> = ({
  widgetId,
  isExpanded,
  onExpand,
}) => {
  const { t } = useTranslation('vitals')
  const { user } = useAuthContext()
  const { organizationId } = useOrganization()
  const { setting } = useVitalsContext()

  const muiTheme = useTheme()
  const [filter, setFilter] = useState<FilterType>('All')

  const isDarkMode = setting.theme === 'dark'

  const {
    data: organizationUsersData,
    isFetching: isFetchingOrganizationUsers,
    refetch,
  } = useGetOrganizationUsersQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { organizationId },
  })

  const users = useMemo(() => {
    return (
      organizationUsersData?.organizationUsers.data.filter((userData) => {
        if (userData.user.id === user?.id) return false

        if (filter === 'All') {
          return true
        }
        return userData.user.presence === filter
      }) || []
    )
  }, [organizationUsersData, filter, user?.id])

  // Collect user IDs for presence listening
  const userIds = useMemo(() => users.map(({ user }) => user.id), [users])
  const presenceMap = usePresence(userIds)

  const handleRefresh = async () => {
    if (refetch) {
      await refetch()
    }
  }

  const handleUserClick = (userId?: string) => {
    if (!userId) return
    // will add handleclick event soon if it is already available
  }

  const handleFilter = (filter: FilterType) => {
    setFilter(filter)
  }

  return (
    <Widget
      actions={<Filter activeFilter={filter} onChange={handleFilter} />}
      id={WidgetKeysEnum.EmployeeActivity}
      isExpanded={isExpanded}
      isLoading={isFetchingOrganizationUsers}
      name={t('employee_activity')}
      onExpand={onExpand}
      onRefresh={handleRefresh}
      showRefreshButton={true}
      widgetId={widgetId}
    >
      <Stack height="100%" spacing={0}>
        {users.length === 0 ? (
          <EmptyWidgetPlaceholder
            content={
              filter === 'All'
                ? t('no_org_employees')
                : t('no_filtered_employees')
            }
            icon={GroupsOutlined}
          />
        ) : (
          users.map(({ user }, index) => {
            const statusText = getPresenceText(
              presenceMap[user.id] || user.presence || UserPresence.Offline,
            )

            const badgeColor = getPresenceColor(
              presenceMap[user.id] || user.presence || UserPresence.Offline,
            )

            return (
              <div key={user.id}>
                <Stack
                  alignItems="center"
                  direction="row"
                  onClick={() => handleUserClick(user.id)}
                  padding={1}
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
                    badgeColor={badgeColor}
                    isDarkMode={isDarkMode}
                    placeholder={user.name}
                    showBadge={true}
                    src={user.gravatar}
                    variant="circular"
                  />

                  <Stack spacing={0.25} sx={{ flexGrow: 1 }}>
                    <Typography
                      fontSize="x-small"
                      fontWeight="bold"
                      sx={{
                        color: isDarkMode ? 'grey.100' : 'text.primary',
                        lineHeight: 1.2,
                      }}
                      variant="subtitle2"
                    >
                      {user.name}
                    </Typography>
                    <Typography
                      fontSize="x-small"
                      sx={{
                        color: isDarkMode ? 'grey.400' : 'text.secondary',
                        lineHeight: 1.2,
                      }}
                      variant="subtitle2"
                    >
                      {statusText}
                    </Typography>
                  </Stack>
                </Stack>
                {index < users.length - 1 && (
                  <Divider
                    sx={{
                      borderColor: isDarkMode ? 'grey.800' : undefined,
                      margin: 0,
                    }}
                  />
                )}
              </div>
            )
          })
        )}
      </Stack>
    </Widget>
  )
}
