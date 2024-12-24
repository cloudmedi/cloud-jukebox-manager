import { useState } from "react";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarIcon, Plus, X } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

interface ScheduleSettingsProps {
  form: UseFormReturn<any>;
}

export const ScheduleSettings = ({ form }: ScheduleSettingsProps) => {
  const [specificTimes, setSpecificTimes] = useState<string[]>([""]);

  const scheduleType = form.watch("scheduleType");

  const addTimeSlot = () => {
    if (specificTimes.length >= 10) {
      toast.error("En fazla 10 özel saat ekleyebilirsiniz");
      return;
    }
    setSpecificTimes([...specificTimes, ""]);
  };

  const removeTimeSlot = (index: number) => {
    const newTimes = specificTimes.filter((_, i) => i !== index);
    setSpecificTimes(newTimes);
    form.setValue("specificTimes", newTimes);
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...specificTimes];
    newTimes[index] = value;
    setSpecificTimes(newTimes);
    form.setValue("specificTimes", newTimes.filter(time => time !== ""));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Başlangıç Tarihi</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "PPP", { locale: tr })
                    ) : (
                      <span>Tarih seçin</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bitiş Tarihi</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "PPP", { locale: tr })
                    ) : (
                      <span>Tarih seçin</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date() ||
                      (form.getValues("startDate") &&
                        date < form.getValues("startDate"))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="scheduleType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Çalma Sıklığı</FormLabel>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="grid gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="songs" id="songs" />
                <Label htmlFor="songs">Her X şarkıda bir çal</Label>
                {field.value === "songs" && (
                  <Input
                    type="number"
                    min="1"
                    className="w-24 ml-4"
                    {...form.register("songInterval", { valueAsNumber: true })}
                    placeholder="Şarkı sayısı"
                  />
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="minutes" id="minutes" />
                <Label htmlFor="minutes">Her X dakikada bir çal</Label>
                {field.value === "minutes" && (
                  <Input
                    type="number"
                    min="1"
                    className="w-24 ml-4"
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

      {scheduleType === "specific" && (
        <div className="space-y-4">
          <Label>Çalma Saatleri</Label>
          {specificTimes.map((time, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(index, e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => removeTimeSlot(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addTimeSlot}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Saat Ekle
          </Button>
        </div>
      )}

      <FormField
        control={form.control}
        name="immediateInterrupt"
        render={({ field }) => (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="immediateInterrupt"
              checked={field.value}
              onChange={field.onChange}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="immediateInterrupt">
              Çalma sırası geldiğinde mevcut şarkıyı durdur
            </Label>
          </div>
        )}
      />
    </div>
  );
};