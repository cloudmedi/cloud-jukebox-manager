import { Device } from "@/services/deviceService";

interface SystemInfoProps {
  device: Device;
}

export const SystemInfo = ({ device }: SystemInfoProps) => {
  if (!device.deviceInfo) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Sistem Bilgileri</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">Bilgisayar Adı</span>
            <p>{device.deviceInfo.hostname}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Platform</span>
            <p>{device.deviceInfo.platform}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">
              İşlemci Mimarisi
            </span>
            <p>{device.deviceInfo.arch}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">İşlemci</span>
            <p className="text-sm">{device.deviceInfo.cpus}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">Toplam Bellek</span>
            <p>{device.deviceInfo.totalMemory}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Boş Bellek</span>
            <p>{device.deviceInfo.freeMemory}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">
              İşletim Sistemi Versiyonu
            </span>
            <p>{device.deviceInfo.osVersion}</p>
          </div>
        </div>
      </div>
    </div>
  );
};