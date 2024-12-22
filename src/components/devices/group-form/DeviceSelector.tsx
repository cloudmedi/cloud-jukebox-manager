import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { useState } from "react";

interface Device {
  _id: string;
  name: string;
  location?: string;
}

interface DeviceSelectorProps {
  devices: Device[];
  selectedDeviceIds: string[];
  onDeviceToggle: (deviceId: string, checked: boolean) => void;
}

export const DeviceSelector = ({
  devices,
  selectedDeviceIds,
  onDeviceToggle,
}: DeviceSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDevices = devices.filter(
    (device) =>
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Label>Cihaz Ekle</Label>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cihaz ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      <ScrollArea className="h-[200px] border rounded-md p-2">
        {filteredDevices.map((device) => (
          <div
            key={device._id}
            className="flex items-center space-x-2 py-2 px-1 hover:bg-muted/50 rounded"
          >
            <Checkbox
              id={device._id}
              checked={selectedDeviceIds.includes(device._id)}
              onCheckedChange={(checked) =>
                onDeviceToggle(device._id, checked as boolean)
              }
            />
            <Label
              htmlFor={device._id}
              className="flex-1 cursor-pointer text-sm"
            >
              <span className="font-medium">{device.name}</span>
              {device.location && (
                <span className="text-muted-foreground ml-2">
                  ({device.location})
                </span>
              )}
            </Label>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};