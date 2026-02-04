import { AdminPanelSettingsOutlined, EditOutlined } from '@mui/icons-material'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { Icon, IconButton, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Button } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { CustomModalWithSubmit } from '~/components/ui/CustomModalWithSubmit'
import { toTitleCase } from '~/utils/toTitleCase'

import { AccountsTab, GeneralTab, PlanTab } from './tabs'
import AdminTab from './tabs/AdminTab'

enum TabIdentifier {
  GENERAL = 'general',
  ACCOUNTS = 'accounts',
  ADMIN = 'admin',
  PLAN = 'plan',
}

const getIcon = (id: TabIdentifier) => {
  switch (id) {
    case TabIdentifier.GENERAL:
      return SettingsOutlinedIcon
    case TabIdentifier.ACCOUNTS:
      return AccountCircleOutlinedIcon
    case TabIdentifier.ADMIN:
      return AdminPanelSettingsOutlined
    case TabIdentifier.PLAN:
      return CreditCardOutlinedIcon
    default:
      return SettingsOutlinedIcon
  }
}

interface OrganizationSettingsModalProps {
  handleClose: () => void
  isOpen: boolean
}

export const OrganizationSettingsModal = ({
  handleClose,
  isOpen,
}: OrganizationSettingsModalProps) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabIdentifier>(
    TabIdentifier.GENERAL,
  )
  const [isEditMode, setIsEditMode] = useState(false)
  const [hasFormChanges, setHasFormChanges] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submitFormRef = useRef<(() => void) | null>(null)
  const cancelFormRef = useRef<(() => void) | null>(null)

  const tabs = Object.values(TabIdentifier).map((value) => ({
    icon: getIcon(value),
    id: value,
    label: toTitleCase(t(value)),
  }))

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
    setIsEditMode(false)
    setHasFormChanges(false)
    setIsSubmitting(false)
    handleClose()
  }

  return (
    <CustomModalWithSubmit
      customHeaderActions={
        !isEditMode && activeTab === TabIdentifier.GENERAL ? (
          <IconButton onClick={handleEditClick} size="small">
            <Icon component={EditOutlined} fontSize="small" />
          </IconButton>
        ) : undefined
      }
      disabledSubmit={!hasFormChanges || isSubmitting}
      isEditable={isEditMode}
      isOpen={isOpen}
      isSubmitting={isSubmitting}
      maxHeight={600}
      minHeight={600}
      onCancel={handleCancel}
      onClose={handleCloseModal}
      onSubmit={handleSave}
      style={{ maxWidth: 800 }}
      submitText={t('save_changes', { ns: 'settings' })}
      title={t('organization')}
    >
      <Stack direction="row" spacing={2}>
        <Stack minWidth={130} spacing={1}>
          {tabs.map(({ icon, id, label }, index) => (
            <Button
              disabled={id === TabIdentifier.PLAN}
              key={index}
              onClick={() => setActiveTab(id)}
              startIcon={<Icon component={icon} fontSize="small" />}
              sx={{
                alignItems: 'start',
                bgcolor:
                  activeTab === id
                    ? alpha(theme.palette.primary.main, 0.1)
                    : '',
                color: 'text.primary',
                justifyContent: 'start',
                paddingX: 1.5,
                paddingY: 1,
                textTransform: 'none',
              }}
            >
              <Typography fontSize={14} fontWeight={4}>
                {label}
              </Typography>
            </Button>
          ))}
        </Stack>
        <Stack flex={1} px={2} sx={{ overflow: 'hidden' }}>
          {activeTab === TabIdentifier.GENERAL && (
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
          {activeTab === TabIdentifier.ACCOUNTS && (
            <AccountsTab onUserDemote={handleClose} />
          )}
          {activeTab === TabIdentifier.ADMIN && (
            <AdminTab handleClose={handleClose} />
          )}
          {activeTab === TabIdentifier.PLAN && <PlanTab />}
        </Stack>
      </Stack>
    </CustomModalWithSubmit>
  )
}
