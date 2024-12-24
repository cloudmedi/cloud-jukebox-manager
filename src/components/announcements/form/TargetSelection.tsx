import { useQuery } from "@tanstack/react-query";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { AnnouncementFormData } from "./types";

export const TargetSelection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const form = useFormContext<AnnouncementFormData>();
  const selectedDevices = form.watch("targetDevices") || [];
  const selectedGroups = form.watch("targetGroups") || [];

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

  const filteredDevices = devices.filter((device: any) =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter((group: any) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isDeviceSelected = (deviceId: string) => {
    return selectedDevices.some((id: any) => 
      typeof id === 'string' ? id === deviceId : id._id === deviceId
    );
  };

  const isGroupSelected = (groupId: string) => {
    return selectedGroups.some((id: any) => 
      typeof id === 'string' ? id === groupId : id._id === groupId
    );
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cihaz veya grup ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div>
        <FormLabel>Hedef Cihazlar</FormLabel>
        <div className="grid grid-cols-2 gap-4 mt-2 max-h-[300px] overflow-y-auto">
          {filteredDevices.map((device: any) => (
            <label
              key={device._id}
              className="flex items-center p-4 border rounded-lg hover:bg-accent cursor-pointer"
            >
              <FormField
                control={form.control}
                name="targetDevices"
                render={({ field }) => (
                  <Checkbox
                    checked={isDeviceSelected(device._id)}
                    onCheckedChange={(checked) => {
                      const current = field.value || [];
                      const updated = checked
                        ? [...current, device._id]
                        : current.filter((id: any) => 
                            typeof id === 'string' 
                              ? id !== device._id 
                              : id._id !== device._id
                          );
                      field.onChange(updated);
                    }}
                  />
                )}
              />
              <div className="ml-3">
                <p className="font-medium">{device.name}</p>
                <p className="text-sm text-muted-foreground">{device.location}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <FormLabel>Hedef Gruplar</FormLabel>
        <div className="grid grid-cols-2 gap-4 mt-2 max-h-[300px] overflow-y-auto">
          {filteredGroups.map((group: any) => (
            <label
              key={group._id}
              className="flex items-center p-4 border rounded-lg hover:bg-accent cursor-pointer"
            >
              <FormField
                control={form.control}
                name="targetGroups"
                render={({ field }) => (
                  <Checkbox
                    checked={isGroupSelected(group._id)}
                    onCheckedChange={(checked) => {
                      const current = field.value || [];
                      const updated = checked
                        ? [...current, group._id]
                        : current.filter((id: any) => 
                            typeof id === 'string' 
                              ? id !== group._id 
                              : id._id !== group._id
                          );
                      field.onChange(updated);
                    }}
                  />
                )}
              />
              <div className="ml-3">
                <p className="font-medium">{group.name}</p>
                <p className="text-sm text-muted-foreground">
                  {group.devices?.length || 0} cihaz
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};