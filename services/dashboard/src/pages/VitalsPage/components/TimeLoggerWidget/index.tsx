import { AddCircleOutline } from '@mui/icons-material'
import { Stack } from '@mui/material'
import { t } from 'i18next'
import { useState } from 'react'

import { Widget, WidgetKeysEnum } from '~/components/domain/vitals/widgets'

import ActionButton from '../ActionButton'
import { Clock } from './components/Clock'
import { TimeLogsModal } from './components/TimeLogsModal'
import { TimeToggler } from './components/TimeToggler'

interface TimeLoggerWidgetProps {
  isExpanded?: boolean
  onExpand?: (isExpanded: boolean) => void
  organizationId?: string
  widgetId: string
}

export const TimeLoggerWidget = ({
  isExpanded,
  onExpand,
  widgetId,
}: TimeLoggerWidgetProps) => {
  const [isLogsOpen, setIsLogsOpen] = useState(false)

  return (
    <>
      <Widget
        actions={
          <ActionButton
            handleClick={() => setIsLogsOpen(true)}
            icon={AddCircleOutline}
            text={t('see_logs', { ns: 'vitals' })}
          />
        }
        id={WidgetKeysEnum.TimeLogger}
        isExpanded={isExpanded}
        name={t('time_logger', { ns: 'vitals' })}
        onExpand={onExpand}
        widgetId={widgetId}
      >
        <Stack
          alignItems="center"
          flex={1}
          justifyContent="center"
          spacing={2}
          sx={{ overflow: 'visible', pt: 2.5 }}
        >
          <Clock />
          <TimeToggler />
        </Stack>
      </Widget>
      <TimeLogsModal isOpen={isLogsOpen} onClose={() => setIsLogsOpen(false)} />
    </>
  )
}
