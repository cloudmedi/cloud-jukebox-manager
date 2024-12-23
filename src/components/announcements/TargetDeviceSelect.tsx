import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Device {
  _id: string;
  name: string;
  location?: string;
  isOnline: boolean;
}

interface Group {
  _id: string;
  name: string;
}

interface TargetDeviceSelectProps {
  form: any;
}

export const TargetDeviceSelect = ({ form }: TargetDeviceSelectProps) => {
  const [openDevices, setOpenDevices] = useState(false);
  const [openGroups, setOpenGroups] = useState(false);
  const [deviceSearch, setDeviceSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");

  const { data: devices = [], isLoading: isDevicesLoading, error: devicesError } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      try {
        const response = await fetch("http://localhost:5000/api/devices");
        if (!response.ok) throw new Error("Cihazlar yüklenemedi");
        const data = await response.json();
        return data || [];
      } catch (error) {
        console.error("Cihaz yükleme hatası:", error);
        toast.error("Cihazlar yüklenirken bir hata oluştu");
        return [];
      }
    },
    initialData: []
  });

  const { data: groups = [], isLoading: isGroupsLoading, error: groupsError } = useQuery({
    queryKey: ["device-groups"],
    queryFn: async () => {
      try {
        const response = await fetch("http://localhost:5000/api/device-groups");
        if (!response.ok) throw new Error("Gruplar yüklenemedi");
        const data = await response.json();
        return data || [];
      } catch (error) {
        console.error("Grup yükleme hatası:", error);
        toast.error("Gruplar yüklenirken bir hata oluştu");
        return [];
      }
    },
    initialData: []
  });

  const filteredDevices = devices?.filter((device: Device) =>
    device?.name?.toLowerCase().includes(deviceSearch.toLowerCase()) ||
    device?.location?.toLowerCase().includes(deviceSearch.toLowerCase())
  ) || [];

  const filteredGroups = groups?.filter((group: Group) =>
    group?.name?.toLowerCase().includes(groupSearch.toLowerCase())
  ) || [];

  if (isDevicesLoading || isGroupsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-[40px] bg-muted animate-pulse rounded-md" />
        <div className="h-[40px] bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  if (devicesError || groupsError) {
    return (
      <div className="text-red-500 p-4 text-center">
        Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.
      </div>
    );
  }

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
                    ? devices.find((device: Device) => device?._id === field.value?.[0])?.name || "Cihaz seçin..."
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
                    {filteredDevices.map((device: Device) => (
                      <CommandItem
                        key={device._id}
                        value={device._id}
                        onSelect={(currentValue) => {
                          field.onChange([currentValue]);
                          setOpenDevices(false);
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
                    ? groups.find((group: Group) => group?._id === field.value?.[0])?.name || "Grup seçin..."
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
                    {filteredGroups.map((group: Group) => (
                      <CommandItem
                        key={group._id}
                        value={group._id}
                        onSelect={(currentValue) => {
                          field.onChange([currentValue]);
                          setOpenGroups(false);
                        }}
                      >
                        {group.name || "İsimsiz Grup"}
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