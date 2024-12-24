import { useState } from "react";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Device, DeviceGroup } from "./types/announcement";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TargetDeviceSelectProps {
  form: any;
}

export const TargetDeviceSelect = ({ form }: TargetDeviceSelectProps) => {
  const [openDevices, setOpenDevices] = useState(false);
  const [openGroups, setOpenGroups] = useState(false);

  const { data: devices = [], isLoading: isDevicesLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) throw new Error("Cihazlar yüklenemedi");
      return response.json();
    }
  });

  const { data: groups = [], isLoading: isGroupsLoading } = useQuery({
    queryKey: ["device-groups"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/device-groups");
      if (!response.ok) throw new Error("Gruplar yüklenemedi");
      return response.json();
    }
  });

  const handleDeviceSelect = (deviceId: string) => {
    const currentDevices = form.watch("targetDevices") || [];
    const updatedDevices = currentDevices.includes(deviceId)
      ? currentDevices.filter(id => id !== deviceId)
      : [...currentDevices, deviceId];
    form.setValue("targetDevices", updatedDevices);
  };

  const handleGroupSelect = (groupId: string) => {
    const currentGroups = form.watch("targetGroups") || [];
    const updatedGroups = currentGroups.includes(groupId)
      ? currentGroups.filter(id => id !== groupId)
      : [...currentGroups, groupId];
    form.setValue("targetGroups", updatedGroups);
  };

  return (
    <div className="space-y-4">
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
                  {field.value?.length 
                    ? `${field.value.length} cihaz seçildi`
                    : "Cihaz seçin..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Cihaz ara..." />
                  <CommandEmpty>Cihaz bulunamadı.</CommandEmpty>
                  <ScrollArea className="h-[200px]">
                    <CommandGroup>
                      {devices.map((device: Device) => (
                        <CommandItem
                          key={device._id}
                          value={device._id}
                          onSelect={() => handleDeviceSelect(device._id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value?.includes(device._id) ? "opacity-100" : "opacity-0"
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
                          <Badge
                            variant={device.isOnline ? "success" : "destructive"}
                            className="ml-auto"
                          >
                            {device.isOnline ? "Çevrimiçi" : "Çevrimdışı"}
                          </Badge>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </ScrollArea>
                </Command>
              </PopoverContent>
            </Popover>
            {field.value?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {field.value.map((deviceId: string) => {
                  const device = devices.find((d: Device) => d._id === deviceId);
                  return device && (
                    <Badge key={deviceId} variant="secondary">
                      {device.name}
                    </Badge>
                  );
                })}
              </div>
            )}
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
                  {field.value?.length 
                    ? `${field.value.length} grup seçildi`
                    : "Grup seçin..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Grup ara..." />
                  <CommandEmpty>Grup bulunamadı.</CommandEmpty>
                  <ScrollArea className="h-[200px]">
                    <CommandGroup>
                      {groups.map((group: DeviceGroup) => (
                        <CommandItem
                          key={group._id}
                          value={group._id}
                          onSelect={() => handleGroupSelect(group._id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value?.includes(group._id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{group.name}</span>
                            {group.description && (
                              <span className="text-sm text-muted-foreground">
                                {group.description}
                              </span>
                            )}
                          </div>
                          <Badge
                            variant={group.status === 'active' ? "success" : "secondary"}
                            className="ml-auto"
                          >
                            {group.status === 'active' ? "Aktif" : "Pasif"}
                          </Badge>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </ScrollArea>
                </Command>
              </PopoverContent>
            </Popover>
            {field.value?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {field.value.map((groupId: string) => {
                  const group = groups.find((g: DeviceGroup) => g._id === groupId);
                  return group && (
                    <Badge key={groupId} variant="secondary">
                      {group.name}
                    </Badge>
                  );
                })}
              </div>
            )}
          </FormItem>
        )}
      />
    </div>
  );
};