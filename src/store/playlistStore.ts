import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Playlist {
  _id: string;
  name: string;
  description?: string;
  songs: any[];
  totalDuration?: number;
}

interface PlaylistState {
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  isLoading: boolean;
  error: Error | null;
  setPlaylists: (playlists: Playlist[]) => void;
  setCurrentPlaylist: (playlist: Playlist | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  addPlaylist: (playlist: Playlist) => void;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  deletePlaylist: (id: string) => void;
}

export const usePlaylistStore = create<PlaylistState>()(
  devtools((set) => ({
    playlists: [],
    currentPlaylist: null,
    isLoading: false,
    error: null,
    setPlaylists: (playlists) => set({ playlists }),
    setCurrentPlaylist: (playlist) => set({ currentPlaylist: playlist }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    addPlaylist: (playlist) =>
      set((state) => ({ playlists: [...state.playlists, playlist] })),
    updatePlaylist: (id, updates) =>
      set((state) => ({
        playlists: state.playlists.map((playlist) =>
          playlist._id === id ? { ...playlist, ...updates } : playlist
        ),
      })),
    deletePlaylist: (id) =>
      set((state) => ({
        playlists: state.playlists.filter((playlist) => playlist._id !== id),
      })),
  }))
);