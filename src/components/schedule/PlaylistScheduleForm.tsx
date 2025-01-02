import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { PlaylistSelect } from "./PlaylistSelect";
import { DateRangeSelect } from "./DateRangeSelect";
import { RepeatTypeSelect } from "./RepeatTypeSelect";
import { TargetSelect } from "./TargetSelect";
import { useQueryClient } from "@tanstack/react-query";

interface ScheduleFormData {
  playlistId: string;
  startDate: Date;
  endDate: Date;
  repeatType: "once" | "daily" | "weekly" | "monthly";
  targetDevices: string[];
  targetGroups: string[];
}

interface PlaylistScheduleFormProps {
  onSuccess?: () => void;
}

export function PlaylistScheduleForm({ onSuccess }: PlaylistScheduleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  
  const form = useForm<ScheduleFormData>({
    defaultValues: {
      playlistId: "",
      startDate: new Date(),
      endDate: new Date(),
      repeatType: "once",
      targetDevices: [],
      targetGroups: []
    }
  });

  const onSubmit = async (data: ScheduleFormData) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch("http://localhost:5000/api/playlist-schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          playlist: data.playlistId,
          startDate: data.startDate,
          endDate: data.endDate,
          repeatType: data.repeatType,
          targets: {
            devices: data.targetDevices,
            groups: data.targetGroups
          }
        })
      });

      if (!response.ok) {
        throw new Error("Zamanlama oluşturulamadı");
      }

      toast.success("Zamanlama başarıyla oluşturuldu");
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      form.reset();
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error("Schedule creation error:", error);
      toast.error("Zamanlama oluşturulurken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <PlaylistSelect control={form.control} />
        <DateRangeSelect control={form.control} />
        <RepeatTypeSelect control={form.control} />
        <TargetSelect control={form.control} />
        
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Oluşturuluyor..." : "Zamanlama Oluştur"}
        </Button>
      </form>
    </Form>
  );
}