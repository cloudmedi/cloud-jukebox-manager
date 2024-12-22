import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface PlaybackScheduleFormProps {
  form: any;
}

export const PlaybackScheduleForm = ({ form }: PlaybackScheduleFormProps) => {
  const [scheduleType, setScheduleType] = useState<'songs' | 'minutes' | 'specific'>('songs');
  const [times, setTimes] = useState<string[]>(['']);

  const handleAddTime = () => {
    setTimes([...times, '']);
  };

  const handleRemoveTime = (index: number) => {
    setTimes(times.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="scheduleType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Çalma Sıklığı</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={(value) => {
                  field.onChange(value);
                  setScheduleType(value as 'songs' | 'minutes' | 'specific');
                }}
                defaultValue={field.value}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="songs" id="songs" />
                  <Label htmlFor="songs">Her X şarkıda bir çal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="minutes" id="minutes" />
                  <Label htmlFor="minutes">Her X dakikada bir çal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="specific" id="specific" />
                  <Label htmlFor="specific">Belirli saatlerde çal</Label>
                </div>
              </RadioGroup>
            </FormControl>
          </FormItem>
        )}
      />

      {scheduleType === 'songs' && (
        <FormField
          control={form.control}
          name="songInterval"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kaç şarkıda bir çalınsın?</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {scheduleType === 'minutes' && (
        <FormField
          control={form.control}
          name="minuteInterval"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kaç dakikada bir çalınsın?</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {scheduleType === 'specific' && (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="specificTimes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Çalma Saatleri</FormLabel>
                <div className="space-y-2">
                  {times.map((time, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => {
                          const newTimes = [...times];
                          newTimes[index] = e.target.value;
                          setTimes(newTimes);
                          field.onChange(newTimes);
                        }}
                      />
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveTime(index)}
                        >
                          Sil
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTime}
                  >
                    Saat Ekle
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
};