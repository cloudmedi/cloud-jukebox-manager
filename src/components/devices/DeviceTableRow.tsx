import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Device } from "@/services/deviceService";
import { DeviceActions } from "./DeviceActions";
import { Checkbox } from "@/components/ui/checkbox";

interface DeviceTableRowProps {
  device: Device;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
}

export const DeviceTableRow = ({ device, isSelected, onSelect }: DeviceTableRowProps) => {
  return (
    <TableRow>
      <TableCell>
        <Checkbox checked={isSelected} onCheckedChange={onSelect} />
      </TableCell>
      <TableCell>{device.name}</TableCell>
      <TableCell>{device.token}</TableCell>
      <TableCell>{device.location}</TableCell>
      <TableCell>{device.ipAddress || "-"}</TableCell>
      <TableCell>
        <Badge
          variant={device.isOnline ? "success" : "destructive"}
          className="capitalize"
        >
          {device.isOnline ? "Çevrimiçi" : "Çevrimdışı"}
        </Badge>
      </TableCell>
      <TableCell>
        {device.playlistStatus ? (
          <Badge
            variant={
              device.playlistStatus === "loaded"
                ? "success"
                : device.playlistStatus === "loading"
                ? "warning"
                : "destructive"
            }
          >
            {device.playlistStatus === "loaded"
              ? "Hazır"
              : device.playlistStatus === "loading"
              ? "Yükleniyor"
              : "Hata"}
          </Badge>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell>%{device.volume}</TableCell>
      <TableCell>
        {formatDistanceToNow(new Date(device.lastSeen), {
          addSuffix: true,
          locale: tr,
        })}
      </TableCell>
      <TableCell className="text-right">
        <DeviceActions device={device} />
      </TableCell>
    </TableRow>
  );
};