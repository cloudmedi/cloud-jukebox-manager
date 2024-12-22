import os from 'os';
import { toast } from "@/components/ui/use-toast";

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

export const collectDeviceInfo = (): DeviceInfo => {
  const networkInterfaces = Object.values(os.networkInterfaces())
    .flat()
    .filter((interface_): interface_ is os.NetworkInterfaceInfo => interface_ !== undefined)
    .map(interface_ => interface_.address);

  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().map(cpu => cpu.model)[0],
    totalMemory: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`,
    freeMemory: `${Math.round(os.freemem() / (1024 * 1024 * 1024))} GB`,
    networkInterfaces,
    osVersion: os.version()
  };
};

export const registerDevice = async (deviceInfo: DeviceInfo): Promise<string> => {
  try {
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    
    const response = await fetch('http://localhost:5000/api/tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        deviceInfo
      }),
    });

    if (!response.ok) {
      throw new Error('Token kaydı başarısız oldu');
    }

    toast({
      title: "Başarılı",
      description: "Cihaz başarıyla kaydedildi",
    });

    return token;
  } catch (error) {
    toast({
      variant: "destructive",
      title: "Hata",
      description: "Cihaz kaydı sırasında bir hata oluştu",
    });
    throw error;
  }
};