import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface TargetDeviceSelectProps {
  form: any;
}

export const TargetDeviceSelect = ({ form }: TargetDeviceSelectProps) => {
  const { data: devices } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      return response.json();
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["device-groups"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/device-groups");
      return response.json();
    },
  });

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="targetDevices"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hedef Cihazlar</FormLabel>
            <Select onValueChange={(value) => field.onChange([value])} value={field.value?.[0]}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Cihaz seçin" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {devices?.map((device: any) => (
                  <SelectItem key={device._id} value={device._id}>
                    {device.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="targetGroups"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hedef Gruplar</FormLabel>
            <Select onValueChange={(value) => field.onChange([value])} value={field.value?.[0]}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Grup seçin" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {groups?.map((group: any) => (
                  <SelectItem key={group._id} value={group._id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
    </div>
  );
};