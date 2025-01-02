import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Control } from "react-hook-form";
import { useState } from "react";

interface TargetSelectProps {
  control: Control<any>;
}

export function TargetSelect({ control }: TargetSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");

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
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter((group: any) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cihaz veya grup ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="targets.devices"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hedef Cihazlar</FormLabel>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                <div className="space-y-2">
                  {filteredDevices.map((device: any) => (
                    <div key={device._id} className="flex items-center space-x-2">
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
                  ))}
                </div>
              </ScrollArea>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="targets.groups"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hedef Gruplar</FormLabel>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                <div className="space-y-2">
                  {filteredGroups.map((group: any) => (
                    <div key={group._id} className="flex items-center space-x-2">
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
                  ))}
                </div>
              </ScrollArea>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}