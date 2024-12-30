import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { useState } from "react";

interface Device {
  _id: string;
  name: string;
  location?: string;
}

interface DeviceSearchProps {
  devices?: Device[];
  selectedDevice: string;
  onDeviceSelect: (deviceId: string) => void;
  isLoading: boolean;
}

export function DeviceSearch({
  devices = [],
  selectedDevice,
  onDeviceSelect,
  isLoading,
}: DeviceSearchProps) {
  const [open, setOpen] = useState(false);

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
            ? devices.find((device) => device._id === selectedDevice)?.name
            : "Cihaz seçin..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Cihaz ara..." />
          <CommandEmpty>Cihaz bulunamadı.</CommandEmpty>
          <CommandGroup>
            {devices.map((device) => (
              <CommandItem
                key={device._id}
                value={device._id}
                onSelect={(currentValue) => {
                  onDeviceSelect(currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedDevice === device._id ? "opacity-100" : "opacity-0"
                  )}
                />
                {device.name}
                {device.location && (
                  <span className="ml-2 text-muted-foreground">
                    ({device.location})
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}