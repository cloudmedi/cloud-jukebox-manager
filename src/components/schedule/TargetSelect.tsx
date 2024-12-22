import { useState } from "react";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { ScheduleFormData } from "./types";

interface TargetSelectProps {
  form: UseFormReturn<ScheduleFormData>;
}

export const TargetSelect = ({ form }: TargetSelectProps) => {
  const [selectedType, setSelectedType] = useState<"device" | "group">("device");

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
        render={({ field }) => (
          <FormItem>
            <FormLabel>{selectedType === "device" ? "Cihazlar" : "Gruplar"}</FormLabel>
            <Select onValueChange={(value) => field.onChange([value])} defaultValue={field.value?.[0]}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={`${selectedType === "device" ? "Cihaz" : "Grup"} seçin`} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {selectedType === "device"
                  ? devices?.map((device: any) => (
                      <SelectItem key={device._id} value={device._id}>
                        {device.name}
                      </SelectItem>
                    ))
                  : groups?.map((group: any) => (
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