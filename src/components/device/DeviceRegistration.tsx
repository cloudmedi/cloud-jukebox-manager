import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { collectDeviceInfo } from '@/services/deviceRegistration';
import WebSocketService from '@/services/websocketService';
import { useToast } from "@/hooks/use-toast";

export const DeviceRegistration = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [wsService, setWsService] = useState<WebSocketService | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedToken = localStorage.getItem('deviceToken');
    if (savedToken) {
      setToken(savedToken);
      const ws = new WebSocketService(savedToken);
      setWsService(ws);
    }
  }, []);

  const registerToken = async (deviceInfo: any) => {
    try {
      const response = await fetch('http://localhost:5000/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: Math.floor(100000 + Math.random() * 900000).toString(),
          deviceInfo
        }),
      });

      if (!response.ok) {
        throw new Error('Token kaydı başarısız oldu');
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Token kayıt hatası:', error);
      throw error;
    }
  };

  const registerDevice = async (token: string, deviceInfo: any) => {
    try {
      const response = await fetch('http://localhost:5000/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: deviceInfo.hostname,
          token: token,
          location: 'Bilinmiyor',
          volume: 50
        }),
      });

      if (!response.ok) {
        throw new Error('Cihaz kaydı başarısız oldu');
      }

      return await response.json();
    } catch (error) {
      console.error('Cihaz kayıt hatası:', error);
      throw error;
    }
  };

  const handleRegister = async () => {
    try {
      setIsRegistering(true);
      const deviceInfo = collectDeviceInfo();
      
      // Önce token'ı kaydet
      const newToken = await registerToken(deviceInfo);
      
      // Sonra cihazı kaydet
      await registerDevice(newToken, deviceInfo);
      
      // Başarılı kayıt sonrası
      setToken(newToken);
      localStorage.setItem('deviceToken', newToken);
      
      const ws = new WebSocketService(newToken);
      setWsService(ws);

      toast({
        title: "Başarılı",
        description: "Cihaz başarıyla kaydedildi",
      });
    } catch (error) {
      console.error('Kayıt hatası:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Cihaz kaydı sırasında bir hata oluştu",
      });
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
              WebSocket Bağlantısı: {wsService?.isConnected() ? 'Aktif' : 'Bağlantı Kesik'}
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