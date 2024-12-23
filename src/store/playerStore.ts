import { create } from 'zustand';

interface PlayerStore {
  currentSong: any | null;
  nextSong: () => void;
  previousSong: () => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  currentSong: null,
  nextSong: () => {
    // Implementation for next song
    console.log('Next song requested');
  },
  previousSong: () => {
    // Implementation for previous song
    console.log('Previous song requested');
  },
}));