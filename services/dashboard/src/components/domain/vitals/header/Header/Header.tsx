import { Close, SettingsOutlined } from '@mui/icons-material'
import { IconButton, Stack } from '@mui/material'
import { useCreateWidgetMutation } from '@zunou-queries/core/hooks/useCreateWidgetMutation'
import { useDeleteWidgetMutation } from '@zunou-queries/core/hooks/useDeleteWidgetMutation'
import { useUpdateWidgetMutation } from '@zunou-queries/core/hooks/useUpdateWidgetMutation'
import { useUpdateWidgetsOrderMutation } from '@zunou-queries/core/hooks/useUpdateWidgetsOrderMutation'
import { Button } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import _ from 'lodash'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { UserMenu } from '~/components/domain/vitals/header'
import { OrganizationToggler } from '~/components/domain/vitals/header/OrganizationToggler/OrganizationToggler'
import { useVitalsContext } from '~/context/VitalsContext'
import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

interface HeaderProps {
  onEditWidgets: () => void
  isGuest?: boolean
}

export const Header = ({ onEditWidgets, isGuest }: HeaderProps) => {
  const { t } = useTranslation('vitals')
  const { organizationId } = useOrganization()
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const {
    isWidgetsDraftMode,
    setting,
    setWidgetsDraftMode,
    widgetUpdates,
    widgetsOrderUpdates,
    widgetsColUpdates,
    widgets,
    setWidgets,
    initialWidgets,
    resetWidgetDraft,
  } = useVitalsContext()

  const isDarkMode = setting.theme === 'dark'

  const [isSaving, setIsSaving] = useState(false)

  // Create Widgets Mutation
  const { mutateAsync: createWidget } = useCreateWidgetMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  // Delete Widget Mutation
  const { mutateAsync: deleteWidget } = useDeleteWidgetMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  // Update Widgets Order Mutation
  const { mutateAsync: updateWidgetsOrder } = useUpdateWidgetsOrderMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  // Update Widget Mutation
  const { mutateAsync: updateWidget } = useUpdateWidgetMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handleReset = () => {
    setWidgets(initialWidgets.current)
    resetWidgetDraft()
    setWidgetsDraftMode(false)
  }

  const handleSave = async () => {
    const createdWidgets: {
      tempId: string
      id: string | null
      widgetName: string
    }[] = []

    try {
      if (!user?.id || !organizationId) return

      setIsSaving(true)

      const toCreate = widgetUpdates.filter(
        (widget) => widget.status === 'CREATE',
      )
      const toDelete = widgetUpdates.filter(
        (widget) => widget.status === 'DELETE',
      )

      // Creating Widget
      const createPromises = toCreate.map((widget) => {
        const tempId = widget.widgetId
        createdWidgets.push({
          id: null,
          tempId,
          widgetName: widget.widgetName,
        })

        return createWidget({
          name: widget.widgetName,
          organizationId,
          userId: user.id,
        })
      })
      const createResponses = await Promise.all(createPromises)

      // Mapped newly created widgets to createdWidgets to keep track of which tempId belongs to which widget
      createResponses.forEach((response) => {
        const newWidget = response.createWidget

        // Find the matching created widget using the temporary ID
        const matchingCreatedWidget = createdWidgets.find(
          (created) => created.widgetName === newWidget.name,
        )

        if (matchingCreatedWidget) {
          matchingCreatedWidget.id = newWidget.id
        }
      })

      // Updating Widgets Order
      if (widgetsOrderUpdates.length > 0) {
        const widgetsOrderUpdatesMapped = widgetsOrderUpdates.map((widget) => {
          const isNewlyCreated = createdWidgets.find(
            (createdWidget) => createdWidget.tempId === widget.widgetId,
          )

          // Type-safe handling of widgetId
          return {
            ...widget,
            widgetId: isNewlyCreated?.id ?? widget.widgetId,
          }
        })

        // Type assertion or type guard to ensure widgetId is not null
        const safePayload = widgetsOrderUpdatesMapped.filter(
          (widget): widget is typeof widget & { widgetId: string } =>
            widget.widgetId !== null && widget.widgetId !== undefined,
        )

        await updateWidgetsOrder(safePayload)
      } else {
        const widgetsOrderUpdatesMapped = widgets.map((widget, index) => {
          const isNewlyCreated = createdWidgets.find(
            (createdWidget) => createdWidget.tempId === widget.id,
          )

          // Type-safe handling of widgetId
          return {
            order: String(index + 1),
            widgetId: isNewlyCreated?.id ?? widget.id,
          }
        })

        // Type assertion or type guard to ensure widgetId is not null
        const safePayload = widgetsOrderUpdatesMapped.filter(
          (widget): widget is typeof widget & { widgetId: string } =>
            widget.widgetId !== null && widget.widgetId !== undefined,
        )

        await updateWidgetsOrder(safePayload)
      }

      // Updating Widgets Cols
      if (widgetsColUpdates.length > 0) {
        const widgetsColUpdatesPayload = widgetsColUpdates.map((widget) => {
          const isNewlyCreated = createdWidgets.find(
            (createdWidget) => createdWidget.tempId === widget.widgetId,
          )

          return {
            ...widget,
            widgetId: isNewlyCreated?.id ?? widget.widgetId,
          }
        })

        const widgetsColUpdatesFiltered = widgetsColUpdatesPayload.filter(
          (widget): widget is typeof widget & { widgetId: string } =>
            widget.widgetId !== null && widget.widgetId !== undefined,
        )

        const updatePromises = widgetsColUpdatesFiltered.map((widget) =>
          updateWidget(widget),
        )

        await Promise.all(updatePromises)
      }

      // Deleting Widget
      const deletePromises = toDelete.map((widget) =>
        deleteWidget(widget.widgetId),
      )

      await Promise.all(deletePromises)

      // Mapped the current widgets in ui's temp ids to actual ids.
      // This is necessary because we are not invalidating queries for widgets.
      const removedTempIdsWidgets = widgets.map((widget) => {
        if (widget.id.includes('TEMP')) {
          const newlyCreatedWidget = createdWidgets.find(
            (createdWidget) => createdWidget.widgetName === widget.name,
          )

          if (newlyCreatedWidget)
            return { ...widget, id: newlyCreatedWidget.id! }
        }

        return widget
      })

      setWidgets(removedTempIdsWidgets)

      initialWidgets.current = removedTempIdsWidgets

      setWidgetsDraftMode(false)

      toast.success(t('update_widgets_success'))
    } catch (error) {
      toast.error(t('update_widgets_error'))
      console.error('Widget update error:', error)
    } finally {
      resetWidgetDraft()
      setIsSaving(false)
    }
  }

  const navigateToRecommendedInsights = () =>
    navigate(
      pathFor({
        pathname: Routes.RecommendedInsights,
        query: {
          organizationId,
        },
      }),
    )

  return (
    <Stack alignItems="center" direction="row" justifyContent="space-between">
      <OrganizationToggler
        isDarkMode={isDarkMode}
        organizationId={organizationId}
      />

      <Stack alignItems="center" direction="row" spacing={1}>
        {!isGuest && (
          <>
            <Button
              color="inherit"
              disabled={isSaving}
              onClick={isWidgetsDraftMode ? handleSave : onEditWidgets}
              startIcon={<SettingsOutlined />}
              sx={{
                '&:active': {
                  bgcolor: 'secondary.main',
                  transition: 'background-color 0.2s',
                },
                '&:hover': {
                  bgcolor: isDarkMode
                    ? theme.palette.grey[700]
                    : theme.palette.primary.main, // Explicitly set background
                  color: isDarkMode
                    ? theme.palette.common.white
                    : theme.palette.common.white, // Ensure color change
                },
                bgcolor: isDarkMode ? 'grey.800' : 'white',
                border: '1px solid',
                borderColor: isDarkMode ? 'grey.700' : 'grey.300',
                borderRadius: 99,
                color: isDarkMode ? 'common.white' : 'text.primary',
                py: 0.5,
              }}
              variant="contained"
            >
              {isWidgetsDraftMode
                ? isSaving
                  ? `${t('saving')}...`
                  : t('save_vitals')
                : t('edit_widgets')}
            </Button>
            {isWidgetsDraftMode && !isSaving && (
              <IconButton
                onClick={handleReset}
                size="small"
                sx={(theme) => ({
                  // Ensure smooth transitions
                  '&:hover': {
                    bgcolor: isDarkMode
                      ? theme.palette.grey[700]
                      : theme.palette.primary.main, // Explicitly set background
                    color: isDarkMode
                      ? theme.palette.common.white
                      : theme.palette.common.white, // Ensure color change
                  },

                  bgcolor: isDarkMode
                    ? theme.palette.grey[800]
                    : theme.palette.common.white,

                  border: '1px solid',

                  borderColor: isDarkMode
                    ? theme.palette.grey[700]
                    : theme.palette.grey[300],

                  color: isDarkMode
                    ? theme.palette.common.white
                    : theme.palette.text.primary,

                  height: 28,

                  p: 0.5,

                  transition: 'background-color 0.2s ease, color 0.2s ease',
                  width: 28,
                })}
              >
                <Close sx={{ fontSize: 16 }} />
              </IconButton>
            )}

            <Button
              color="inherit"
              onClick={navigateToRecommendedInsights}
              sx={{
                '&:hover': {
                  bgcolor: isDarkMode
                    ? theme.palette.grey[700]
                    : theme.palette.primary.main,
                  color: isDarkMode
                    ? theme.palette.common.white
                    : theme.palette.common.white,
                },
                bgcolor: isDarkMode ? 'grey.800' : 'white',
                border: '1px solid',
                borderColor: isDarkMode ? 'grey.700' : 'grey.300',
                borderRadius: 99,
                color: isDarkMode ? 'common.white' : 'text.primary',
                py: 0.5,
              }}
              variant="contained"
            >
              See Insights
            </Button>
          </>
        )}
        <UserMenu user={user} />
      </Stack>
    </Stack>
  )
}
