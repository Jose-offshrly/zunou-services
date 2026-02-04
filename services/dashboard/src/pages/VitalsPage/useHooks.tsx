import { useGetBackgroundsQuery } from '@zunou-queries/core/hooks/useGetBackgroundsQuery'
import { useGetSettingQuery } from '@zunou-queries/core/hooks/useGetSettingQuery'
import { useGetWidgetsQuery } from '@zunou-queries/core/hooks/useGetWidgetsQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import _ from 'lodash'
import { useEffect, useState } from 'react'

import { WidgetKeysEnum } from '~/components/domain/vitals/widgets'
import { DEFAULT_SETTING, useVitalsContext } from '~/context/VitalsContext'
import { useOrganization } from '~/hooks/useOrganization'

export const useHooks = () => {
  const {
    setSettingDraftMode,
    setWidgetsDraftMode,
    setSelectedBgDraft,
    initialBackground,
    setGallery,
    initialGallery,
    setBackground,
    background,
    setSetting,
    initialSetting,
    setWidgets,
    initialWidgets,
    setting,
  } = useVitalsContext()
  const { organizationId } = useOrganization()
  const { user } = useAuthContext()

  const [applyingWidgets, setApplyingWidgets] = useState(false)

  const { data: widgetsData, isLoading: isLoadingWidgets } = useGetWidgetsQuery(
    {
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        organizationId: organizationId,
        userId: user?.id,
      },
    },
  )

  const { data: settingData, isLoading: isLoadingSetting } = useGetSettingQuery(
    {
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        organizationId: organizationId,
        userId: user?.id,
      },
    },
  )

  const { data: backgroundsData, isLoading: isLoadingBackgrounds } =
    useGetBackgroundsQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        organizationId,
        userId: user?.id,
      },
    })

  // When switching orgs set drafting to false
  useEffect(() => {
    setWidgetsDraftMode(false)
    setSettingDraftMode(false)
  }, [organizationId])

  // Setup Settings
  useEffect(() => {
    if (!settingData?.setting) {
      // when using default setting, preserve light/dark theme if user has set it in the insights page
      const defaultSettingWithLocalTheme = {
        ...DEFAULT_SETTING,
        theme: setting.theme,
      }

      initialSetting.current = defaultSettingWithLocalTheme
      setSetting(defaultSettingWithLocalTheme)
      return
    }

    // If completely the same no need to set it again to avoid defaulting to light theme
    if (JSON.stringify(settingData.setting) === JSON.stringify(setting)) return
    setSetting(settingData.setting)
    initialSetting.current = settingData.setting
  }, [settingData])

  // Setup Widgets
  useEffect(() => {
    setApplyingWidgets(true)

    if (!widgetsData?.widgets) {
      initialWidgets.current = []
      setWidgets([])
      return
    }

    const seen = new Set<string>()

    // Make sure there is no duplicated widgets and all widgets exist in WidgetKeysEnum
    setWidgets(
      widgetsData?.widgets.filter((widget) => {
        const isValid = (Object.values(WidgetKeysEnum) as string[]).includes(
          widget.name,
        )
        const isDuplicate = seen.has(widget.name)
        if (isValid && !isDuplicate) {
          seen.add(widget.name)
          return true
        }
        return false
      }),
    )

    initialWidgets.current = widgetsData?.widgets
    setApplyingWidgets(true)
  }, [widgetsData])

  // Setup Background/Gallery
  useEffect(() => {
    if (
      !backgroundsData?.backgrounds ||
      backgroundsData.backgrounds.data.length === 0
    ) {
      setSelectedBgDraft(null)
      setBackground(null)
      initialBackground.current = null
      setGallery([])
      initialGallery.current = []
      return
    }
    const gallery = backgroundsData.backgrounds.data

    setGallery(gallery)
    initialGallery.current = gallery

    const activeBg = gallery.find((bg) => bg.active)

    if (!activeBg) {
      setBackground(null)
      setSelectedBgDraft(null)
      return
    }

    // To avoid retrieving a new image_url
    if (background?.id === activeBg?.id) return
    setBackground(activeBg)
    setSelectedBgDraft(activeBg)
    initialBackground.current = activeBg
  }, [backgroundsData])

  return {
    applyingWidgets,
    backgroundsData,
    isLoadingBackgrounds,
    isLoadingSetting,
    isLoadingWidgets,
    settingData,
    widgetsData,
  }
}
