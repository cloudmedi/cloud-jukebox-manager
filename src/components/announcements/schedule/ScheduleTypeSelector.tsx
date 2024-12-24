import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormContext } from "react-hook-form";
import { AnnouncementFormData } from "../form/types";

export const ScheduleTypeSelector = () => {
  const form = useFormContext<AnnouncementFormData>();

  return (
    <FormField
      control={form.control}
      name="scheduleType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Çalma Sıklığı</FormLabel>
          <RadioGroup
            onValueChange={field.onChange}
            defaultValue={field.value}
            className="grid gap-4 p-4 border rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="songs" id="songs" />
              <Label htmlFor="songs" className="flex-1">Her X şarkıda bir çal</Label>
              {field.value === "songs" && (
                <Input
                  type="number"
                  min="1"
                  className="w-24"
                  {...form.register("songInterval", { valueAsNumber: true })}
                  placeholder="Şarkı sayısı"
                />
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="minutes" id="minutes" />
              <Label htmlFor="minutes" className="flex-1">Her X dakikada bir çal</Label>
              {field.value === "minutes" && (
                <Input
                  type="number"
                  min="1"
                  className="w-24"
                  {...form.register("minuteInterval", { valueAsNumber: true })}
                  placeholder="Dakika"
                />
              )}
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="specific" id="specific" />
              <Label htmlFor="specific">Belirli saatlerde çal</Label>
            </div>
          </RadioGroup>
        </FormItem>
      )}
    />
  );
};