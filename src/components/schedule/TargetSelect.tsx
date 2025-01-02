import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { Control } from "react-hook-form";

interface TargetSelectProps {
  control: Control<any>;
}

export function TargetSelect({ control }: TargetSelectProps) {
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

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="targetDevices"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hedef Cihazlar</FormLabel>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              <div className="space-y-2">
                {devices.map((device: any) => (
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
                    <span>{device.name}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="targetGroups"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hedef Gruplar</FormLabel>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              <div className="space-y-2">
                {groups.map((group: any) => (
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
                    <span>{group.name}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </FormItem>
        )}
      />
    </div>
  );
}