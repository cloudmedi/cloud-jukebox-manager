import { useEffect } from 'react';
import { useToken } from '../hooks/useToken';
import { websocketService } from '../services/websocketService';

export const TokenInitializer = () => {
  const { token, isLoading } = useToken();

  useEffect(() => {
    if (token && !isLoading) {
      console.log('Setting up WebSocket with token:', token);
      websocketService.setToken(token);
    }
  }, [token, isLoading]);

  return null;
};