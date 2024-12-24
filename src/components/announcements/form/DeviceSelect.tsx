import { useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Device } from "../types/announcement";

interface DeviceSelectProps {
  devices: Device[];
  selectedDevices: string[];
  onDeviceSelect: (deviceId: string) => void;
}

export const DeviceSelect = ({ devices, selectedDevices, onDeviceSelect }: DeviceSelectProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Command className="rounded-lg border shadow-md">
      <CommandInput 
        placeholder="Cihaz ara..." 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandEmpty>Cihaz bulunamadı.</CommandEmpty>
      <CommandGroup className="max-h-[200px] overflow-y-auto">
        {filteredDevices.map((device) => (
          <CommandItem
            key={device._id}
            value={device._id}
            onSelect={() => onDeviceSelect(device._id)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center">
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  selectedDevices.includes(device._id) ? "opacity-100" : "opacity-0"
                )}
              />
              <div className="flex flex-col">
                <span>{device.name}</span>
                {device.location && (
                  <span className="text-sm text-muted-foreground">
                    {device.location}
                  </span>
                )}
              </div>
            </div>
            <Badge
              variant={device.isOnline ? "success" : "destructive"}
              className="ml-auto"
            >
              {device.isOnline ? "Çevrimiçi" : "Çevrimdışı"}
            </Badge>
          </CommandItem>
        ))}
      </CommandGroup>
    </Command>
  );
};