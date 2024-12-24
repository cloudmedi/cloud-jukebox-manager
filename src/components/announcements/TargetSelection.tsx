import { useQuery } from "@tanstack/react-query";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";

interface TargetSelectionProps {
  form: UseFormReturn<any>;
}

export const TargetSelection = ({ form }: TargetSelectionProps) => {
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

  return (
    <div className="space-y-6">
      <div>
        <FormLabel>Hedef Cihazlar</FormLabel>
        <div className="grid grid-cols-2 gap-4 mt-2">
          {devices.map((device: any) => (
            <label
              key={device._id}
              className="flex items-center p-4 border rounded-lg hover:bg-accent cursor-pointer"
            >
              <FormField
                control={form.control}
                name="targetDevices"
                render={({ field }) => (
                  <Checkbox
                    checked={field.value?.includes(device._id)}
                    onCheckedChange={(checked) => {
                      const current = field.value || [];
                      const updated = checked
                        ? [...current, device._id]
                        : current.filter((id: string) => id !== device._id);
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
        <div className="grid grid-cols-2 gap-4 mt-2">
          {groups.map((group: any) => (
            <label
              key={group._id}
              className="flex items-center p-4 border rounded-lg hover:bg-accent cursor-pointer"
            >
              <FormField
                control={form.control}
                name="targetGroups"
                render={({ field }) => (
                  <Checkbox
                    checked={field.value?.includes(group._id)}
                    onCheckedChange={(checked) => {
                      const current = field.value || [];
                      const updated = checked
                        ? [...current, group._id]
                        : current.filter((id: string) => id !== group._id);
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