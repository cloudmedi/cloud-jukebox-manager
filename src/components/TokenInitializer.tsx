import { useEffect } from 'react';
import { useToken } from '@/hooks/useToken';
import { TokenDisplay } from './token/TokenDisplay';
import { websocketService } from '@/services/websocketService';

export const TokenInitializer = () => {
  const { token, isLoading, error } = useToken();

  useEffect(() => {
    // This will trigger the WebSocket connection when token is available
    if (token) {
      websocketService.setToken(token);
    }
  }, [token]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return token ? <TokenDisplay token={token} /> : null;
};