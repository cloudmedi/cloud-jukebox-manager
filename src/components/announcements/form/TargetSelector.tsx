import { useState } from "react";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
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

  const filteredItems = selectedType === "device" 
    ? devices.filter((device: any) => 
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.location?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : groups.filter((group: any) => 
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const selectedDevices = form.watch("targetDevices") || [];
  const selectedGroups = form.watch("targetGroups") || [];

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
        name={selectedType === "device" ? "targetDevices" : "targetGroups"}
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
                  {filteredItems.map((item: any) => (
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
                              (selectedType === "device" ? selectedDevices : selectedGroups).includes(item._id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{item.name}</span>
                            {item.location && (
                              <span className="text-sm text-muted-foreground">
                                {item.location}
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedType === "device" && (
                          <Badge
                            variant={item.isOnline ? "success" : "destructive"}
                            className="ml-auto"
                          >
                            {item.isOnline ? "Çevrimiçi" : "Çevrimdışı"}
                          </Badge>
                        )}
                        {selectedType === "group" && (
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

      {/* Seçili öğeleri göster */}
      {(selectedType === "device" ? selectedDevices : selectedGroups).length > 0 && (
        <ScrollArea className="h-20 w-full rounded-md border p-2">
          <div className="flex flex-wrap gap-2">
            {selectedType === "device"
              ? selectedDevices.map(deviceId => {
                  const device = devices.find((d: any) => d._id === deviceId);
                  return device && (
                    <Badge key={deviceId} variant="secondary">
                      {device.name}
                    </Badge>
                  );
                })
              : selectedGroups.map(groupId => {
                  const group = groups.find((g: any) => g._id === groupId);
                  return group && (
                    <Badge key={groupId} variant="secondary">
                      {group.name}
                    </Badge>
                  );
                })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};