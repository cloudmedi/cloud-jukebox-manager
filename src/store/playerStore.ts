import { create } from 'zustand';

interface PlayerState {
  isPlaying: boolean;
  currentSong: any | null;
  volume: number;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentSong: (song: any | null) => void;
  setVolume: (volume: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  isPlaying: false,
  currentSong: null,
  volume: 0.7,
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentSong: (song) => set({ currentSong: song }),
  setVolume: (volume) => set({ volume })
}));