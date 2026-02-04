import { create } from 'zustand'

import { SettingsTabIdentifier } from '~/components/domain/settings/SettingsModal'

interface UserSettings {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void

  currentTab: SettingsTabIdentifier
  setCurrentTab: (currentTab: SettingsTabIdentifier) => void
}

export const useUserSettingsStore = create<UserSettings>((set) => ({
  currentTab: SettingsTabIdentifier.GENERAL,
  isOpen: false,

  setCurrentTab: (currentTab: SettingsTabIdentifier) => set({ currentTab }),
  setIsOpen: (isOpen: boolean) => set({ isOpen }),
}))
