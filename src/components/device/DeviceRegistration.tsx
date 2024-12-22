import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { websocketService } from '@/services/websocketService';

interface DeviceInfo {
  hostname: string;
  platform: string;
  arch: string;
  cpus: string;
  totalMemory: string;
  freeMemory: string;
  networkInterfaces: string[];
  osVersion: string;
}

const DeviceRegistration = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedToken = localStorage.getItem('deviceToken');
    if (savedToken) {
      setToken(savedToken);
      websocketService.connect(savedToken);
    }
  }, []);

  const getDeviceInfo = (): DeviceInfo => {
    const cpuInfo = navigator.hardwareConcurrency 
      ? `${navigator.hardwareConcurrency} cores`
      : 'Unknown';

    return {
      hostname: window.location.hostname,
      platform: navigator.platform,
      arch: navigator.userAgent,
      cpus: cpuInfo,
      totalMemory: `${(performance.memory?.totalJSHeapSize || 0) / (1024 * 1024)} MB`,
      freeMemory: `${(performance.memory?.usedJSHeapSize || 0) / (1024 * 1024)} MB`,
      networkInterfaces: [],
      osVersion: navigator.userAgent,
    };
  };

  const registerDevice = async () => {
    try {
      setIsRegistering(true);
      
      // 1. Token oluştur ve kaydet
      const tokenResponse = await fetch('http://localhost:5000/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: Math.floor(100000 + Math.random() * 900000).toString(),
          deviceInfo: getDeviceInfo(),
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Token oluşturulamadı');
      }

      const tokenData = await tokenResponse.json();
      const newToken = tokenData.token;

      // 2. Cihazı kaydet
      const deviceResponse = await fetch('http://localhost:5000/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Device-${newToken}`,
          token: newToken,
          location: 'Unknown',
          volume: 50,
        }),
      });

      if (!deviceResponse.ok) {
        throw new Error('Cihaz kaydedilemedi');
      }

      // Token'ı localStorage'a kaydet
      localStorage.setItem('deviceToken', newToken);
      setToken(newToken);

      // WebSocket bağlantısını başlat
      websocketService.connect(newToken);

      toast({
        title: "Başarılı!",
        description: "Cihaz başarıyla kaydedildi.",
      });
    } catch (error) {
      console.error('Kayıt hatası:', error);
      toast({
        variant: "destructive",
        title: "Hata!",
        description: "Cihaz kaydedilirken bir hata oluştu.",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  if (token) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-xl font-bold">Cihaz Token</h2>
        <p className="text-lg font-mono bg-gray-100 p-2 rounded">{token}</p>
        <p className="text-sm text-gray-500">
          WebSocket Durumu: {websocketService.isConnected() ? 'Bağlı' : 'Bağlı Değil'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Cihaz Kaydı</h2>
      <Button 
        onClick={registerDevice} 
        disabled={isRegistering}
      >
        {isRegistering ? 'Kaydediliyor...' : 'Cihazı Kaydet'}
      </Button>
    </div>
  );
};

export default DeviceRegistration;