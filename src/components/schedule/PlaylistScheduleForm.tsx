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

export const PlaylistScheduleForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const form = useForm<ScheduleFormData>();
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
      toast.success("Zamanlama başarıyla oluşturuldu");
      queryClient.invalidateQueries({ queryKey: ["playlist-schedules"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
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
        
        <div className="flex justify-end">
          <Button type="submit">Zamanla</Button>
        </div>
      </form>
    </Form>
  );
};