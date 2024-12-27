import { Device } from "@/services/deviceService";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface TimeInfoProps {
  device: Device;
}

export const TimeInfo = ({ device }: TimeInfoProps) => {
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
          <span className="text-sm text-muted-foreground">
            Oluşturulma Tarihi
          </span>
          <p>{device.createdAt && formatDate(device.createdAt)}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">
            Güncellenme Tarihi
          </span>
          <p>{device.updatedAt && formatDate(device.updatedAt)}</p>
        </div>
      </div>
    </div>
  );
};