import { useState, useEffect } from 'react';
import { tokenService } from '../services/tokenService';

export const useToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeToken = async () => {
      try {
        let currentToken = tokenService.getToken();
        
        if (!currentToken) {
          currentToken = await tokenService.generateToken();
        } else {
          const isValid = await tokenService.validateToken(currentToken);
          if (!isValid) {
            currentToken = await tokenService.refreshToken();
          }
        }
        
        setToken(currentToken);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Token initialization failed'));
      } finally {
        setIsLoading(false);
      }
    };

    initializeToken();
  }, []);

  const refreshToken = async () => {
    try {
      setIsLoading(true);
      const newToken = await tokenService.refreshToken();
      setToken(newToken);
      return newToken;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Token refresh failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    token,
    isLoading,
    error,
    refreshToken
  };
};