import { create } from 'zustand';
import { Song } from '@/types/song';

interface SelectedSongsState {
  selectedSongs: Song[];
  addSong: (song: Song) => void;
  removeSong: (songId: string) => void;
  clearSelection: () => void;
  isSelected: (songId: string) => boolean;
}

export const useSelectedSongsStore = create<SelectedSongsState>((set, get) => ({
  selectedSongs: [],
  addSong: (song) => set((state) => ({
    selectedSongs: [...state.selectedSongs, song]
  })),
  removeSong: (songId) => set((state) => ({
    selectedSongs: state.selectedSongs.filter((song) => song._id !== songId)
  })),
  clearSelection: () => set({ selectedSongs: [] }),
  isSelected: (songId) => get().selectedSongs.some((song) => song._id === songId),
}));