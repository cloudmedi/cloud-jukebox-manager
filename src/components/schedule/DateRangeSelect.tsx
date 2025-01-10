import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Control } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DateRangeSelectProps {
  control: Control<any>;
}

export function DateRangeSelect({ control }: DateRangeSelectProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField
        control={control}
        name="startDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Başlangıç Tarihi ve Saati</FormLabel>
            <FormMessage />
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
                      format(field.value, "PPP HH:mm", { locale: tr })
                    ) : (
                      <span>Tarih ve saat seçin</span>
                    )}
                    <div className="ml-auto flex items-center">
                      <Clock className="h-4 w-4 opacity-50 mr-2" />
                      <CalendarIcon className="h-4 w-4 opacity-50" />
                    </div>
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      if (date) {
                        const currentValue = field.value || new Date();
                        date.setHours(currentValue.getHours());
                        date.setMinutes(currentValue.getMinutes());
                        field.onChange(date);
                      }
                    }}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                  <div className="flex gap-2 px-3 pb-3">
                    <Select
                      value={field.value ? field.value.getHours().toString() : "0"}
                      onValueChange={(value) => {
                        const date = field.value || new Date();
                        date.setHours(parseInt(value));
                        field.onChange(new Date(date));
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Saat" />
                      </SelectTrigger>
                      <SelectContent>
                        {hours.map((hour) => (
                          <SelectItem key={hour} value={hour.toString()}>
                            {hour.toString().padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={field.value ? field.value.getMinutes().toString() : "0"}
                      onValueChange={(value) => {
                        const date = field.value || new Date();
                        date.setMinutes(parseInt(value));
                        field.onChange(new Date(date));
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Dakika" />
                      </SelectTrigger>
                      <SelectContent>
                        {minutes.map((minute) => (
                          <SelectItem key={minute} value={minute.toString()}>
                            {minute.toString().padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="endDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Bitiş Tarihi ve Saati</FormLabel>
            <FormMessage />
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
                      format(field.value, "PPP HH:mm", { locale: tr })
                    ) : (
                      <span>Tarih ve saat seçin</span>
                    )}
                    <div className="ml-auto flex items-center">
                      <Clock className="h-4 w-4 opacity-50 mr-2" />
                      <CalendarIcon className="h-4 w-4 opacity-50" />
                    </div>
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      if (date) {
                        const currentValue = field.value || new Date();
                        date.setHours(currentValue.getHours());
                        date.setMinutes(currentValue.getMinutes());
                        field.onChange(date);
                      }
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    initialFocus
                  />
                  <div className="flex gap-2 px-3 pb-3">
                    <Select
                      value={field.value ? field.value.getHours().toString() : "0"}
                      onValueChange={(value) => {
                        const date = field.value || new Date();
                        date.setHours(parseInt(value));
                        field.onChange(new Date(date));
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Saat" />
                      </SelectTrigger>
                      <SelectContent>
                        {hours.map((hour) => (
                          <SelectItem key={hour} value={hour.toString()}>
                            {hour.toString().padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={field.value ? field.value.getMinutes().toString() : "0"}
                      onValueChange={(value) => {
                        const date = field.value || new Date();
                        date.setMinutes(parseInt(value));
                        field.onChange(new Date(date));
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Dakika" />
                      </SelectTrigger>
                      <SelectContent>
                        {minutes.map((minute) => (
                          <SelectItem key={minute} value={minute.toString()}>
                            {minute.toString().padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </FormItem>
        )}
      />
    </div>
  );
}