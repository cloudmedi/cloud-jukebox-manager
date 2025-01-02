import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PlaylistSelect } from "./PlaylistSelect";
import { DateRangeSelect } from "./DateRangeSelect";
import { RepeatTypeSelect } from "./RepeatTypeSelect";
import { TargetSelect } from "./TargetSelect";
import { useQueryClient } from "@tanstack/react-query";
import { ScheduleFormData } from "./types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, Clock, ListMusic, Users } from "lucide-react";

interface PlaylistScheduleFormProps {
  onSuccess?: () => void;
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Yeni Zamanlama Oluştur</CardTitle>
            <CardDescription>
              Playlist zamanlaması oluşturmak için aşağıdaki formu doldurun
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <ListMusic className="h-5 w-5" />
                  <span>Playlist Bilgileri</span>
                </div>
                <Input 
                  placeholder="Zamanlama Adı" 
                  {...form.register("name")}
                  className="w-full"
                />
                <PlaylistSelect control={form.control} />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Calendar className="h-5 w-5" />
                  <span>Zaman Ayarları</span>
                </div>
                <DateRangeSelect control={form.control} />
                <RepeatTypeSelect control={form.control} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Users className="h-5 w-5" />
                <span>Hedef Seçimi</span>
              </div>
              <TargetSelect control={form.control} />
            </div>

            <div className="flex justify-end gap-4">
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