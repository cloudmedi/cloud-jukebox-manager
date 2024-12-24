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
      duration: announcement?.duration || 0,
      createdBy: "system"
    },
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: AnnouncementFormData) => {
      const formData = new FormData();
      
      // Form verilerini FormData'ya ekle
      formData.append('title', data.title);
      formData.append('content', data.content);
      if (data.audioFile) {
        formData.append('audioFile', data.audioFile);
      }
      formData.append('duration', String(data.duration));
      formData.append('startDate', data.startDate.toISOString());
      formData.append('endDate', data.endDate.toISOString());
      formData.append('scheduleType', data.scheduleType);
      
      if (data.songInterval) {
        formData.append('songInterval', String(data.songInterval));
      }
      if (data.minuteInterval) {
        formData.append('minuteInterval', String(data.minuteInterval));
      }
      if (data.specificTimes && data.specificTimes.length > 0) {
        data.specificTimes.forEach(time => {
          formData.append('specificTimes', time);
        });
      }
      
      // Hedef cihaz ve grupları ekle
      if (data.targets.devices && data.targets.devices.length > 0) {
        data.targets.devices.forEach(deviceId => {
          formData.append('targetDevices', deviceId);
        });
      }
      if (data.targets.groups && data.targets.groups.length > 0) {
        data.targets.groups.forEach(groupId => {
          formData.append('targetGroups', groupId);
        });
      }
      
      formData.append('createdBy', data.createdBy);

      console.log('Gönderilen form verileri:', {
        title: data.title,
        content: data.content,
        audioFile: data.audioFile?.name,
        duration: data.duration,
        startDate: data.startDate,
        endDate: data.endDate,
        scheduleType: data.scheduleType,
        songInterval: data.songInterval,
        minuteInterval: data.minuteInterval,
        specificTimes: data.specificTimes,
        targetDevices: data.targets.devices,
        targetGroups: data.targets.groups,
        createdBy: data.createdBy
      });

      const response = await fetch("http://localhost:5000/api/announcements", {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Anons oluşturma başarısız");
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
      console.error('Form gönderme hatası:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message,
      });
    },
  });

  const handleSubmit = async (data: AnnouncementFormData) => {
    try {
      await createAnnouncementMutation.mutateAsync(data);
    } catch (error) {
      console.error('Form gönderme hatası:', error);
    }
  };

  const handleFileSelect = (file: File) => {
    form.setValue('audioFile', file);
    // Ses dosyasının süresini hesapla
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.onloadedmetadata = () => {
      form.setValue('duration', Math.ceil(audio.duration));
    };
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