import { Device } from "@/services/deviceService";

interface BasicInfoProps {
  device: Device;
}

export const BasicInfo = ({ device }: BasicInfoProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Temel Bilgiler</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">Cihaz ID</span>
            <p className="font-mono text-sm">{device._id}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Token</span>
            <p className="font-mono text-sm">{device.token}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Konum</span>
            <p>{device.location}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">IP Adresi</span>
            <p className="font-mono">{device.ipAddress || "-"}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Durum</span>
            <p>{device.isOnline ? "Çevrimiçi" : "Çevrimdışı"}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Ses Seviyesi</span>
            <p>%{device.volume}</p>
          </div>
        </div>
      </div>
    </div>
  );
};