import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BasicInfoForm } from "./BasicInfoForm";
import { PlaybackScheduleForm } from "./PlaybackScheduleForm";
import { Form } from "@/components/ui/form";
import { AudioUpload } from "./form/AudioUpload";
import { TargetSelector } from "./form/TargetSelector";
import { AnnouncementFormData } from "./types/announcement";

const API_URL = "http://localhost:5000/api";

interface AnnouncementFormProps {
  announcement?: any;
  onSuccess?: () => void;
}

const AnnouncementForm = ({ announcement, onSuccess }: AnnouncementFormProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AnnouncementFormData>({
    defaultValues: {
      title: announcement?.title || "",
      content: announcement?.content || "",
      startDate: announcement?.startDate ? new Date(announcement.startDate) : new Date(),
      endDate: announcement?.endDate ? new Date(announcement.endDate) : new Date(),
      scheduleType: announcement?.scheduleType || "songs",
      songInterval: announcement?.songInterval || 1,
      minuteInterval: announcement?.minuteInterval || 5,
      specificTimes: announcement?.specificTimes || [],
      targetDevices: announcement?.targetDevices || [],
      targetGroups: announcement?.targetGroups || [],
      duration: announcement?.duration || 0
    },
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`${API_URL}/announcements`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Anons oluşturma başarısız");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({
        title: "Başarılı",
        description: "Anons başarıyla oluşturuldu",
      });
      if (onSuccess) onSuccess();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message,
      });
    },
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: async (data: AnnouncementFormData) => {
      const response = await fetch(`${API_URL}/announcements/${announcement._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Anons güncelleme başarısız");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({
        title: "Başarılı",
        description: "Anons başarıyla güncellendi",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message,
      });
    },
  });

  const handleSubmit = async (data: AnnouncementFormData) => {
    if (announcement) {
      await updateAnnouncementMutation.mutateAsync(data);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      
      // Temel bilgiler
      Object.keys(data).forEach(key => {
        if (key === 'startDate' || key === 'endDate') {
          const date = data[key as keyof AnnouncementFormData];
          if (date instanceof Date) {
            formData.append(key, date.toISOString());
          }
        } else if (key !== 'audioFile') {
          formData.append(key, JSON.stringify(data[key as keyof AnnouncementFormData]));
        }
      });

      if (data.audioFile) {
        formData.append('audioFile', data.audioFile);
      }

      await createAnnouncementMutation.mutateAsync(formData);
    } catch (error) {
      console.error("Form gönderme hatası:", error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleFileSelect = (file: File) => {
    form.setValue('audioFile', file);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <BasicInfoForm form={form} />
        <PlaybackScheduleForm form={form} />
        <TargetSelector form={form} />

        {!announcement && (
          <AudioUpload
            form={form}
            uploading={uploading}
            progress={progress}
            onFileSelect={handleFileSelect}
          />
        )}

        <Button type="submit" disabled={uploading}>
          {announcement ? 'Anonsu Güncelle' : 'Anons Oluştur'}
        </Button>
      </form>
    </Form>
  );
};

export default AnnouncementForm;
