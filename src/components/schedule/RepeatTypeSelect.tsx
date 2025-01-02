import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";

interface RepeatTypeSelectProps {
  control: Control<any>;
}

export function RepeatTypeSelect({ control }: RepeatTypeSelectProps) {
  return (
    <FormField
      control={control}
      name="repeatType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Tekrar Tipi</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger>
              <SelectValue placeholder="Tekrar tipini seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="once">Tek Seferlik</SelectItem>
              <SelectItem value="daily">Günlük</SelectItem>
              <SelectItem value="weekly">Haftalık</SelectItem>
              <SelectItem value="monthly">Aylık</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
}