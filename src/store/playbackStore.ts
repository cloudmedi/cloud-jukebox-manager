import { create } from 'zustand';
import { Song } from '@/types/song';

interface PlaybackStore {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  queue: Song[];
  currentIndex: number;
  setQueue: (songs: Song[]) => void;
  togglePlayPause: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  playPreviousSong: () => void;
  playNextSong: () => void;
  setCurrentSong: (song: Song) => void;
  addToQueue: (song: Song) => void;
}

export const usePlaybackStore = create<PlaybackStore>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  volume: 1,
  currentTime: 0,
  duration: 0,
  queue: [],
  currentIndex: 0,

  setQueue: (songs) => {
    set({ queue: songs, currentIndex: 0 });
    if (songs.length > 0) {
      set({ currentSong: songs[0] });
    }
  },

  togglePlayPause: () => {
    set(state => ({ isPlaying: !state.isPlaying }));
  },

  setVolume: (volume) => {
    set({ volume });
  },

  setCurrentTime: (currentTime) => {
    set({ currentTime });
  },

  playPreviousSong: () => {
    const { queue, currentIndex } = get();
    if (queue.length === 0) return;

    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    const prevSong = queue[prevIndex];

    set({ 
      currentIndex: prevIndex,
      currentSong: prevSong,
      isPlaying: true 
    });
  },

  playNextSong: () => {
    const { queue, currentIndex } = get();
    if (queue.length === 0) return;

    const nextIndex = (currentIndex + 1) % queue.length;
    const nextSong = queue[nextIndex];

    set({ 
      currentIndex: nextIndex,
      currentSong: nextSong,
      isPlaying: true 
    });
  },

  setCurrentSong: (song) => {
    const { queue } = get();
    const songIndex = queue.findIndex(s => s._id === song._id);
    
    if (songIndex === -1) {
      set(state => ({ 
        queue: [...state.queue, song],
        currentSong: song,
        currentIndex: state.queue.length,
        isPlaying: true
      }));
    } else {
      set({ 
        currentSong: song,
        currentIndex: songIndex,
        isPlaying: true
      });
    }
  },

  addToQueue: (song) => {
    set(state => ({
      queue: [...state.queue, song]
    }));
  }
}));