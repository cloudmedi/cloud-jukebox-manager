import { create } from 'zustand';

interface ViewPreferencesState {
  isGridView: boolean;
  toggleView: () => void;
}

export const useViewPreferencesStore = create<ViewPreferencesState>((set) => ({
  isGridView: true,
  toggleView: () => set((state) => ({ isGridView: !state.isGridView })),
}));