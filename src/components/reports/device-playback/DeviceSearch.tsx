import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

interface Device {
  _id: string;
  name: string;
  location?: string;
}

interface DeviceSearchProps {
  devices: Device[];
  selectedDevice: string;
  onDeviceSelect: (deviceId: string) => void;
  isLoading?: boolean;
}

export function DeviceSearch({
  devices = [],
  selectedDevice,
  onDeviceSelect,
  isLoading = false,
}: DeviceSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  console.log('DeviceSearch props:', {
    devices,
    selectedDevice,
    isLoading
  });

  const selectedDeviceName = devices.find(
    (device) => device._id === selectedDevice
  )?.name;

  const filteredDevices = devices.filter(device => 
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeviceSelect = (deviceId: string) => {
    console.log('Cihaz seçildi:', deviceId);
    onDeviceSelect(deviceId === selectedDevice ? "" : deviceId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading}
        >
          {selectedDeviceName || "Cihaz seçin..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Cihaz ara..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>Cihaz bulunamadı.</CommandEmpty>
            <CommandGroup>
              {filteredDevices.map((device) => (
                <CommandItem
                  key={device._id}
                  value={device.name}
                  onSelect={() => handleDeviceSelect(device._id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedDevice === device._id ? "opacity-100" : "opacity-0"
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
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}