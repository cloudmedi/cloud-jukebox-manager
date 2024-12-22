import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";

interface TargetDeviceSelectProps {
  form: any;
}

export const TargetDeviceSelect = ({ form }: TargetDeviceSelectProps) => {
  const [openDevices, setOpenDevices] = useState(false);
  const [openGroups, setOpenGroups] = useState(false);
  const [deviceSearch, setDeviceSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");

  const { data: devices = [] } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      return response.json();
    },
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["device-groups"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/device-groups");
      return response.json();
    },
  });

  const filteredDevices = devices.filter((device: any) =>
    device.name.toLowerCase().includes(deviceSearch.toLowerCase()) ||
    device.location?.toLowerCase().includes(deviceSearch.toLowerCase())
  );

  const filteredGroups = groups.filter((group: any) =>
    group.name.toLowerCase().includes(groupSearch.toLowerCase())
  );

  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="targetDevices"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hedef Cihazlar</FormLabel>
            <Popover open={openDevices} onOpenChange={setOpenDevices}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openDevices}
                  className="w-full justify-between"
                >
                  {field.value?.[0]
                    ? devices.find((device: any) => device._id === field.value[0])?.name
                    : "Cihaz seçin..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput
                    placeholder="Cihaz ara..."
                    value={deviceSearch}
                    onValueChange={setDeviceSearch}
                  />
                  <CommandEmpty>Cihaz bulunamadı.</CommandEmpty>
                  <CommandGroup className="max-h-[300px] overflow-auto">
                    {filteredDevices.map((device: any) => (
                      <CommandItem
                        key={device._id}
                        value={device._id}
                        onSelect={(currentValue) => {
                          field.onChange([currentValue]);
                          setOpenDevices(false);
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{device.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {device.location}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="targetGroups"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hedef Gruplar</FormLabel>
            <Popover open={openGroups} onOpenChange={setOpenGroups}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openGroups}
                  className="w-full justify-between"
                >
                  {field.value?.[0]
                    ? groups.find((group: any) => group._id === field.value[0])?.name
                    : "Grup seçin..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput
                    placeholder="Grup ara..."
                    value={groupSearch}
                    onValueChange={setGroupSearch}
                  />
                  <CommandEmpty>Grup bulunamadı.</CommandEmpty>
                  <CommandGroup className="max-h-[300px] overflow-auto">
                    {filteredGroups.map((group: any) => (
                      <CommandItem
                        key={group._id}
                        value={group._id}
                        onSelect={(currentValue) => {
                          field.onChange([currentValue]);
                          setOpenGroups(false);
                        }}
                      >
                        {group.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </FormItem>
        )}
      />
    </div>
  );
};