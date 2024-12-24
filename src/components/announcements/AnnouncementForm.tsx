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
      duration: announcement?.duration || 0,
      immediateInterrupt: announcement?.immediateInterrupt || false,
      createdBy: "system"
    },
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`${API_URL}/announcements`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Anons oluşturma başarısız");
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
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      
      // Form verilerini backend'in beklediği formata dönüştür
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'startDate' || key === 'endDate') {
          formData.append(key, value instanceof Date ? value.toISOString() : String(value));
        } else if (key === 'audioFile' && value instanceof File) {
          formData.append(key, value);
        } else if (key === 'targetDevices' || key === 'targetGroups') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });

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