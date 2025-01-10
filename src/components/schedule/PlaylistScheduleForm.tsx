import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PlaylistSelect } from "./PlaylistSelect";
import { DateRangeSelect } from "./DateRangeSelect";
import { RepeatTypeSelect } from "./RepeatTypeSelect";
import { TargetSelect } from "./TargetSelect";
import { ScheduleFormData } from "./types";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

interface PlaylistScheduleFormProps {
  onSuccess?: (savedEvent: any) => void;
  onClose?: (success: boolean) => void;
  initialStartDate?: Date;
  initialEndDate?: Date;
  isEditing?: boolean;
  initialData?: any;
}

export function PlaylistScheduleForm({ 
  onSuccess,
  onClose,
  initialStartDate,
  initialEndDate,
  isEditing,
  initialData 
}: PlaylistScheduleFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([]);

  const form = useForm<ScheduleFormData>({
    defaultValues: {
      playlist: initialData?.playlist?._id || "",
      startDate: initialStartDate || new Date(),
      endDate: initialEndDate || new Date(),
      repeatType: initialData?.repeatType || "once",
      targets: {
        targetType: initialData?.targets?.targetType || "group",
        devices: initialData?.targets?.devices || [],
        groups: initialData?.targets?.groups || []
      }
    }
  });

  const onSubmit = async (data: ScheduleFormData) => {
    try {
      setIsSubmitting(true);

      const payload = {
        playlist: data.playlist,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        repeatType: data.repeatType,
        targets: data.targets,
        createdBy: "admin"
      };

      const url = initialData?._id
        ? `http://localhost:5000/api/playlist-schedules/${initialData._id}`
        : "http://localhost:5000/api/playlist-schedules";

      const response = await fetch(url, {
        method: initialData?._id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("İşlem başarısız");

      const savedEvent = await response.json();

      toast({
        title: "Başarılı",
        description: initialData?._id
          ? "Zamanlama güncellendi"
          : "Yeni zamanlama oluşturuldu",
      });

      // İşlem başarılı olduğunda onSuccess'i çağır ve event'i gönder
      onSuccess?.(savedEvent);
      onClose?.(true);
    } catch (error) {
      console.error("Form gönderme hatası:", error);
      toast({
        title: "Hata",
        description: "İşlem başarısız oldu",
        variant: "destructive",
      });
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
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Oluşturuluyor..." : isEditing ? "Güncelle" : "Oluştur"}
          </Button>
        </div>
      </form>
    </Form>
  );
}