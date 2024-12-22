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

interface DeviceDetailsDialogProps {
  device: Device;
  onClose: () => void;
}

const DeviceDetailsDialog = ({ device, onClose }: DeviceDetailsDialogProps) => {
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
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cihaz Detayları</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <div className="space-y-6 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Temel Bilgiler</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">Cihaz Adı</dt>
                    <dd className="text-base">{device.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Token</dt>
                    <dd className="text-base font-mono">{device.token}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Konum</dt>
                    <dd className="text-base">{device.location}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Durum Bilgileri</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">IP Adresi</dt>
                    <dd className="text-base font-mono">{device.ipAddress || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Çevrimiçi Durumu</dt>
                    <dd className="text-base">{device.isOnline ? "Çevrimiçi" : "Çevrimdışı"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Ses Seviyesi</dt>
                    <dd className="text-base">%{device.volume}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Playlist Bilgisi</h3>
              <dl>
                <dt className="text-sm text-muted-foreground">Aktif Playlist</dt>
                <dd className="text-base">
                  {device.activePlaylist ? device.activePlaylist.name : "Playlist Atanmamış"}
                </dd>
              </dl>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Zaman Bilgileri</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Son Görülme</dt>
                  <dd className="text-base">{formatDate(device.lastSeen)}</dd>
                  <dd className="text-sm text-muted-foreground">
                    ({getLastSeenText(device.lastSeen)})
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Oluşturulma Tarihi</dt>
                  <dd className="text-base">
                    {device.createdAt && formatDate(device.createdAt)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceDetailsDialog;