import { create } from 'zustand';
import websocketService from '@/services/websocketService';

interface Song {
  _id: string;
  name: string;
  artist: string;
  filePath: string;
  localPath?: string;
  duration: number;
  artwork?: string | null;
}

interface PlaybackStore {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  currentIndex: number;
  setQueue: (songs: Song[]) => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  setCurrentSong: (song: Song) => void;
  addToQueue: (song: Song) => void;
}

export const usePlaybackStore = create<PlaybackStore>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  queue: [],
  currentIndex: 0,

  setQueue: (songs) => {
    set({ queue: songs, currentIndex: 0 });
    if (songs.length > 0) {
      set({ currentSong: songs[0] });
    }
  },

  play: () => {
    set({ isPlaying: true });
    websocketService.sendMessage({
      type: 'command',
      command: 'play'
    });
  },

  pause: () => {
    set({ isPlaying: false });
    websocketService.sendMessage({
      type: 'command',
      command: 'pause'
    });
  },

  next: () => {
    const { queue, currentIndex } = get();
    if (queue.length === 0) return;

    const nextIndex = (currentIndex + 1) % queue.length;
    const nextSong = queue[nextIndex];

    set({ 
      currentIndex: nextIndex,
      currentSong: nextSong,
      isPlaying: true 
    });

    websocketService.sendMessage({
      type: 'command',
      command: 'next'
    });
  },

  previous: () => {
    const { queue, currentIndex } = get();
    if (queue.length === 0) return;

    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    const prevSong = queue[prevIndex];

    set({ 
      currentIndex: prevIndex,
      currentSong: prevSong,
      isPlaying: true 
    });

    websocketService.sendMessage({
      type: 'command',
      command: 'previous'
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