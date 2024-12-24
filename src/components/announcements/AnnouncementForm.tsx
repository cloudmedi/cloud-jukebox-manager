import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BasicInfoForm } from "./BasicInfoForm";
import { PlaybackScheduleForm } from "./PlaybackScheduleForm";
import { Form } from "@/components/ui/form";
import { AudioUpload } from "./form/AudioUpload";
import { TargetSelect } from "@/components/schedule/TargetSelect";
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
      targets: {
        devices: announcement?.targetDevices || [],
        groups: announcement?.targetGroups || []
      },
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

  const handleSubmit = async (data: AnnouncementFormData) => {
    if (announcement) {
      // Güncelleme işlemi için veri yapısını düzenle
      const updateData = {
        ...data,
        targetDevices: data.targets.devices,
        targetGroups: data.targets.groups,
      };
      await updateAnnouncementMutation.mutateAsync(updateData);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      
      // Temel bilgileri ekle
      const requestData = {
        ...data,
        targetDevices: data.targets.devices,
        targetGroups: data.targets.groups,
      };

      // FormData'ya her bir alanı ekle
      Object.keys(requestData).forEach(key => {
        if (key === 'startDate' || key === 'endDate') {
          const date = requestData[key as keyof typeof requestData];
          if (date instanceof Date) {
            formData.append(key, date.toISOString());
          }
        } else if (key !== 'audioFile' && key !== 'targets') {
          formData.append(key, JSON.stringify(requestData[key as keyof typeof requestData]));
        }
      });

      // Ses dosyasını ekle
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
        <TargetSelect form={form} />

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