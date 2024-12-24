import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BasicInfoForm } from "./BasicInfoForm";
import { PlaybackScheduleForm } from "./PlaybackScheduleForm";
import { Form } from "@/components/ui/form";
import { AudioUpload } from "./form/AudioUpload";
import { TargetDeviceSelect } from "./TargetDeviceSelect";
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

  const createFormData = (data: AnnouncementFormData): FormData => {
    console.log('Form verileri hazırlanıyor:', data);
    const formData = new FormData();

    // Temel form alanları
    formData.append('title', data.title);
    formData.append('content', data.content);
    formData.append('startDate', data.startDate.toISOString());
    formData.append('endDate', data.endDate.toISOString());
    formData.append('scheduleType', data.scheduleType);
    formData.append('duration', String(data.duration));

    // Ses dosyası kontrolü
    if (!data.audioFile) {
      throw new Error('Ses dosyası zorunludur');
    }
    formData.append('audioFile', data.audioFile);
    console.log('Ses dosyası eklendi:', data.audioFile.name);

    // Zamanlama verileri
    if (data.songInterval) {
      formData.append('songInterval', String(data.songInterval));
    }
    if (data.minuteInterval) {
      formData.append('minuteInterval', String(data.minuteInterval));
    }
    if (data.specificTimes?.length > 0) {
      data.specificTimes.forEach(time => {
        formData.append('specificTimes[]', time);
      });
    }

    // Hedef cihaz ve gruplar
    if (data.targets.devices?.length > 0) {
      data.targets.devices.forEach(deviceId => {
        formData.append('targetDevices[]', deviceId);
      });
    }
    if (data.targets.groups?.length > 0) {
      data.targets.groups.forEach(groupId => {
        formData.append('targetGroups[]', groupId);
      });
    }

    formData.append('createdBy', data.createdBy);
    console.log('FormData hazırlandı');
    return formData;
  };

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: AnnouncementFormData) => {
      try {
        console.log('Anons oluşturma başladı');
        const formData = createFormData(data);
        
        const response = await fetch("http://localhost:5000/api/announcements", {
          method: "POST",
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Hatası:', errorData);
          throw new Error(errorData.message || "Anons oluşturma başarısız");
        }

        const result = await response.json();
        console.log('API Yanıtı:', result);
        return result;
      } catch (error) {
        console.error('Form gönderme hatası:', error);
        throw error;
      }
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
      console.error('Anons oluşturma hatası:', error);
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
    if (!file.type.startsWith('audio/')) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen geçerli bir ses dosyası seçin",
      });
      return;
    }

    form.setValue('audioFile', file);
    
    // Ses dosyası süresini hesapla
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.onloadedmetadata = () => {
      const duration = Math.ceil(audio.duration);
      console.log('Ses dosyası süresi:', duration);
      form.setValue('duration', duration);
    };
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <BasicInfoForm form={form} />
        <PlaybackScheduleForm form={form} />
        <TargetDeviceSelect form={form} />

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