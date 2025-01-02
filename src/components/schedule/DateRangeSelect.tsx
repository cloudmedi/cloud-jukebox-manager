import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Control } from "react-hook-form";

interface DateRangeSelectProps {
  control: Control<any>;
}

export function DateRangeSelect({ control }: DateRangeSelectProps) {
  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
      <FormField
        control={control}
        name="startDate"
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormLabel>Başlangıç Tarihi</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? format(field.value, "PPP") : "Tarih seçin"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="endDate"
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormLabel>Bitiş Tarihi</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? format(field.value, "PPP") : "Tarih seçin"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </FormItem>
        )}
      />
    </div>
  );
}