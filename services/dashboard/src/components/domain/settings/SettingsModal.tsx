import {
  AccountTreeOutlined,
  DeleteOutlined,
  EditOutlined,
  NotificationsNone,
} from '@mui/icons-material'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { Icon, IconButton, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { OrganizationUserRole } from '@zunou-graphql/core/graphql'
import { useGetOrganizationUserQuery } from '@zunou-queries/core/hooks/useGetOrganizationUserQuery'
import { Button } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { CustomModalWithSubmit } from '~/components/ui/CustomModalWithSubmit'
import { useOrganization } from '~/hooks/useOrganization'
import { mockPersonalization } from '~/libs/mockPersonalization'
import versionData from '~/version.json'

import GeneralTab from './tabs/GeneralTab'
import LinkedAccountsTab from './tabs/LinkedAccountsTab'
import NotificationsTab from './tabs/NotificationsTab'

export enum SettingsTabIdentifier {
  GENERAL = 'general',
  'LINKED ACCOUNTS' = 'linked_accounts',
  NOTIFICATIONS = 'notifications',
  PERSONALIZATION = 'personalization',
}
interface SettingsModalProps {
  handleClose: () => void
  isOpen: boolean
  initialTab?: SettingsTabIdentifier
  onGoogleCalendarLink?: () => void
}

const getTabIcon = (id: SettingsTabIdentifier) => {
  switch (id) {
    case SettingsTabIdentifier.GENERAL:
      return SettingsOutlinedIcon
    case SettingsTabIdentifier.PERSONALIZATION:
      return AccountCircleOutlinedIcon
    case SettingsTabIdentifier.NOTIFICATIONS:
      return NotificationsNone
    case SettingsTabIdentifier['LINKED ACCOUNTS']:
      return AccountTreeOutlined
    default:
      return SettingsOutlinedIcon
  }
}

export const SettingsModal = ({
  handleClose,
  isOpen,
  initialTab = SettingsTabIdentifier.GENERAL,
  onGoogleCalendarLink,
}: SettingsModalProps) => {
  const { t } = useTranslation()
  const { organizationId } = useOrganization()
  const { user } = useAuthContext()

  const [activeTab, setActiveTab] = useState<SettingsTabIdentifier>(initialTab)
  const [isEditMode, setIsEditMode] = useState(false)
  const [hasFormChanges, setHasFormChanges] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submitFormRef = useRef<(() => void) | null>(null)
  const cancelFormRef = useRef<(() => void) | null>(null)

  const tabs = Object.values(SettingsTabIdentifier).map((value) => ({
    icon: getTabIcon(value),
    id: value,
    label: t(value),
  }))

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const { data: organizationUserData } = useGetOrganizationUserQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
      userId: user?.id,
    },
  })

  const currentUserRole = organizationUserData?.organizationUser?.role
  const isGuest = currentUserRole === OrganizationUserRole.Guest

  const handleEditClick = () => {
    setIsEditMode(true)
  }

  const handleCancel = () => {
    if (cancelFormRef.current) {
      cancelFormRef.current()
    }
    setIsEditMode(false)
    setHasFormChanges(false)
    setIsSubmitting(false)
  }

  const handleSave = () => {
    if (submitFormRef.current && !isSubmitting) {
      setIsSubmitting(true)
      submitFormRef.current()
    }
  }

  const handleCloseModal = () => {
    setActiveTab(initialTab)
    setIsEditMode(false)
    setHasFormChanges(false)
    setIsSubmitting(false)
    handleClose()
  }

  return (
    <CustomModalWithSubmit
      customHeaderActions={
        !isEditMode && activeTab === SettingsTabIdentifier.GENERAL ? (
          <IconButton onClick={handleEditClick} size="small">
            <Icon component={EditOutlined} fontSize="small" />
          </IconButton>
        ) : undefined
      }
      disabledSubmit={!hasFormChanges || isSubmitting}
      isEditable={isEditMode}
      isOpen={isOpen}
      isSubmitting={isSubmitting}
      onCancel={handleCancel}
      onClose={handleCloseModal}
      onSubmit={handleSave}
      style={{ maxWidth: 1000 }}
      submitText={t('save_changes', { ns: 'settings' })}
      title={t('settings')}
    >
      <Stack direction="row" spacing={2}>
        <Stack gap={5} justifyContent="space-between">
          <Stack minWidth={200} spacing={1}>
            {tabs.map(({ icon, id, label }, index) => {
              return (
                <Button
                  disabled={
                    (id === SettingsTabIdentifier['LINKED ACCOUNTS'] &&
                      isGuest) ||
                    id === SettingsTabIdentifier.PERSONALIZATION
                  }
                  key={index}
                  onClick={() => setActiveTab(id)}
                  startIcon={<Icon component={icon} fontSize="small" />}
                  sx={{
                    alignItems: 'start',
                    bgcolor:
                      activeTab === id
                        ? alpha(theme.palette.primary.main, 0.2)
                        : '',
                    color: 'text.primary',
                    justifyContent: ' start',
                    paddingX: 2,
                    paddingY: 1,
                  }}
                >
                  <Typography fontSize={14} fontWeight={4}>
                    {label}
                  </Typography>
                </Button>
              )
            })}
          </Stack>
          <Typography
            color={(theme) => theme.palette.primary.main}
            sx={{
              paddingX: 2,
              paddingY: 1,
            }}
            variant="caption"
          >
            v{versionData.version}
          </Typography>
        </Stack>

        <Stack flex={1} overflow="auto" px={2}>
          {activeTab === SettingsTabIdentifier.GENERAL && (
            <GeneralTab
              isEditMode={isEditMode}
              onCancelRef={cancelFormRef}
              onFormChange={setHasFormChanges}
              onSave={() => {
                setIsEditMode(false)
                setHasFormChanges(false)
                setIsSubmitting(false)
              }}
              onSubmitRef={submitFormRef}
            />
          )}

          {activeTab === SettingsTabIdentifier.PERSONALIZATION && (
            <Stack spacing={2}>
              <Typography color="text.primary" fontSize={14} fontWeight="500">
                Items pulse remembers about to help with responses
              </Typography>
              {mockPersonalization.map(({ title, value }, index) => (
                <Stack
                  border={1}
                  borderColor={alpha(theme.palette.primary.main, 0.1)}
                  borderRadius={2}
                  key={index}
                  p={2}
                  spacing={2}
                >
                  <Stack
                    alignItems="center"
                    direction="row"
                    justifyContent="space-between"
                  >
                    <Typography
                      color="text.primary"
                      fontSize={14}
                      fontWeight="500"
                    >
                      {title}
                    </Typography>
                    <IconButton>
                      <DeleteOutlined fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Stack>
                    <Typography
                      color="text.secondary"
                      fontSize={12}
                      fontWeight="400"
                    >
                      {value}
                    </Typography>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}

          {activeTab === SettingsTabIdentifier.NOTIFICATIONS && (
            <NotificationsTab />
          )}

          {activeTab === SettingsTabIdentifier['LINKED ACCOUNTS'] && (
            <LinkedAccountsTab onGoogleCalendarLink={onGoogleCalendarLink} />
          )}
        </Stack>
      </Stack>
    </CustomModalWithSubmit>
  )
}
