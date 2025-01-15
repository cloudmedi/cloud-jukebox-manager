import { create } from 'zustand'

interface DownloadProgress {
  deviceToken: string;
  status: 'downloading' | 'completed' | 'error';
  playlistId: string;
  totalSongs: number;
  completedSongs: number;
  songProgress: {
    current: number;
    total: number;
    name: string;
  };
  progress: number;
}

interface DownloadProgressStore {
  progressMap: Record<string, DownloadProgress>;
  updateProgress: (data: DownloadProgress) => void;
  getProgress: (deviceToken: string) => DownloadProgress | null;
}

export const useDownloadProgressStore = create<DownloadProgressStore>((set, get) => ({
  progressMap: {},
  
  updateProgress: (data) => {
    set((state) => ({
      progressMap: {
        ...state.progressMap,
        [data.deviceToken]: data
      }
    }));
  },
  
  getProgress: (deviceToken) => {
    return get().progressMap[deviceToken] || null;
  }
}))
