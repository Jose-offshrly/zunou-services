import { DarkModeOutlined, LightModeOutlined } from '@mui/icons-material'
import { IconButton } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { useHooks } from '~/components/domain/vitals/header/VitalsSettingsModal/useHooks'
import { useVitalsContext } from '~/context/VitalsContext'
import { useOrganization } from '~/hooks/useOrganization'

export const ToggleThemeIcon = () => {
  const { setSetting, setting, initialSetting } = useVitalsContext()
  const { user } = useAuthContext()
  const { organizationId } = useOrganization()
  const { t } = useTranslation(['common', 'vitals'])
  const { updateSetting, createSetting } = useHooks()

  const toggleTheme = async () => {
    if (!user?.id) return

    const tempSetting = { ...setting }
    const newTheme = tempSetting.theme === 'light' ? 'dark' : 'light'
    tempSetting.theme = newTheme

    setSetting(tempSetting) // show UI update immediately

    try {
      if (setting.id === 'DEFAULT') {
        const { createSetting: createdSetting } = await createSetting({
          color: setting.color,
          mode: setting.mode,
          organizationId,
          theme: newTheme,
          userId: user.id,
          ...(setting.metadata.fileName && {
            fileName: setting.metadata.fileName,
          }),
          ...(setting.metadata.fileKey && {
            fileKey: setting.metadata.fileKey,
          }),
        })

        const updatedSetting = { ...tempSetting, id: createdSetting.id }
        setSetting(updatedSetting)
        initialSetting.current = updatedSetting
      } else {
        const response = await updateSetting({
          color: setting.color,
          mode: setting.mode,
          settingId: setting.id,
          theme: newTheme,
          ...(setting.metadata.fileName && {
            fileName: setting.metadata.fileName,
          }),
          ...(setting.metadata.fileKey && {
            fileKey: setting.metadata.fileKey,
          }),
        })

        setSetting(response.updateSetting)
        initialSetting.current = response.updateSetting
      }
    } catch (error) {
      setSetting(setting) // revert to old setting if there's an error
      toast.error(t('update_settings_error', { ns: 'vitals' }))
    }
  }

  return (
    <IconButton onClick={toggleTheme}>
      {setting.theme === 'light' ? (
        <LightModeOutlined sx={{ fontSize: 16 }} />
      ) : (
        <DarkModeOutlined sx={{ color: 'white', fontSize: 16 }} />
      )}
    </IconButton>
  )
}
