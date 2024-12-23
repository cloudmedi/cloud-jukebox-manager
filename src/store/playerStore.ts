import { create } from 'zustand';

interface PlayerState {
  isPlaying: boolean;
  currentSong: any | null;
  volume: number;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentSong: (song: any | null) => void;
  setVolume: (volume: number) => void;
  nextSong: () => void;
  previousSong: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  currentSong: null,
  volume: 0.7,
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentSong: (song) => set({ currentSong: song }),
  setVolume: (volume) => set({ volume }),
  nextSong: () => {
    // Implement next song logic if needed
    console.log('Next song requested');
  },
  previousSong: () => {
    // Implement previous song logic if needed
    console.log('Previous song requested');
  }
}));