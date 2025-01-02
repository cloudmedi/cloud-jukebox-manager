import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PlaylistSelect } from "./PlaylistSelect";
import { DateRangeSelect } from "./DateRangeSelect";
import { RepeatTypeSelect } from "./RepeatTypeSelect";
import { TargetSelect } from "./TargetSelect";
import { ScheduleFormData } from "./types";
import { useToast } from "@/components/ui/use-toast";
import { useMutation } from "@tanstack/react-query";

interface PlaylistScheduleFormProps {
  onSuccess?: () => void;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

export function PlaylistScheduleForm({ 
  onSuccess,
  initialStartDate,
  initialEndDate 
}: PlaylistScheduleFormProps) {
  const { toast } = useToast();
  
  const form = useForm<ScheduleFormData>({
    defaultValues: {
      name: "",
      playlist: "",
      startDate: initialStartDate || new Date(),
      endDate: initialEndDate || new Date(),
      repeatType: "once",
      targets: {
        devices: [],
        groups: []
      }
    }
  });

  console.log("Form values:", form.watch());

  const mutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      const response = await fetch("/api/playlist-schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Zamanlama oluşturulamadı");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Zamanlama başarıyla oluşturuldu",
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ScheduleFormData) => {
    console.log("Submitting form with data:", data);
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <PlaylistSelect control={form.control} />
        <DateRangeSelect control={form.control} />
        <RepeatTypeSelect control={form.control} />
        <TargetSelect control={form.control} />
        
        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
          </Button>
        </div>
      </form>
    </Form>
  );
}