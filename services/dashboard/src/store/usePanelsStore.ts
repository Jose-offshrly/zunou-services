import { create } from 'zustand'

interface Panels {
  content: boolean
  feed: boolean
  meetings: boolean
  notifications: boolean
  savedMessages: boolean
  sources: boolean
  strategies: boolean
}

interface PanelsState {
  panels: Panels
  setPanels: (panels: Panels | ((prev: Panels) => Panels)) => void
  togglePanel: (panelName: keyof Panels) => void
}

export const usePanelsStore = create<PanelsState>((set, get) => ({
  panels: {
    content: false,
    feed: false,
    meetings: false,
    notifications: false,
    savedMessages: false,
    sources: false,
    strategies: false,
  },
  setPanels: (panels) => {
    if (typeof panels === 'function') {
      set({ panels: panels(get().panels) })
    } else {
      set({ panels })
    }
  },
  togglePanel: (panelName) => {
    set((state) => ({
      panels: {
        ...state.panels,
        [panelName]: !state.panels[panelName],
      },
    }))
  },
}))
