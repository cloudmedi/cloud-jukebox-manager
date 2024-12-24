import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Announcement, Device, DeviceGroup } from "./types";

interface TargetSelectorProps {
  form: UseFormReturn<Announcement>;
}

export const TargetSelector = ({ form }: TargetSelectorProps) => {
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

  const selectedDevices = form.watch("targets.devices") || [];
  const selectedGroups = form.watch("targets.groups") || [];

  return (
    <div className="space-y-4">
      <div>
        <Label>Hedef Cihazlar</Label>
        <Command className="border rounded-lg mt-2">
          <CommandInput placeholder="Cihaz ara..." />
          <CommandEmpty>Cihaz bulunamadı.</CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-y-auto">
            {devices.map((device: Device) => (
              <CommandItem
                key={device._id}
                value={device._id}
                onSelect={() => {
                  const newDevices = selectedDevices.includes(device._id)
                    ? selectedDevices.filter(id => id !== device._id)
                    : [...selectedDevices, device._id];
                  form.setValue("targets.devices", newDevices);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedDevices.includes(device._id) ? "opacity-100" : "opacity-0"
                  )}
                />
                <span>{device.name}</span>
                <Badge
                  variant={device.isOnline ? "success" : "destructive"}
                  className="ml-auto"
                >
                  {device.isOnline ? "Çevrimiçi" : "Çevrimdışı"}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </div>

      <div>
        <Label>Hedef Gruplar</Label>
        <Command className="border rounded-lg mt-2">
          <CommandInput placeholder="Grup ara..." />
          <CommandEmpty>Grup bulunamadı.</CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-y-auto">
            {groups.map((group: DeviceGroup) => (
              <CommandItem
                key={group._id}
                value={group._id}
                onSelect={() => {
                  const newGroups = selectedGroups.includes(group._id)
                    ? selectedGroups.filter(id => id !== group._id)
                    : [...selectedGroups, group._id];
                  form.setValue("targets.groups", newGroups);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedGroups.includes(group._id) ? "opacity-100" : "opacity-0"
                  )}
                />
                <span>{group.name}</span>
                <Badge
                  variant={group.status === "active" ? "success" : "secondary"}
                  className="ml-auto"
                >
                  {group.status === "active" ? "Aktif" : "Pasif"}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </div>
    </div>
  );
};