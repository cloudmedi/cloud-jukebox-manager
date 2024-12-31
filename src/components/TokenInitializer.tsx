import { useEffect } from 'react';
import { useToken } from '../hooks/useToken';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Loader2 } from 'lucide-react';
import { TokenDisplay } from './token/TokenDisplay';

interface TokenInitializerProps {
  children: React.ReactNode;
}

export const TokenInitializer = ({ children }: TokenInitializerProps) => {
  const { token, isLoading, error } = useToken();

  useEffect(() => {
    if (token) {
      console.log('Token initialized:', token);
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="p-4">
        <Alert variant="warning">
          <AlertTitle>Token Bulunamadı</AlertTitle>
          <AlertDescription>
            Cihaz tokeni bulunamadı. Lütfen sayfayı yenileyin.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <TokenDisplay token={token} />
      {children}
    </div>
  );
};