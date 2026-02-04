import { AutoAwesome, Close } from '@mui/icons-material'
import {
  Divider,
  Drawer,
  IconButton,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import { Button } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { UserRoleEnum } from '@zunou-react/enums/roleEnums'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useVitalsContext } from '~/context/VitalsContext'
import { useOrganization } from '~/hooks/useOrganization'

export enum WidgetKeysEnum {
  TimeLogger = 'time-logger',
  Pulses = 'pulses',
  Notifications = 'notifications',
  Saved = 'saved-messages',
  EmployeeActivity = 'employee-activity',
  ActiveMeetings = 'active-meetings',
  DMChat = 'dm-chat',
  TeamChat = 'team-chat',
  Tasks = 'tasks',
  OrgTimeLogsWidget = 'org-timelogger',
}

interface WidgetsDrawerProps {
  loading?: boolean
  open: boolean
  onClose: () => void
  isGuest?: boolean
}

const WidgetSwitch = ({
  widgetLabel,
  widgetName,
  disabled,
}: {
  widgetLabel: string
  widgetName: string
  disabled?: boolean
}) => {
  const { organizationId } = useOrganization()
  const { widgets, setting, updateWidget } = useVitalsContext()
  const [isChecked, setIsChecked] = useState(false)

  const targetWidget = widgets.find((widget) => widget.name === widgetName)

  useEffect(() => {
    setIsChecked(Boolean(targetWidget))
  }, [widgets, widgetName])

  const isDarkMode = setting.theme === 'dark'

  return (
    <Stack alignItems="center" direction="row" justifyContent="space-between">
      <Typography
        fontSize="small"
        fontWeight="bold"
        sx={{ color: isDarkMode ? 'grey.200' : 'text.primary' }}
        variant="caption"
      >
        {widgetLabel}
      </Typography>
      <Switch
        checked={isChecked}
        color="primary"
        disabled={disabled}
        onChange={(event) => {
          const newChecked = event.target.checked
          setIsChecked(newChecked)
          updateWidget(
            widgetName,
            newChecked ? 'CREATE' : 'DELETE',
            organizationId,
            targetWidget?.id,
          )
        }}
      />
    </Stack>
  )
}

export const WidgetsDrawer = ({
  open,
  onClose,
  isGuest,
}: WidgetsDrawerProps) => {
  const { t } = useTranslation(['common', 'vitals'])
  const { userRole } = useAuthContext()
  const { setting } = useVitalsContext()

  const DEFAULT_WIDGETS = [
    { id: WidgetKeysEnum.TimeLogger, name: t('time_logger', { ns: 'vitals' }) },
    { id: WidgetKeysEnum.Pulses, name: t('your_pulses', { ns: 'vitals' }) },
    {
      id: WidgetKeysEnum.Notifications,
      name: t('notifications', { ns: 'vitals' }),
    },
    { id: WidgetKeysEnum.Saved, name: t('saved', { ns: 'vitals' }) },
    {
      id: WidgetKeysEnum.EmployeeActivity,
      name: t('employee_activity', { ns: 'vitals' }),
    },
    {
      id: WidgetKeysEnum.ActiveMeetings,
      name: t('active_meetings', { ns: 'vitals' }),
    },
    // {
    //   id: WidgetKeysEnum.DMChat,
    //   name: t('dm_chat', { ns: 'vitals' }),
    // },
    {
      id: WidgetKeysEnum.TeamChat,
      name: t('team_chat', { ns: 'vitals' }),
    },
    {
      id: WidgetKeysEnum.Tasks,
      name: t('tasks', { ns: 'vitals' }),
    },
  ]

  const isOwner = userRole === UserRoleEnum.MANAGER
  const isDarkMode = setting.theme === 'dark'

  return (
    <Drawer
      PaperProps={{
        sx: {
          bgcolor: isDarkMode ? 'grey.900' : 'background.paper',
          color: isDarkMode ? 'grey.100' : 'text.primary',
          width: 400,
        },
      }}
      anchor="right"
      onClose={onClose}
      open={open}
    >
      <Stack
        padding={3}
        spacing={2}
        sx={{
          '&::-webkit-scrollbar': { display: 'none' },
          height: '100%',
          msOverflowStyle: 'none',
          overflowY: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
        >
          <Typography fontWeight="bold" variant="h6">
            {t('edit_vitals', { ns: 'vitals' })}
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{ color: isDarkMode ? 'grey.400' : 'text.secondary' }}
          >
            <Close />
          </IconButton>
        </Stack>
        <Stack spacing={0.5}>
          <Button
            color="inherit"
            disabled={true}
            onClick={() => alert('creating widget')}
            size="large"
            startIcon={<AutoAwesome />}
            sx={{
              '&.Mui-disabled': {
                bgcolor: isDarkMode ? 'grey.800' : '',
                color: isDarkMode ? 'grey.500' : '',
              },
              bgcolor: isDarkMode ? 'grey.800' : '',
              height: 56,
            }}
            variant="contained"
          >
            <Typography>
              {t('create_ai_widget_prompt', { ns: 'vitals' })}
            </Typography>
          </Button>
          <Typography
            color={isDarkMode ? 'primary.main' : 'secondary.main'}
            variant="caption"
          >
            {t('coming_soon')}...
          </Typography>
        </Stack>
        <Divider sx={{ borderColor: isDarkMode ? 'grey.800' : 'grey.200' }} />
        <Typography
          color={isDarkMode ? 'grey.400' : 'text.secondary'}
          variant="body2"
        >
          {t('widget_drawer_description', { ns: 'vitals' })}
        </Typography>
        <Divider sx={{ borderColor: isDarkMode ? 'grey.800' : 'grey.200' }} />
        {[
          ...DEFAULT_WIDGETS,
          ...(isOwner
            ? [
                {
                  id: WidgetKeysEnum.OrgTimeLogsWidget,
                  name: t('admin_time_logs', { ns: 'vitals' }),
                },
              ]
            : []),
        ].map(({ id, name }) => (
          <WidgetSwitch
            disabled={isGuest}
            key={id}
            widgetLabel={name}
            widgetName={id}
          />
        ))}
      </Stack>
    </Drawer>
  )
}
