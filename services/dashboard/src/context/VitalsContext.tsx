import {
  Background,
  Setting,
  SettingMode,
  UpdateWidgetInput,
  WeekendDisplay,
  Widget,
  WidgetOrderInput,
} from '@zunou-graphql/core/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme as appTheme } from '@zunou-react/services/Theme'
import { createContext, ReactNode, useContext, useRef, useState } from 'react'

export const DEFAULT_SETTING: Setting = {
  color: appTheme.palette.primary.main,
  id: 'DEFAULT',
  metadata: {},
  mode: 'COLOR' as SettingMode,
  organizationId: 'DEFAULT',
  theme: 'light',
  userId: 'DEFAULT',
  weekendDisplay: WeekendDisplay.Default,
}

export type Theme = 'light' | 'dark'
export type Status = 'CREATE' | 'DELETE'

interface WidgetUpdate {
  widgetName: string
  widgetId: string
  status: Status
}

export interface GalleryUpdate extends Background {
  tempFile?: File
  tempUrl?: string
  status: Status
}
interface VitalsContextType {
  initialWidgets: React.MutableRefObject<Widget[]>
  isWidgetsDraftMode: boolean
  setWidgetsDraftMode: (mode: boolean) => void
  setWidgetUpdates: (widgetUpdates: WidgetUpdate[]) => void
  setWidgets: (widgets: Widget[]) => void
  setWidgetsOrderUpdates: (widgetOrderInput: WidgetOrderInput[]) => void
  setWidgetsColUpdates: (updateWidgetInput: UpdateWidgetInput[]) => void
  initialSetting: React.MutableRefObject<Setting>
  updateWidget: (
    widgetName: string,
    status: Status,
    organizationId: string,
    widgetId?: string,
  ) => void
  updateWidgetColumn: (widgetId: string, name: string, columns: string) => void
  initialBackground: React.MutableRefObject<Background | null>
  widgets: Widget[]
  background: Background | null
  widgetUpdates: WidgetUpdate[]
  resetWidgetDraft: () => void
  widgetsOrderUpdates: WidgetOrderInput[]
  setBackground: (background: Background | null) => void
  widgetsColUpdates: UpdateWidgetInput[]
  setSetting: (setting: Setting) => void
  setting: Setting
  setSelectedBgDraft: (background: Background | null) => void
  selectedBgDraft: Background | null
  setGallery: (gallery: Background[]) => void
  gallery: Background[]
  galleryUpdates: GalleryUpdate[]
  setGalleryUpdates: (galleryUpdates: GalleryUpdate[]) => void
  initialGallery: React.MutableRefObject<Background[]>
  setSettingDraftMode: (settingEditMode: boolean) => void
  isSettingDraftMode: boolean
  setShowLoader: (showLoader: boolean) => void
  showLoader: boolean
}

interface VitalsProviderProps {
  children: ReactNode
}

const VitalsContext = createContext<VitalsContextType | undefined>(undefined)

export const useVitalsContext = (): VitalsContextType => {
  const context = useContext(VitalsContext)
  if (!context) {
    throw new Error('useVitalsContext must be used within a VitalsProvider')
  }
  return context
}

