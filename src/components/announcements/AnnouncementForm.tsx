import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { BasicInfoForm } from "./BasicInfoForm";
import { PlaybackScheduleForm } from "./PlaybackScheduleForm";
import { TargetDeviceSelect } from "./TargetDeviceSelect";
import { Form } from "@/components/ui/form";

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

  const form = useForm({
    defaultValues: {
      title: announcement?.title || "",
      content: announcement?.content || "",
      startDate: announcement?.startDate ? new Date(announcement.startDate) : new Date(),
      endDate: announcement?.endDate ? new Date(announcement.endDate) : new Date(),
      scheduleType: announcement?.scheduleType || "songs",
      songInterval: announcement?.songInterval || 1,
      minuteInterval: announcement?.minuteInterval || 5,
      specificTimes: announcement?.specificTimes || [""],
      targetDevices: announcement?.targetDevices || [],
      targetGroups: announcement?.targetGroups || [],
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
    mutationFn: async (data: any) => {
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

  const handleSubmit = async (data: any) => {
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      
      // Temel bilgiler
      Object.keys(data).forEach(key => {
        if (key === 'startDate' || key === 'endDate') {
          formData.append(key, data[key].toISOString());
        } else {
          formData.append(key, data[key]);
        }
      });

      if (announcement) {
        await updateAnnouncementMutation.mutateAsync(data);
      } else {
        const fileInput = document.getElementById('file') as HTMLInputElement;
        if (fileInput?.files?.[0]) {
          formData.append('audioFile', fileInput.files[0]);
        }
        await createAnnouncementMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error("Form gönderme hatası:", error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <BasicInfoForm form={form} />
        <PlaybackScheduleForm form={form} />
        <TargetDeviceSelect form={form} />

        {!announcement && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Ses Dosyası
            </label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    MP3 formatında ses dosyası yükleyin
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => document.getElementById("file")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Yükleniyor..." : "Dosya Seç"}
                </Button>
                <input
                  id="file"
                  name="file"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  required={!announcement}
                />
              </div>

              {uploading && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    Yükleniyor... {progress}%
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <Button type="submit" disabled={uploading}>
          {announcement ? 'Anonsu Güncelle' : 'Anons Oluştur'}
        </Button>
      </form>
    </Form>
  );
};

export default AnnouncementForm;
