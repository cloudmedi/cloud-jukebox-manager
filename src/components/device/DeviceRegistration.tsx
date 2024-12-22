import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { collectDeviceInfo, registerDevice } from '@/services/deviceRegistration';
import WebSocketService from '@/services/websocketService';

export const DeviceRegistration = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [wsService, setWsService] = useState<WebSocketService | null>(null);

  useEffect(() => {
    // LocalStorage'dan token'ı kontrol et
    const savedToken = localStorage.getItem('deviceToken');
    if (savedToken) {
      setToken(savedToken);
      const ws = new WebSocketService(savedToken);
      setWsService(ws);
    }
  }, []);

  const handleRegister = async () => {
    try {
      setIsRegistering(true);
      const deviceInfo = collectDeviceInfo();
      const newToken = await registerDevice(deviceInfo);
      
      setToken(newToken);
      localStorage.setItem('deviceToken', newToken);
      
      const ws = new WebSocketService(newToken);
      setWsService(ws);
    } catch (error) {
      console.error('Cihaz kayıt hatası:', error);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Card className="w-[400px] mx-auto mt-8">
      <CardHeader>
        <CardTitle>Cihaz Kaydı</CardTitle>
      </CardHeader>
      <CardContent>
        {token ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cihaz Token: <span className="font-mono">{token}</span>
            </p>
            <p className="text-sm text-green-500">
              WebSocket Bağlantısı: {wsService ? 'Aktif' : 'Bağlantı Kesik'}
            </p>
          </div>
        ) : (
          <Button 
            onClick={handleRegister} 
            disabled={isRegistering}
            className="w-full"
          >
            {isRegistering ? 'Kaydediliyor...' : 'Cihazı Kaydet'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};