import { useState, useEffect } from 'react';
import { tokenService } from '../services/tokenService';

export const useToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeToken = async () => {
      try {
        console.log('Starting token initialization...');
        let currentToken = tokenService.getToken();
        
        if (!currentToken) {
          console.log('No token found, generating new token...');
          currentToken = await tokenService.generateToken();
          console.log('New token generated:', currentToken);
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

  return { token, isLoading, error };
};