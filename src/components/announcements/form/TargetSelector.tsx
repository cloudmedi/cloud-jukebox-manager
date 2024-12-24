import { useState } from "react";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Device, DeviceGroup } from "../types/announcement";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UseFormReturn } from "react-hook-form";
import { AnnouncementFormData } from "../types/announcement";

interface TargetSelectorProps {
  form: UseFormReturn<AnnouncementFormData>;
}

export const TargetSelector = ({ form }: TargetSelectorProps) => {
  const [selectedType, setSelectedType] = useState<"device" | "group">("device");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: devices = [] } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) throw new Error("Cihazlar yüklenemedi");
      return response.json();
    },
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["device-groups"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/device-groups");
      if (!response.ok) throw new Error("Gruplar yüklenemedi");
      return response.json();
    },
  });

  const handleDeviceSelect = (deviceId: string) => {
    const currentDevices = form.watch("targets.devices") || [];
    const updatedDevices = currentDevices.includes(deviceId)
      ? currentDevices.filter(id => id !== deviceId)
      : [...currentDevices, deviceId];
    form.setValue("targets.devices", updatedDevices);
  };

  const handleGroupSelect = (groupId: string) => {
    const currentGroups = form.watch("targets.groups") || [];
    const updatedGroups = currentGroups.includes(groupId)
      ? currentGroups.filter(id => id !== groupId)
      : [...currentGroups, groupId];
    form.setValue("targets.groups", updatedGroups);
  };

  const filteredItems = selectedType === "device" 
    ? devices.filter((device: Device) => 
        device.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : groups.filter((group: DeviceGroup) => 
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const selectedDevices = form.watch("targets.devices") || [];
  const selectedGroups = form.watch("targets.groups") || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={selectedType === "device" ? "default" : "outline"}
          onClick={() => setSelectedType("device")}
        >
          Cihazlar
        </Button>
        <Button
          type="button"
          variant={selectedType === "group" ? "default" : "outline"}
          onClick={() => setSelectedType("group")}
        >
          Gruplar
        </Button>
      </div>

      <FormField
        control={form.control}
        name={selectedType === "device" ? "targets.devices" : "targets.groups"}
        render={() => (
          <FormItem>
            <FormLabel>{selectedType === "device" ? "Cihazlar" : "Gruplar"}</FormLabel>
            <Command className="border rounded-lg">
              <CommandInput 
                placeholder={`${selectedType === "device" ? "Cihaz" : "Grup"} ara...`}
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
              <ScrollArea className="h-[200px]">
                <CommandGroup>
                  {filteredItems.map((item: Device | DeviceGroup) => (
                    <CommandItem
                      key={item._id}
                      value={item._id}
                      onSelect={() => 
                        selectedType === "device" 
                          ? handleDeviceSelect(item._id)
                          : handleGroupSelect(item._id)
                      }
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              ((selectedType === "device" ? selectedDevices : selectedGroups).includes(item._id))
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{item.name}</span>
                            {'location' in item && item.location && (
                              <span className="text-sm text-muted-foreground">
                                {item.location}
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedType === "device" && 'isOnline' in item && (
                          <Badge
                            variant={item.isOnline ? "success" : "destructive"}
                            className="ml-auto"
                          >
                            {item.isOnline ? "Çevrimiçi" : "Çevrimdışı"}
                          </Badge>
                        )}
                        {selectedType === "group" && 'status' in item && (
                          <Badge
                            variant={item.status === 'active' ? "success" : "secondary"}
                            className="ml-auto"
                          >
                            {item.status === 'active' ? "Aktif" : "Pasif"}
                          </Badge>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </ScrollArea>
            </Command>
          </FormItem>
        )}
      />
    </div>
  );
};