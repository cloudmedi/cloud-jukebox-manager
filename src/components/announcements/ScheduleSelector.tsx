import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { Announcement } from "./types";

interface ScheduleSelectorProps {
  form: UseFormReturn<Announcement>;
}

export const ScheduleSelector = ({ form }: ScheduleSelectorProps) => {
  const scheduleType = form.watch("schedule.type");

  return (
    <div className="space-y-4">
      <div>
        <Label>Zamanlama Tipi</Label>
        <RadioGroup
          defaultValue="interval"
          onValueChange={(value) => form.setValue("schedule.type", value as "interval" | "specific")}
          className="grid grid-cols-2 gap-4 mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="interval" id="interval" />
            <Label htmlFor="interval">Aralıklı</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="specific" id="specific" />
            <Label htmlFor="specific">Belirli Saatler</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Başlangıç Tarihi</Label>
          <Calendar
            mode="single"
            selected={form.watch("schedule.startDate")}
            onSelect={(date) => form.setValue("schedule.startDate", date)}
          />
        </div>
        <div className="space-y-2">
          <Label>Bitiş Tarihi</Label>
          <Calendar
            mode="single"
            selected={form.watch("schedule.endDate")}
            onSelect={(date) => form.setValue("schedule.endDate", date)}
          />
        </div>
      </div>

      {scheduleType === "interval" ? (
        <div className="space-y-2">
          <Label>Çalma Aralığı (Dakika)</Label>
          <Input
            type="number"
            min="1"
            {...form.register("schedule.interval", { valueAsNumber: true })}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Çalma Saatleri</Label>
          <div className="space-y-2">
            {form.watch("schedule.specificTimes")?.map((time, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => {
                    const newTimes = [...form.watch("schedule.specificTimes") || []];
                    newTimes[index] = e.target.value;
                    form.setValue("schedule.specificTimes", newTimes);
                  }}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    const newTimes = form.watch("schedule.specificTimes")?.filter((_, i) => i !== index);
                    form.setValue("schedule.specificTimes", newTimes);
                  }}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const currentTimes = form.watch("schedule.specificTimes") || [];
                form.setValue("schedule.specificTimes", [...currentTimes, ""]);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Saat Ekle
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};