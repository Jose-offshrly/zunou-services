import { AutoAwesome } from '@mui/icons-material'
import { Divider } from '@mui/material'
import { Stack } from '@mui/system'
import { PulseCategory } from '@zunou-graphql/core/graphql'
import { useGetPulsesQuery } from '@zunou-queries/core/hooks/useGetPulsesQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { WidgetKeysEnum } from '~/components/domain/vitals/widgets'
import { Widget } from '~/components/domain/vitals/widgets/Widget/Widget'
import { useVitalsContext } from '~/context/VitalsContext'
import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

import EmptyWidgetPlaceholder from '../EmptyWidgetPlaceholder'
import Pulse from './components/pulse'

interface PulsesWidgetProps {
  widgetId: string
  isExpanded?: boolean
  onExpand?: (isExpanded: boolean) => void
}

export const PulsesWidget: React.FC<PulsesWidgetProps> = ({
  widgetId,
  isExpanded,
  onExpand,
}) => {
  const { t } = useTranslation('vitals')
  const navigate = useNavigate()
  const { organizationId } = useOrganization()
  const { userRole } = useAuthContext()
  const { setting } = useVitalsContext()
  const isDarkMode = setting.theme === 'dark'

  const {
    data: pulsesData,
    isFetching: isFetchingPulses,
    refetch,
  } = useGetPulsesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { organizationId },
  })
  const pulses = pulsesData?.pulses ?? []
  const handleRefresh = async () => {
    if (refetch) await refetch()
  }
  const handleRedirectToPulse = (pulseId: string) => {
    const rolePrefix = userRole?.toLowerCase()
    navigate(
      `/${rolePrefix}/${pathFor({
        pathname: Routes.PulseDetail,
        query: { organizationId, pulseId },
      })}`,
    )
  }
  return (
    <Widget
      id={WidgetKeysEnum.Pulses}
      isExpanded={isExpanded}
      isLoading={isFetchingPulses}
      name={t('your_pulses')}
      onExpand={onExpand}
      onRefresh={handleRefresh}
      showRefreshButton={true}
      widgetId={widgetId}
    >
      <Stack spacing={1} sx={{ height: '100%' }}>
        {pulses.length > 0 ? (
          pulses.map(
            (
              {
                id,
                name,
                icon,
                notification_count,
                member_count,
                saved_message_count,
                category,
              },
              index,
            ) => {
              return (
                <div key={id}>
                  <Pulse
                    category={category ?? PulseCategory.Team}
                    handleRedirectToPulse={handleRedirectToPulse}
                    icon={icon ?? null}
                    id={id}
                    isDarkMode={isDarkMode}
                    member_count={member_count ?? '0'}
                    name={name}
                    notification_count={notification_count ?? '0'}
                    saved_message_count={saved_message_count ?? '0'}
                  />
                  {index < pulses.length - 1 && (
                    <Divider
                      sx={{ borderColor: isDarkMode ? 'grey.800' : undefined }}
                    />
                  )}
                </div>
              )
            },
          )
        ) : (
          <EmptyWidgetPlaceholder content={t('no_pulses')} icon={AutoAwesome} />
        )}
      </Stack>
    </Widget>
  )
}
