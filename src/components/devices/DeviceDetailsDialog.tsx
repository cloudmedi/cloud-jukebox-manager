import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Device } from "@/services/deviceService";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";

interface DeviceDetailsDialogProps {
  device: Device;
  isOpen: boolean;
  onClose: () => void;
}

const DeviceDetailsDialog = ({ device, isOpen, onClose }: DeviceDetailsDialogProps) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLastSeenText = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: tr });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Cihaz Detayları</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <div className="space-y-6 p-4">
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

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Sistem Bilgileri</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Bilgisayar Adı</span>
                    <p>{device.deviceInfo?.hostname}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Platform</span>
                    <p>{device.deviceInfo?.platform}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">İşlemci Mimarisi</span>
                    <p>{device.deviceInfo?.arch}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">İşlemci</span>
                    <p className="text-sm">{device.deviceInfo?.cpus}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Toplam Bellek</span>
                    <p>{device.deviceInfo?.totalMemory}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Boş Bellek</span>
                    <p>{device.deviceInfo?.freeMemory}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">İşletim Sistemi Versiyonu</span>
                    <p>{device.deviceInfo?.osVersion}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Ağ Arayüzleri</h3>
              <div className="space-y-2">
                {device.deviceInfo?.networkInterfaces.map((ip, index) => (
                  <div key={index}>
                    <span className="text-sm text-muted-foreground">IP Adresi {index + 1}</span>
                    <p className="font-mono">{ip}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Zaman Bilgileri</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Son Görülme</span>
                  <p>{formatDate(device.lastSeen)}</p>
                  <p className="text-sm text-muted-foreground">
                    ({getLastSeenText(device.lastSeen)})
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Oluşturulma Tarihi</span>
                  <p>{device.createdAt && formatDate(device.createdAt)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Güncellenme Tarihi</span>
                  <p>{device.updatedAt && formatDate(device.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceDetailsDialog;