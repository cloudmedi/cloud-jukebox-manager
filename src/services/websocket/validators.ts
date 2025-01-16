import { WebSocketMessage } from './types';
import { z } from 'zod';

// Temel mesaj şeması
const baseMessageSchema = z.object({
  type: z.string(),
  timestamp: z.number().optional(),
  deviceToken: z.string().optional(),
});

// Download progress mesaj şeması
const downloadProgressSchema = baseMessageSchema.extend({
  type: z.literal('deviceDownloadProgress'),
  deviceToken: z.string(),
  status: z.enum(['downloading', 'completed', 'error']),
  playlistId: z.string(),
  totalSongs: z.number(),
  completedSongs: z.number(),
  songProgress: z.object({
    current: z.number(),
    total: z.number(),
    name: z.string()
  }),
  progress: z.number()
});

// Connection status mesaj şeması
const connectionStatusSchema = baseMessageSchema.extend({
  type: z.literal('connectionStatus'),
  status: z.enum(['connected', 'disconnected', 'error']),
  error: z.string().optional()
});

// Mesaj validasyonu
export const validateMessage = (message: any): message is WebSocketMessage => {
  try {
    // Mesaj tipine göre doğru şemayı seç
    let schema;
    switch (message.type) {
      case 'deviceDownloadProgress':
        schema = downloadProgressSchema;
        break;
      case 'connectionStatus':
        schema = connectionStatusSchema;
        break;
      default:
        schema = baseMessageSchema;
    }

    // Şema validasyonu
    schema.parse(message);

    // Timestamp kontrolü
    if (message.timestamp) {
      const messageAge = Date.now() - message.timestamp;
      if (messageAge > 30000) { // 30 saniye
        console.warn('Message is too old:', messageAge, 'ms');
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Message validation failed:', error);
    return false;
  }
};
