import { create } from 'zustand';

interface Song {
  _id: string;
  name: string;
  artist: string;
  filePath?: string;
  artwork?: string | null;
}

interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  currentSong: Song | null;
  queue: Song[];
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  nextSong: () => void;
  previousSong: () => void;
  setCurrentSong: (song: Song) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 100,
  currentSong: null,
  queue: [],
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  nextSong: () => {
    const { queue, currentSong } = get();
    if (!currentSong || queue.length === 0) return;
    
    const currentIndex = queue.findIndex(song => song._id === currentSong._id);
    const nextIndex = (currentIndex + 1) % queue.length;
    set({ currentSong: queue[nextIndex] });
  },
  previousSong: () => {
    const { queue, currentSong } = get();
    if (!currentSong || queue.length === 0) return;
    
    const currentIndex = queue.findIndex(song => song._id === currentSong._id);
    const previousIndex = (currentIndex - 1 + queue.length) % queue.length;
    set({ currentSong: queue[previousIndex] });
  },
  setCurrentSong: (song) => set({ currentSong: song })
}));