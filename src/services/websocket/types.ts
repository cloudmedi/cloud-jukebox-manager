export interface WebSocketMessage {
  type: string;
  deviceToken?: string;
  status?: 'connected' | 'disconnected' | 'reconnecting' | 'downloading' | 'completed' | 'error';
  playlistId?: string;
  totalSongs?: number;
  completedSongs?: number;
  songProgress?: {
    current: number;
    total: number;
    name: string;
  };
  progress?: number;
  error?: string;
}

export interface WebSocketHandler {
  handleMessage: (message: WebSocketMessage) => void;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'error';

export interface WebSocketConfig {
  url: string;
  reconnectAttempts: number;
  reconnectInterval: number;
  maxReconnectDelay: number;
}
