import { create } from 'zustand';
import websocketService from '@/services/websocketService';

interface Song {
  _id: string;
  name: string;
  artist: string;
  filePath: string;
  localPath?: string;
  duration: number;
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
}

export const usePlaybackStore = create<PlaybackStore>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  queue: [],
  currentIndex: 0,

  setQueue: (songs) => {
    set({ queue: songs });
    if (songs.length > 0) {
      set({ currentSong: songs[0] });
    }
  },

  play: () => {
    websocketService.sendMessage({
      type: 'command',
      command: 'play'
    });
    set({ isPlaying: true });
  },

  pause: () => {
    websocketService.sendMessage({
      type: 'command',
      command: 'pause'
    });
    set({ isPlaying: false });
  },

  next: () => {
    websocketService.sendMessage({
      type: 'command',
      command: 'next'
    });
  },

  previous: () => {
    websocketService.sendMessage({
      type: 'command',
      command: 'previous'
    });
  },

  setCurrentSong: (song) => {
    set({ currentSong: song });
  }
}));