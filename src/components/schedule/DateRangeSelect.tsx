import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { ScheduleFormData } from "./types";

interface DateRangeSelectProps {
  form: UseFormReturn<ScheduleFormData>;
}

export const DateRangeSelect = ({ form }: DateRangeSelectProps) => {
  const handleStartDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Mevcut saat bilgisini koru
    const currentStartDate = form.getValues("startDate");
    const newDate = new Date(date);
    if (currentStartDate) {
      newDate.setHours(currentStartDate.getHours(), currentStartDate.getMinutes());
    } else {
      const now = new Date();
      newDate.setHours(now.getHours(), now.getMinutes());
    }
    
    form.setValue("startDate", newDate);
    
    // Bitiş tarihi kontrolü
    const endDate = form.getValues("endDate");
    if (!endDate || endDate <= newDate) {
      const newEndDate = new Date(newDate);
      newEndDate.setHours(newDate.getHours() + 1);
      form.setValue("endDate", newEndDate);
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Mevcut saat bilgisini koru
    const currentEndDate = form.getValues("endDate");
    const newDate = new Date(date);
    if (currentEndDate) {
      newDate.setHours(currentEndDate.getHours(), currentEndDate.getMinutes());
    } else {
      const startDate = form.getValues("startDate");
      newDate.setHours(startDate.getHours() + 1, startDate.getMinutes());
    }
    
    form.setValue("endDate", newDate);
  };

  const handleStartTimeChange = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const currentDate = form.getValues("startDate") || new Date();
    const newDate = new Date(currentDate);
    newDate.setHours(hours, minutes);
    form.setValue("startDate", newDate);
    
    // Bitiş saati kontrolü
    const endDate = form.getValues("endDate");
    if (!endDate || endDate <= newDate) {
      const newEndDate = new Date(newDate);
      newEndDate.setHours(newDate.getHours() + 1);
      form.setValue("endDate", newEndDate);
    }
  };

  const handleEndTimeChange = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const currentDate = form.getValues("endDate") || new Date();
    const newDate = new Date(currentDate);
    newDate.setHours(hours, minutes);
    form.setValue("endDate", newDate);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="startDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Başlangıç Tarihi ve Saati</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "dd MMM yyyy HH:mm", { locale: tr })
                    ) : (
                      <span>Tarih ve saat seçin</span>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      <Clock className="h-4 w-4 opacity-50" />
                      <CalendarIcon className="h-4 w-4 opacity-50" />
                    </div>
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-4 border-b">
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium">Saat</label>
                      <input
                        type="time"
                        className="w-full px-2 py-1 border rounded"
                        value={field.value ? format(field.value, "HH:mm") : ""}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={handleStartDateSelect}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="endDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Bitiş Tarihi ve Saati</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "dd MMM yyyy HH:mm", { locale: tr })
                    ) : (
                      <span>Tarih ve saat seçin</span>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      <Clock className="h-4 w-4 opacity-50" />
                      <CalendarIcon className="h-4 w-4 opacity-50" />
                    </div>
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-4 border-b">
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium">Saat</label>
                      <input
                        type="time"
                        className="w-full px-2 py-1 border rounded"
                        value={field.value ? format(field.value, "HH:mm") : ""}
                        onChange={(e) => handleEndTimeChange(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={handleEndDateSelect}
                  disabled={(date) => {
                    const startDate = form.getValues("startDate");
                    return date < new Date() || (startDate && date < startDate);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};