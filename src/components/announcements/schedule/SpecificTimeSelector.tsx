import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { AnnouncementFormData } from "../form/types";

export const SpecificTimeSelector = () => {
  const [specificTimes, setSpecificTimes] = useState<string[]>([""]);
  const form = useFormContext<AnnouncementFormData>();

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
    <div className="space-y-4 mt-4 p-4 border rounded-lg">
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
  );
};