import { Stack } from '@mui/material'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { VitalsCustomModalWithSubmit } from '~/components/ui/VitalsCustomModalWithSubmit'
import { useVitalsContext } from '~/context/VitalsContext'
import { useOrganization } from '~/hooks/useOrganization'

import { BackgroundModeSelector } from './components/BackgroundModeSelector'
import { ThemeSelector } from './components/ThemeSelector'
import { useHooks } from './useHooks'

interface VitalsSettingsModalProps {
  isOpen: boolean
  handleClose: () => void
}

export const VitalsSettingsModal = ({
  isOpen,
  handleClose,
}: VitalsSettingsModalProps) => {
  const { t } = useTranslation(['common', 'vitals'])
  const {
    setBackground,
    initialSetting,
    initialGallery,
    initialBackground,
    setSetting,
    setting,
    setSelectedBgDraft,
    selectedBgDraft,
    setGallery,
    galleryUpdates,
    setGalleryUpdates,
  } = useVitalsContext()
  const { user } = useAuthContext()
  const { organizationId } = useOrganization()

  const [isSubmitting, setSubmitting] = useState(false)

  const {
    updateSetting,
    createSetting,
    updateBackground,
    uploadAndCreateBackground,
    deleteBackground,
  } = useHooks()

  const handleSubmit = async () => {
    try {
      if (!user?.id) return

      setSubmitting(true)

      if (setting.id === 'DEFAULT') {
        const { createSetting: createdSetting } = await createSetting({
          color: setting.color,
          mode: setting.mode,
          organizationId,
          theme: setting.theme,
          userId: user?.id,
          ...(setting.metadata.fileName && {
            fileName: setting.metadata.fileName,
          }),
          ...(setting.metadata.fileKey && {
            fileKey: setting.metadata.fileKey,
          }),
        })

        const tempSetting = { ...setting }

        tempSetting.id = createdSetting.id

        setSetting(tempSetting)
        initialSetting.current = tempSetting
      } else {
        const response = await updateSetting({
          color: setting.color,
          mode: setting.mode,
          settingId: setting.id,
          theme: setting.theme,
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

      const toCreate = galleryUpdates.filter((bg) => bg.status === 'CREATE')

      const toDelete = galleryUpdates.filter((bg) => bg.status === 'DELETE')

      const createPromises = toCreate.map((bg) => uploadAndCreateBackground(bg))
      const createResponses = await Promise.all(createPromises)

      const deletePromises = toDelete.map((bg) => deleteBackground(bg.id))
      await Promise.all(deletePromises)

      if (selectedBgDraft) {
        const isSelectedTemp = selectedBgDraft.id.includes('TEMP_ID_')

        const newlyCreatedBg = createResponses.find(
          (res) => res?.isSelectedBg,
        )?.createBackground

        await updateBackground({
          active: true,
          backgroundId:
            isSelectedTemp && newlyCreatedBg
              ? newlyCreatedBg.id
              : selectedBgDraft.id,
        })

        setBackground(
          (isSelectedTemp ? newlyCreatedBg : selectedBgDraft) ?? null,
        )

        setSelectedBgDraft(
          (isSelectedTemp ? newlyCreatedBg : selectedBgDraft) ?? null,
        )

        initialBackground.current =
          (isSelectedTemp ? newlyCreatedBg : selectedBgDraft) ?? null
      }

      setGalleryUpdates([])

      toast.success(t('update_settings_success', { ns: 'vitals' }))

      handleClose()
    } catch (error) {
      toast.error(t('update_settings_error', { ns: 'vitals' }))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (isSubmitting) return

    setSetting({ ...initialSetting.current, theme: setting.theme })

    setBackground(initialBackground.current)

    setGallery(initialGallery.current)

    setSelectedBgDraft(initialBackground.current)
    setGalleryUpdates([])
    handleClose()
  }

  return (
    <VitalsCustomModalWithSubmit
      disabledSubmit={isSubmitting}
      isOpen={isOpen}
      isSubmitting={isSubmitting}
      onCancel={handleCancel}
      onClose={handleCancel}
      onSubmit={handleSubmit}
      subheader={t('vitals_settings_description', { ns: 'vitals' })}
      submitText={t('submit')}
      title={t('vitals_settings_title', { ns: 'vitals' })}
      vitalsMode={true}
    >
      <Stack spacing={2}>
        <ThemeSelector />
        <BackgroundModeSelector />
      </Stack>
    </VitalsCustomModalWithSubmit>
  )
}
