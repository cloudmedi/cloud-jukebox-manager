import { create } from 'zustand';

interface Song {
  _id: string;
  name: string;
  artist: string;
  filePath: string;
  artwork?: string;
}

interface PlayerState {
  isPlaying: boolean;
  currentSong: Song | null;
  queue: Song[];
  volume: number;
  currentTime: number;
  duration: number;
  showPlayer: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentSong: (song: Song) => void;
  setQueue: (songs: Song[]) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: string) => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setShowPlayer: (show: boolean) => void;
  nextSong: () => void;
  previousSong: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  currentSong: null,
  queue: [],
  volume: 1,
  currentTime: 0,
  duration: 0,
  showPlayer: false,
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentSong: (song) => set({ currentSong: song, showPlayer: true }),
  setQueue: (songs) => set({ queue: songs }),
  addToQueue: (song) => set((state) => ({ queue: [...state.queue, song] })),
  removeFromQueue: (songId) => 
    set((state) => ({ queue: state.queue.filter(song => song._id !== songId) })),
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setShowPlayer: (show) => set({ showPlayer: show }),
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
  }
}));