import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { DeviceSelect } from "./DeviceSelect";
import { DeviceGroupSelect } from "./DeviceGroupSelect";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { AnnouncementFormData, Device, DeviceGroup } from "../types/announcement";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TargetSelectorProps {
  form: UseFormReturn<AnnouncementFormData>;
}

export const TargetSelector = ({ form }: TargetSelectorProps) => {
  const { data: devices = [] } = useQuery<Device[]>({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) throw new Error("Cihazlar yüklenemedi");
      return response.json();
    },
  });

  const { data: groups = [] } = useQuery<DeviceGroup[]>({
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

  const selectedDevices = form.watch("targetDevices") || [];
  const selectedGroups = form.watch("targetGroups") || [];

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="targetDevices"
        render={() => (
          <FormItem>
            <FormLabel>Hedef Cihazlar</FormLabel>
            <DeviceSelect
              devices={devices}
              selectedDevices={selectedDevices}
              onDeviceSelect={handleDeviceSelect}
            />
            {selectedDevices.length > 0 && (
              <ScrollArea className="h-20 w-full rounded-md border p-2">
                <div className="flex flex-wrap gap-2">
                  {selectedDevices.map(deviceId => {
                    const device = devices.find(d => d._id === deviceId);
                    return device && (
                      <Badge key={deviceId} variant="secondary">
                        {device.name}
                      </Badge>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="targetGroups"
        render={() => (
          <FormItem>
            <FormLabel>Hedef Gruplar</FormLabel>
            <DeviceGroupSelect
              groups={groups}
              selectedGroups={selectedGroups}
              onGroupSelect={handleGroupSelect}
            />
            {selectedGroups.length > 0 && (
              <ScrollArea className="h-20 w-full rounded-md border p-2">
                <div className="flex flex-wrap gap-2">
                  {selectedGroups.map(groupId => {
                    const group = groups.find(g => g._id === groupId);
                    return group && (
                      <Badge key={groupId} variant="secondary">
                        {group.name}
                      </Badge>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </FormItem>
        )}
      />
    </div>
  );
};