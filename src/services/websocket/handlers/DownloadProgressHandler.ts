import { WebSocketMessage } from '../types';
import { useDownloadProgressStore } from '@/store/downloadProgressStore';

export const handleDownloadProgress = (message: WebSocketMessage) => {
  const { updateProgress } = useDownloadProgressStore.getState();
  
  updateProgress({
    deviceToken: message.deviceToken,
    status: message.status,
    playlistId: message.playlistId,
    totalSongs: message.totalSongs,
    completedSongs: message.completedSongs,
    songProgress: message.songProgress,
    progress: message.progress
  });
};
