import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Save, X } from "lucide-react";
import { Announcement } from "./types";
import { TargetSelector } from "./TargetSelector";
import { AudioUploader } from "./AudioUploader";
import { ScheduleSelector } from "./ScheduleSelector";

export const NewAnnouncementForm = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const form = useForm<Announcement>();

  const createAnnouncement = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("http://localhost:5000/api/announcements", {
        method: "POST",
        body: data,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Anons başarıyla oluşturuldu");
      form.reset();
      setAudioFile(null);
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const onSubmit = async (data: Announcement) => {
    if (!audioFile) {
      toast.error("Lütfen bir ses dosyası seçin");
      return;
    }

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("content", data.content);
    formData.append("audioFile", audioFile);
    formData.append("duration", String(data.duration));
    formData.append("startDate", data.schedule.startDate.toISOString());
    formData.append("endDate", data.schedule.endDate.toISOString());
    formData.append("scheduleType", data.schedule.type);
    
    if (data.schedule.type === "interval") {
      formData.append("interval", String(data.schedule.interval));
    } else {
      data.schedule.specificTimes?.forEach(time => {
        formData.append("specificTimes[]", time);
      });
    }

    data.targets.devices.forEach(deviceId => {
      formData.append("targetDevices[]", deviceId);
    });

    data.targets.groups.forEach(groupId => {
      formData.append("targetGroups[]", groupId);
    });

    try {
      await createAnnouncement.mutateAsync(formData);
    } catch (error) {
      console.error("Form gönderme hatası:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Başlık</Label>
            <Input
              id="title"
              {...form.register("title", { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Açıklama</Label>
            <Textarea
              id="content"
              {...form.register("content", { required: true })}
            />
          </div>

          <AudioUploader
            onFileSelect={(file) => setAudioFile(file)}
            selectedFile={audioFile}
          />

          <ScheduleSelector form={form} />
          
          <TargetSelector form={form} />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
          >
            <X className="w-4 h-4 mr-2" />
            İptal
          </Button>
          <Button type="submit" disabled={createAnnouncement.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {createAnnouncement.isPending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </form>
    </Form>
  );
};