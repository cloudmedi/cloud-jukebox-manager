import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface DeviceSelectProps {
  form: any;
  onSelect: (value: string) => void;
}

export const DeviceSelect = ({ form, onSelect }: DeviceSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: devices = [] } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) throw new Error("Cihazlar yüklenemedi");
      return response.json();
    },
    initialData: []
  });

  const filteredDevices = devices?.filter((device: any) =>
    device?.name?.toLowerCase().includes(search.toLowerCase()) ||
    device?.location?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {form.watch("targetDevices")?.[0]
            ? devices?.find((device: any) => device?._id === form.watch("targetDevices")?.[0])?.name || "Cihaz seçin..."
            : "Cihaz seçin..."}
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Cihaz ara..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>Cihaz bulunamadı.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto">
            {filteredDevices.map((device: any) => (
              <CommandItem
                key={device._id}
                value={device._id}
                onSelect={(value) => {
                  onSelect(value);
                  setOpen(false);
                }}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{device.name || "İsimsiz Cihaz"}</span>
                  {device.location && (
                    <span className="text-sm text-muted-foreground">
                      {device.location}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};