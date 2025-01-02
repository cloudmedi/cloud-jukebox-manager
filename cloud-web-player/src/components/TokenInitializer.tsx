import { useEffect } from 'react';
import { useToken } from '../hooks/useToken';
import websocketService from '../services/websocketService';
import { TokenDisplay } from './token/TokenDisplay';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export const TokenInitializer = () => {
  const { token, isLoading, error } = useToken();

  useEffect(() => {
    if (token && !isLoading) {
      console.log('Setting up WebSocket with token:', token);
      websocketService.setToken(token);
    }
  }, [token, isLoading]);

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
    </div>
  );
};