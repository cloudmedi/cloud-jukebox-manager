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
      console.log('TokenInitializer: Token received:', token);
    }
  }, [token]);

  console.log('TokenInitializer render state:', { token, isLoading, error });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-white">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
          <p className="text-purple-600">Token oluşturuluyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-6">
        <Alert variant="destructive">
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>
            Token oluşturulurken bir hata oluştu: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-6">
        <Alert variant="warning">
          <AlertTitle>Token Bulunamadı</AlertTitle>
          <AlertDescription>
            Cihaz tokeni bulunamadı. Lütfen sayfayı yenileyin veya destek ekibi ile iletişime geçin.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-6">
      <TokenDisplay token={token} />
      {children}
    </div>
  );
};