import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PlaylistSelect } from "./PlaylistSelect";
import { DateRangeSelect } from "./DateRangeSelect";
import { RepeatTypeSelect } from "./RepeatTypeSelect";
import { TargetSelect } from "./TargetSelect";
import { ScheduleFormData } from "./types";

interface PlaylistScheduleFormProps {
  onSuccess?: () => void;
}

export function PlaylistScheduleForm({ onSuccess }: PlaylistScheduleFormProps) {
  const form = useForm<ScheduleFormData>({
    defaultValues: {
      name: "",
      playlist: "",
      startDate: new Date(),
      endDate: new Date(),
      repeatType: "once",
      targets: {
        devices: [],
        groups: []
      }
    }
  });

  console.log("Form values:", form.watch()); // Form değerlerini izle

  const onSubmit = async (data: ScheduleFormData) => {
    try {
      console.log("Submitting form with data:", data);
      const response = await fetch("http://localhost:5000/api/playlist-schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Zamanlama oluşturulamadı");
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <PlaylistSelect control={form.control} />
        <DateRangeSelect control={form.control} />
        <RepeatTypeSelect control={form.control} />
        <TargetSelect control={form.control} />
        
        <div className="flex justify-end">
          <Button type="submit">
            Oluştur
          </Button>
        </div>
      </form>
    </Form>
  );
}