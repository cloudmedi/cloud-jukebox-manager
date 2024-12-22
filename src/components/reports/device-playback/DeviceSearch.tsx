import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DeviceSearchProps {
  devices: any[];
  selectedDevice: string;
  onDeviceSelect: (deviceId: string) => void;
  isLoading: boolean;
}

export function DeviceSearch({
  devices,
  selectedDevice,
  onDeviceSelect,
  isLoading,
}: DeviceSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDevices = devices?.filter(
    (device) =>
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                {device.name} - {device.location}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}