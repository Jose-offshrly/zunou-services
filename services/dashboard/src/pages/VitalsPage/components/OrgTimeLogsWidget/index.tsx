import {
  AccountCircleOutlined,
  CalendarTodayOutlined,
  ChevronRight,
} from '@mui/icons-material'
import { alpha, Divider, Stack, Typography } from '@mui/material'
import { useGetTimesheetsQuery } from '@zunou-queries/core/hooks/useGetTimesheetsQuery'
import { Button } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Widget, WidgetKeysEnum } from '~/components/domain/vitals/widgets'
import { NoDataText } from '~/components/ui/NoDataText'
import { getWeekRange } from '~/utils/dateUtils'

import ActionButton from '../ActionButton'
import { TimeLogChip } from '../TimeLoggerWidget/components/TimeLogChip'
import { LoadingState } from './components/LoadingState'
import { OrgTimeLogsModal } from './components/OrgTimeLogsModal'

interface TimeLoggerWidgetProps {
  isExpanded?: boolean
  onExpand?: (isExpanded: boolean) => void
  organizationId?: string
  widgetId: string
}

export const OrgTimeLogsWidget = ({
  isExpanded,
  onExpand,
  widgetId,
}: TimeLoggerWidgetProps) => {
  const { t } = useTranslation('vitals')
  const [isLogsOpen, setIsLogsOpen] = useState(false)

  const { endDate, startDate } = getWeekRange(dayjs())

  const { data: timesheetsData, isLoading: isLoadingTimesheets } =
    useGetTimesheetsQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        dateRange: { from: startDate, to: endDate },
      },
    })
  const timesheets = timesheetsData?.timesheets ?? []

  const handleDownload = () => alert('Downloading file...')

  return (
    <>
      <Widget
        actions={
          <ActionButton
            disabled={true}
            handleClick={handleDownload}
            text={t('download_csv')}
          />
        }
        id={WidgetKeysEnum.TimeLogger}
        isExpanded={isExpanded}
        name={t('admin_time_logs')}
        onExpand={onExpand}
        widgetId={widgetId}
      >
        <Stack height="100%" spacing={1}>
          <Stack
            borderRadius={1}
            p={2}
            spacing={1}
            sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}
          >
            <Button
              endIcon={<ChevronRight fontSize="small" />}
              startIcon={<AccountCircleOutlined fontSize="small" />}
              sx={{
                '& .MuiButton-endIcon': {
                  marginLeft: 'auto',
                },
                '&:hover': {
                  backgroundColor: 'common.white',
                },
                backgroundColor: 'common.white',
                color: ' inherit',
                justifyContent: 'flex-start',
              }}
              variant="contained"
            >
              {t('all_users')}
            </Button>
            <Button
              endIcon={<ChevronRight fontSize="small" />}
              startIcon={<CalendarTodayOutlined fontSize="small" />}
              sx={{
                '& .MuiButton-endIcon': {
                  marginLeft: 'auto',
                },
                '&:hover': {
                  backgroundColor: 'common.white',
                },
                backgroundColor: 'common.white',
                color: ' inherit',
                justifyContent: 'flex-start',
              }}
              variant="contained"
            >
              {t('today')}
            </Button>
          </Stack>
          <Typography fontWeight="bold" variant="caption">
            {t('recent_logs')}
          </Typography>
          <Stack
            flex={1}
            minHeight={0}
            overflow="scroll"
            paddingRight={2}
            spacing={1.5}
          >
            {isLoadingTimesheets ? (
              <LoadingState />
            ) : timesheets.length === 0 ? (
              <NoDataText />
            ) : (
              timesheets.map(({ checked_out_at, total, user }, index) => (
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  key={index}
                >
                  <Typography variant="body2">{user?.name}</Typography>
                  <TimeLogChip
                    checkOut={
                      checked_out_at
                        ? dayjs(checked_out_at).format('MMMM DD')
                        : null
                    }
                    total={total}
                  />
                </Stack>
              ))
            )}
          </Stack>
          <Divider />
          <Button onClick={() => setIsLogsOpen(true)}>
            {t('see_org_logs')}
          </Button>
        </Stack>
      </Widget>
      <OrgTimeLogsModal
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
      />
    </>
  )
}
