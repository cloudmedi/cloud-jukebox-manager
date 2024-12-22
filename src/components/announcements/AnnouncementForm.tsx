import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { BasicInfoForm } from "./BasicInfoForm";
import { PlaybackScheduleForm } from "./PlaybackScheduleForm";

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

      const url = announcement 
        ? `http://localhost:5000/api/announcements/${announcement._id}`
        : "http://localhost:5000/api/announcements";
      
      const method = announcement ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) throw new Error("İşlem başarısız");

      toast({
        title: "Başarılı",
        description: `Anons başarıyla ${announcement ? 'güncellendi' : 'oluşturuldu'}`,
      });

      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      if (onSuccess) onSuccess();
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu",
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <BasicInfoForm form={form} />
      
      <PlaybackScheduleForm form={form} />

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
  );
};

export default AnnouncementForm;