export const WS_CONFIG = {
  URL: 'ws://localhost:5000/device',
  MAX_RECONNECT_ATTEMPTS: 5
};

export type MessageHandler = (data: any) => void;