export const VitalsProvider = ({ children }: VitalsProviderProps) => {
  // const { organizationId } = useOrganization()
  const { user } = useAuthContext()

  // Initial Refs
  const initialWidgets = useRef<Widget[]>([])
  const initialSetting = useRef<Setting>(DEFAULT_SETTING)
  const initialBackground = useRef<null>(null)
  const initialGallery = useRef<Background[]>([])

  // Vital States
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [setting, setSetting] = useState<Setting>(DEFAULT_SETTING)
  const [background, setBackground] = useState<Background | null>(null) // Active
  const [gallery, setGallery] = useState<Background[]>([])
  const [selectedBgDraft, setSelectedBgDraft] = useState<Background | null>(
    null,
  )
  const [isWidgetsDraftMode, setWidgetsDraftMode] = useState(false)
  const [isSettingDraftMode, setSettingDraftMode] = useState(false)
  const [showLoader, setShowLoader] = useState(false)

  // For tracking updates during edit mode(draft)
  const [widgetUpdates, setWidgetUpdates] = useState<WidgetUpdate[]>([])
  const [widgetsOrderUpdates, setWidgetsOrderUpdates] = useState<
    WidgetOrderInput[]
  >([])
  const [widgetsColUpdates, setWidgetsColUpdates] = useState<
    UpdateWidgetInput[]
  >([])
  const [galleryUpdates, setGalleryUpdates] = useState<GalleryUpdate[]>([])

  // Actions
  const updateWidget = (
    widgetName: string,
    status: 'CREATE' | 'DELETE',
    organizationId: string,
    widgetId?: string,
  ) => {
    if (!organizationId || !user?.id) return

    const TEMP_ID = 'TEMP_ID_' + widgetName

    const widgetsUi = [...widgets]

    // Check if widgetName already exists in widgetUpdates
    const isInWidgetUpdates = widgetUpdates.some(
      (widget) => widget.widgetName === widgetName,
    )

    const updatedWidgetUpdates = isInWidgetUpdates
      ? widgetUpdates
          .map((widget) => {
            if (widget.widgetName !== widgetName) return widget

            return null
          })
          .filter(
            (widget): widget is NonNullable<typeof widget> => widget !== null,
          )
      : [
          ...widgetUpdates,
          {
            status,
            widgetId: status === 'CREATE' ? TEMP_ID : widgetId || TEMP_ID,
            widgetName,
          },
        ]

    setWidgetUpdates(updatedWidgetUpdates)

    const isAlreadyInWidgetsUI = widgetsUi.some(
      (widget) => widget.name === widgetName,
    )

    // Add back the old removed widget
    if (status === 'CREATE' && isInWidgetUpdates) {
      const old = initialWidgets.current.find(
        (widget) => widget.name === widgetName,
      )
      if (old) widgetsUi.push(old)
      setWidgets(widgetsUi)
    }
    // New temp instance of widget
    else if (status === 'CREATE' && !isAlreadyInWidgetsUI) {
      const newWidget = {
        columns: '1',
        id: TEMP_ID,
        name: widgetName,
        order: String(widgetsUi.length),
        organizationId,
        userId: user.id,
      }
      widgetsUi.push(newWidget)
      setWidgets(widgetsUi)
    }
    // Remove it from ui
    else if (status === 'DELETE' && isAlreadyInWidgetsUI) {
      const filteredWidgetsUi = widgetsUi.filter(
        (widget) => widget.name !== widgetName,
      )
      setWidgets(filteredWidgetsUi)
    }
  }

  const updateWidgetColumn = (
    widgetId: string,
    name: string,
    columns: string,
  ) => {
    const isAlreadyInWidgetColUpdates = widgetsColUpdates.find(
      (widget) => widget.widgetId === widgetId,
    )

    setWidgetsColUpdates(
      isAlreadyInWidgetColUpdates
        ? widgetsColUpdates
            .filter((widget) => (widget.widgetId !== widgetId ? widget : null))
            .filter(Boolean)
        : [...widgetsColUpdates, { columns, name, widgetId }],
    )

    const updatedWidgets = widgets.map((widget) =>
      widget.id === widgetId ? { ...widget, columns } : widget,
    )

    setWidgets(updatedWidgets)
  }
  const resetWidgetDraft = () => {
    setWidgetUpdates([])
    setWidgetsColUpdates([])
    setWidgetsOrderUpdates([])
  }

  return (
    <VitalsContext.Provider
      value={{
        background,
        gallery,
        galleryUpdates,
        initialBackground,
        initialGallery,
        initialSetting,
        initialWidgets,
        isSettingDraftMode,
        isWidgetsDraftMode,
        resetWidgetDraft,
        selectedBgDraft,
        setBackground,
        setGallery,
        setGalleryUpdates,
        setSelectedBgDraft,
        setSetting,
        setSettingDraftMode,
        setShowLoader,
        setWidgetUpdates,
        setWidgets,
        setWidgetsColUpdates,
        setWidgetsDraftMode,
        setWidgetsOrderUpdates,
        setting,
        showLoader,
        updateWidget,
        updateWidgetColumn,
        widgetUpdates,
        widgets,
        widgetsColUpdates,
        widgetsOrderUpdates,
      }}
    >
      {children}
    </VitalsContext.Provider>
  )
}
