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
          console.log('No token found, generating new token...');
          currentToken = await tokenService.generateToken();
        } else {
          console.log('Validating existing token...');
          const isValid = await tokenService.validateToken(currentToken);
          if (!isValid) {
            console.log('Token invalid, refreshing...');
            currentToken = await tokenService.refreshToken();
          }
        }
        
        setToken(currentToken);
      } catch (err) {
        console.error('Token initialization error:', err);
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