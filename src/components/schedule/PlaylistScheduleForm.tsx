import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { BasicInfo } from "./form/BasicInfo";
import { TimeSettings } from "./form/TimeSettings";
import { TargetSelection } from "./form/TargetSelection";
import { scheduleFormSchema } from "./types";
import { useToast } from "@/components/ui/use-toast";
import { useMutation } from "@tanstack/react-query";

interface PlaylistScheduleFormProps {
  onSuccess?: () => void;
  initialDates?: {
    start: Date | null;
    end: Date | null;
  };
}

export function PlaylistScheduleForm({ onSuccess, initialDates }: PlaylistScheduleFormProps) {
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      playlist: "",
      startDate: initialDates?.start || new Date(),
      endDate: initialDates?.end || new Date(),
      repeatType: "once",
      targetDevices: [],
      targetGroups: []
    }
  });

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await fetch("http://localhost:5000/api/playlist-schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playlist: values.playlist,
          startDate: values.startDate,
          endDate: values.endDate,
          repeatType: values.repeatType,
          targets: {
            devices: values.targetDevices,
            groups: values.targetGroups
          }
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create schedule");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Zamanlama oluşturuldu",
        description: "Playlist başarıyla zamanlandı.",
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message,
      });
    },
  });

  const onSubmit = (values: any) => {
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <BasicInfo />
        <TimeSettings initialDates={initialDates} />
        <TargetSelection />
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
        </Button>
      </form>
    </Form>
  );
}