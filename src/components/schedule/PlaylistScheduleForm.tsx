import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PlaylistSelect } from "./PlaylistSelect";
import { DateRangeSelect } from "./DateRangeSelect";
import { RepeatTypeSelect } from "./RepeatTypeSelect";
import { TargetSelect } from "./TargetSelect";
import { ScheduleFormData } from "./types";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const scheduleFormSchema = z.object({
  playlist: z.string().min(1, "Playlist seçiniz"),
  startDate: z.date(),
  endDate: z.date(),
  repeatType: z.enum(["once", "daily", "weekly", "monthly"]),
  targets: z.object({
    targetType: z.enum(["group", "device"]),
    devices: z.array(z.string()),
    groups: z.array(z.string())
  })
}).refine((data) => {
  return data.startDate < data.endDate;
}, {
  message: "Bitiş zamanı başlangıç zamanından sonra olmalıdır",
  path: ["endDate"]
});

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
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      playlist: initialData?.playlist?._id || "",
      startDate: initialStartDate || 
                (initialData?.startDate ? new Date(initialData.startDate) : new Date()),
      endDate: initialEndDate || 
              (initialData?.endDate ? new Date(initialData.endDate) : new Date()),
      repeatType: initialData?.repeatType || "once",
      targets: {
        targetType: initialData?.targets?.targetType || "group",
        devices: initialData?.targets?.devices?.map((device: any) => device._id) || [],
        groups: initialData?.targets?.groups?.map((group: any) => group._id) || []
      }
    }
  });

  // Form değerlerini izle
  const formValues = form.watch();

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      console.log("Setting form with initial data:", {
        isEditing,
        initialData,
        id: initialData._id
      });
    }
  }, [initialData, isEditing]);

  const onSubmit = async (data: ScheduleFormData) => {
    try {
      setIsSubmitting(true);
      console.log("Form submission started:", {
        isEditing,
        initialData,
        formData: data
      });

      const payload = {
        playlist: data.playlist,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        repeatType: data.repeatType,
        targets: data.targets,
        createdBy: "admin"
      };

      let response;
      
      if (isEditing) {
        const eventId = initialData?.id || initialData?._id;
        console.log("Updating event with ID:", eventId);
        
        if (!eventId) {
          console.error("No event ID found in initialData:", initialData);
          throw new Error("Güncellenecek event ID'si bulunamadı");
        }

        response = await fetch(
          `http://localhost:5000/api/playlist-schedules/${eventId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      } else {
        console.log("Creating new event");
        response = await fetch(
          "http://localhost:5000/api/playlist-schedules",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "İşlem başarısız oldu");
      }

      const savedEvent = await response.json();
      console.log("Operation successful:", {
        type: isEditing ? "update" : "create",
        event: savedEvent
      });

      toast({
        title: "Başarılı",
        description: isEditing ? "Zamanlama güncellendi" : "Yeni zamanlama oluşturuldu",
      });

      onSuccess?.(savedEvent);
      onClose?.(true);
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast({
        title: "Hata",
        description: error.message || "İşlem başarısız oldu",
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