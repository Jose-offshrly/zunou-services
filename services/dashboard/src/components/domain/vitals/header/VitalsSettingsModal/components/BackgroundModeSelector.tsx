import { alpha, Box, Radio, Stack, Tab, Tabs, Typography } from '@mui/material'
import { Background, SettingMode } from '@zunou-graphql/core/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import { uniqueId } from 'lodash'
import { useTranslation } from 'react-i18next'

import { useVitalsContext } from '~/context/VitalsContext'
import { useOrganization } from '~/hooks/useOrganization'

import { BackgroundImageGallery } from './BackgroundImageGallery'
import { DroppableFileZone } from './DroppableFileZone'

const COLORS = [
  { label: 'primary', value: theme.palette.primary.main },
  { label: 'secondary', value: theme.palette.secondary.main },
  { label: 'green', value: theme.palette.success.main },
  { label: 'lightgrey', value: theme.palette.grey[300] },
  { label: 'grey', value: theme.palette.grey[500] },
  { label: 'darkgrey', value: theme.palette.grey[700] },
]
interface BackgroundModeSelectorProps {
  onModeChange?: (mode: 'color' | 'image') => void
  onColorChange?: (color: string) => void
  onImageChange?: (imageUrl: string | null) => void
}
export const BackgroundModeSelector = ({
  onModeChange,
  onColorChange,
}: BackgroundModeSelectorProps) => {
  const { t } = useTranslation('vitals')
  const { user } = useAuthContext()
  const { organizationId } = useOrganization()
  const {
    setSetting,
    setting,
    setSelectedBgDraft,
    setGalleryUpdates,
    galleryUpdates,
    setGallery,
    gallery,
  } = useVitalsContext()
  const handleBackgroundSelectionModeChange = (
    _event: React.SyntheticEvent,
    newValue: number,
  ) => {
    const mode = newValue === 0 ? SettingMode.Color : SettingMode.Image
    const tempSetting = { ...setting }
    tempSetting.mode = mode
    setSetting(tempSetting)
    // Call onModeChange if provided
    if (onModeChange) {
      onModeChange(mode === SettingMode.Color ? 'color' : 'image')
    }
  }

  const handleSelectColor = (event: React.ChangeEvent<HTMLInputElement>) => {
    const color = event.target.value
    const tempSetting = { ...setting }
    tempSetting.color = color
    setSetting(tempSetting)
    // Call onColorChange if provided
    if (onColorChange) {
      onColorChange(color)
    }
  }
  const handleFileUpload = (file: File) => {
    if (!user) return

    const tempUrl = URL.createObjectURL(file)

    const tempLocal: Background = {
      active: true,
      id: uniqueId('TEMP_ID_'),
      image_url: tempUrl,
      metadata: {},
      organizationId,
      userId: user.id,
    }

    // Update gallery updates
    const tempGalleryUpdates = [
      ...galleryUpdates.map((bg) =>
        bg.status === 'CREATE' ? { ...bg, active: false } : bg,
      ),
    ]

    tempGalleryUpdates.push({
      ...tempLocal,

      status: 'CREATE',
      // Add gallery updates properties
      tempFile: file,
      tempUrl,
    })
    setGalleryUpdates(tempGalleryUpdates)

    // Update actual gallery
    const tempGallery = [...gallery]
    tempGallery.push(tempLocal)
    setGallery(tempGallery)
    setSelectedBgDraft(tempLocal)
  }
  return (
    <Stack spacing={1}>
      {/* {tempImage && <img src={tempImage} alt="" />} */}
      <Typography fontWeight="bold" variant="body2">
        {t('bg_style')}
      </Typography>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="center">
          <Tabs
            onChange={handleBackgroundSelectionModeChange}
            value={setting.mode === SettingMode.Color ? 0 : 1}
          >
            <Tab label={t('solid_color')} />
            <Tab label={t('custom_image')} />
          </Tabs>
        </Stack>
        <Stack
          direction="row"
          justifyContent="space-around"
          padding={2}
          spacing={2}
          sx={{
            display: setting.mode === SettingMode.Color ? 'flex' : 'none',
          }}
        >
          {COLORS.map((color) => (
            <Radio
              checked={color.value === setting.color}
              key={color.label}
              name="color-radio-selector"
              onChange={handleSelectColor}
              sx={{
                '&.Mui-checked': {
                  color: color.value,
                },
                '&:hover': {
                  bgcolor: alpha(color.value, 0.5),
                },
                bgcolor: alpha(color.value, 0.2),
                color: color.value,
              }}
              value={color.value}
            />
          ))}
        </Stack>
        <Stack
          spacing={3}
          sx={{
            display: setting.mode === SettingMode.Image ? 'flex' : 'none',
          }}
        >
          <DroppableFileZone onFileSelected={handleFileUpload} />
          <Box sx={{ width: '100%' }}>
            <BackgroundImageGallery />
          </Box>
        </Stack>
      </Stack>
    </Stack>
  )
}
