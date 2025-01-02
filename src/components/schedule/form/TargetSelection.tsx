import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Users, Monitor } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export function TargetSelection() {
  const [deviceSearch, setDeviceSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");

  const { data: devices = [] } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) throw new Error("Cihazlar yüklenemedi");
      return response.json();
    }
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/device-groups");
      if (!response.ok) throw new Error("Gruplar yüklenemedi");
      return response.json();
    }
  });

  const filteredDevices = devices.filter((device: any) =>
    device.name.toLowerCase().includes(deviceSearch.toLowerCase()) ||
    device.location?.toLowerCase().includes(deviceSearch.toLowerCase())
  );

  const filteredGroups = groups.filter((group: any) =>
    group.name.toLowerCase().includes(groupSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-lg font-semibold text-primary">
            <Monitor className="h-5 w-5" />
            <span>Cihazlar</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cihaz ara..."
              value={deviceSearch}
              onChange={(e) => setDeviceSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[300px] rounded-md border">
            <div className="p-4 space-y-2">
              {filteredDevices.map((device: any) => (
                <FormField
                  key={device._id}
                  name="targetDevices"
                  render={({ field }) => (
                    <div className="flex items-center space-x-2 rounded-lg p-2 hover:bg-accent">
                      <Checkbox
                        checked={field.value?.includes(device._id)}
                        onCheckedChange={(checked) => {
                          const newValue = checked
                            ? [...(field.value || []), device._id]
                            : field.value?.filter((id: string) => id !== device._id);
                          field.onChange(newValue);
                        }}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <span className="text-sm font-medium">{device.name}</span>
                        {device.location && (
                          <span className="text-xs text-muted-foreground">
                            {device.location}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-lg font-semibold text-primary">
            <Users className="h-5 w-5" />
            <span>Gruplar</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Grup ara..."
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[300px] rounded-md border">
            <div className="p-4 space-y-2">
              {filteredGroups.map((group: any) => (
                <FormField
                  key={group._id}
                  name="targetGroups"
                  render={({ field }) => (
                    <div className="flex items-center space-x-2 rounded-lg p-2 hover:bg-accent">
                      <Checkbox
                        checked={field.value?.includes(group._id)}
                        onCheckedChange={(checked) => {
                          const newValue = checked
                            ? [...(field.value || []), group._id]
                            : field.value?.filter((id: string) => id !== group._id);
                          field.onChange(newValue);
                        }}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <span className="text-sm font-medium">{group.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {group.devices?.length || 0} cihaz
                        </span>
                      </div>
                    </div>
                  )}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}