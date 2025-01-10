import { create } from 'zustand';

interface Song {
  id: string;
  name: string;
  artist: string;
  artwork?: string;
  filePath?: string;
  duration?: number;
}

interface Playlist {
  id: string;
  name: string;
  artwork?: string;
  songs: Song[];
}

interface PlayerState {
  currentSong: Song | null;
  currentPlaylist: Playlist | null;
  queue: Song[];
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  setCurrentSong: (song: Song | null) => void;
  setCurrentPlaylist: (playlist: Playlist | null) => void;
  setQueue: (queue: Song[]) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  playPlaylist: (playlist: Playlist, startFromSong?: Song) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentSong: null,
  currentPlaylist: null,
  queue: [],
  isPlaying: false,
  volume: 70,
  currentTime: 0,
  duration: 0,
  setCurrentSong: (song) => set({ currentSong: song }),
  setCurrentPlaylist: (playlist) => set({ currentPlaylist: playlist }),
  setQueue: (queue) => set({ queue }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  addToQueue: (song) => set((state) => ({ queue: [...state.queue, song] })),
  removeFromQueue: (index) => set((state) => ({
    queue: state.queue.filter((_, i) => i !== index)
  })),
  clearQueue: () => set({ queue: [] }),
  playPlaylist: (playlist, startFromSong) => {
    const songIndex = startFromSong 
      ? playlist.songs.findIndex(s => s.id === startFromSong.id)
      : 0;
    
    if (songIndex === -1) return;

    const currentSong = playlist.songs[songIndex];
    const queue = playlist.songs.slice(songIndex + 1);

    set({
      currentSong,
      currentPlaylist: playlist,
      queue
    });
  }
}));