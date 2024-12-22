import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { collectDeviceInfo, registerDevice } from '@/services/deviceRegistration';
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

  const handleRegister = async () => {
    try {
      setIsRegistering(true);
      const deviceInfo = collectDeviceInfo();
      const result = await registerDevice(deviceInfo);
      
      setToken(result.token);
      localStorage.setItem('deviceToken', result.token);
      
      const ws = new WebSocketService(result.token);
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