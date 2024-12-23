import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PlaylistSelect } from "./PlaylistSelect";
import { DateRangeSelect } from "./DateRangeSelect";
import { RepeatTypeSelect } from "./RepeatTypeSelect";
import { TargetSelect } from "./TargetSelect";
import { ScheduleFormData } from "./types";
import { zodResolver } from "@hookform/resolvers/zod";
import { scheduleFormSchema } from "./validation";

interface PlaylistScheduleFormProps {
  initialDate?: Date | null;
  onSuccess?: () => void;
}

export const PlaylistScheduleForm = ({ initialDate, onSuccess }: PlaylistScheduleFormProps) => {
  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      startDate: initialDate || new Date(),
      endDate: initialDate ? new Date(initialDate.getTime() + 60 * 60 * 1000) : new Date(),
      repeatType: "once",
      targets: {
        devices: [],
        groups: []
      }
    }
  });

  const queryClient = useQueryClient();

  const createScheduleMutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      const response = await fetch("http://localhost:5000/api/playlist-schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          createdBy: "system", // TODO: Implement auth
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist-schedules"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const onSubmit = (data: ScheduleFormData) => {
    createScheduleMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <PlaylistSelect form={form} />
        <DateRangeSelect form={form} />
        <RepeatTypeSelect form={form} />
        <TargetSelect form={form} />
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={() => form.reset()}>
            Sıfırla
          </Button>
          <Button 
            type="submit" 
            disabled={createScheduleMutation.isPending}
          >
            {createScheduleMutation.isPending ? "Oluşturuluyor..." : "Zamanla"}
          </Button>
        </div>
      </form>
    </Form>
  );
};