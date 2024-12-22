import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { ScheduleFormData } from "./types";

interface RepeatTypeSelectProps {
  form: UseFormReturn<ScheduleFormData>;
}

export const RepeatTypeSelect = ({ form }: RepeatTypeSelectProps) => {
  return (
    <FormField
      control={form.control}
      name="repeatType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Tekrar Tipi</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Tekrar tipini seçin" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="once">Bir Kez</SelectItem>
              <SelectItem value="daily">Günlük</SelectItem>
              <SelectItem value="weekly">Haftalık</SelectItem>
              <SelectItem value="monthly">Aylık</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
};