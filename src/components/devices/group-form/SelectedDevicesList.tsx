import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Device {
  _id: string;
  name: string;
  location?: string;
}

interface SelectedDevicesListProps {
  selectedDevices: Device[];
  onRemoveDevice: (deviceId: string) => void;
}

export const SelectedDevicesList = ({
  selectedDevices,
  onRemoveDevice,
}: SelectedDevicesListProps) => {
  if (selectedDevices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Henüz cihaz seçilmedi</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/50">
      {selectedDevices.map((device) => (
        <Badge
          key={device._id}
          variant="secondary"
          className="flex items-center gap-1.5 px-2 py-1"
        >
          {device.name}
          {device.location && (
            <span className="text-xs text-muted-foreground">
              ({device.location})
            </span>
          )}
          <X
            className="h-3 w-3 cursor-pointer hover:text-destructive"
            onClick={() => onRemoveDevice(device._id)}
          />
        </Badge>
      ))}
    </div>
  );
};