import { create } from 'zustand';

export type AppView = 'canvas' | 'monitor' | 'strategies' | 'vaults' | 'portfolio' | 'settings' | 'docs';

interface UiState {
  currentView: AppView;
  showNewIntentModal: boolean;
  setView: (view: AppView) => void;
  setShowNewIntentModal: (show: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  currentView: 'canvas',
  showNewIntentModal: false,
  setView: (currentView) => set({ currentView }),
  setShowNewIntentModal: (showNewIntentModal) => set({ showNewIntentModal }),
}));
