import { create } from 'zustand'

// Transient UI state shared across screens (not persisted).
type UiState = {
  /** The tab bar's "+" opens the new-chore sheet from any tab */
  addChoreOpen: boolean
  setAddChoreOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>()((set) => ({
  addChoreOpen: false,
  setAddChoreOpen: (addChoreOpen) => set({ addChoreOpen }),
}))
