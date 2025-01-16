import { WebSocketMessage } from '../types';
import { useDeviceStore } from '@/store/deviceStore';

export const handleConnectionStatus = (message: WebSocketMessage) => {
  const { updateConnectionStatus } = useDeviceStore.getState();
  
  if (message.deviceToken) {
    updateConnectionStatus(message.deviceToken, message.status);
  }
};
