import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BasicInfo } from "./form/BasicInfo";
import { TimeSettings } from "./form/TimeSettings";
import { TargetSelection } from "./form/TargetSelection";

interface PlaylistScheduleFormProps {
  onSuccess?: () => void;
}

interface ScheduleFormData {
  name: string;
  playlistId: string;
  startDate: Date;
  endDate: Date;
  repeatType: "once" | "daily" | "weekly" | "monthly";
  targetDevices: string[];
  targetGroups: string[];
}

export function PlaylistScheduleForm({ onSuccess }: PlaylistScheduleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  
  const form = useForm<ScheduleFormData>({
    defaultValues: {
      name: "",
      playlistId: "",
      startDate: new Date(),
      endDate: new Date(),
      repeatType: "once",
      targetDevices: [],
      targetGroups: []
    }
  });

  const onSubmit = async (data: ScheduleFormData) => {
    if (!data.name.trim()) {
      toast.error("Zamanlama adı zorunludur");
      return;
    }

    if (!data.playlistId) {
      toast.error("Playlist seçimi zorunludur");
      return;
    }

    if (data.targetDevices.length === 0 && data.targetGroups.length === 0) {
      toast.error("En az bir cihaz veya grup seçmelisiniz");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch("http://localhost:5000/api/playlist-schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: data.name,
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
        <Card>
          <CardHeader>
            <CardTitle>Music for Business - Playlist Zamanlaması</CardTitle>
            <CardDescription>
              Seçtiğiniz playlist'i belirli cihaz veya gruplarda çalmak için bir zamanlama oluşturun
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <BasicInfo />
            <TimeSettings />
            <TargetSelection />

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isSubmitting}
              >
                Temizle
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Oluşturuluyor..." : "Zamanlama Oluştur"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}