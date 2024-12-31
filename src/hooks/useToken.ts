import { useState, useEffect } from 'react';

interface UseTokenReturn {
  token: string | null;
  isLoading: boolean;
  error: Error | null;
}

export const useToken = (): UseTokenReturn => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initToken = async () => {
      try {
        // For now, just simulate token fetch
        const response = await fetch('http://localhost:5000/api/token');
        if (!response.ok) {
          throw new Error('Failed to fetch token');
        }
        const data = await response.json();
        setToken(data.token);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize token'));
      } finally {
        setIsLoading(false);
      }
    };

    initToken();
  }, []);

  return { token, isLoading, error };
};