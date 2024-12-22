import { useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface Device {
  _id: string;
  name: string;
  location: string;
}

interface DeviceSearchProps {
  devices?: Device[];
  selectedDevice: string;
  onDeviceSelect: (deviceId: string) => void;
  isLoading?: boolean;
}

export function DeviceSearch({ devices, selectedDevice, onDeviceSelect, isLoading }: DeviceSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDevices = devices?.filter((device) =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium">Cihaz</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedDevice
              ? devices?.find((device) => device._id === selectedDevice)?.name
              : "Cihaz seçin..."}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder="Cihaz ara..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandEmpty>Cihaz bulunamadı.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {filteredDevices?.map((device) => (
                <CommandItem
                  key={device._id}
                  value={device._id}
                  onSelect={(currentValue) => {
                    onDeviceSelect(currentValue);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{device.name}</span>
                    <span className="text-sm text-muted-foreground">{device.location}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}