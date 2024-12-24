import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BasicInfo } from "./form/BasicInfo";
import { ScheduleSettings } from "./form/ScheduleSettings";
import { TargetSelection } from "./form/TargetSelection";
import { Volume2, Clock, Users, ArrowLeft, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FormSteps } from "./form/types";

interface AnnouncementFormProps {
  onSuccess?: () => void;
  initialData?: any;
  mode?: 'create' | 'update';
}

export const AnnouncementForm = ({ onSuccess, initialData, mode = 'create' }: AnnouncementFormProps) => {
  const [currentStep, setCurrentStep] = useState<FormSteps>("basic");
  const queryClient = useQueryClient();
  
  const form = useForm({
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      audioFile: null,
      duration: initialData?.duration || 0,
      startDate: initialData?.startDate ? new Date(initialData.startDate) : new Date(),
      endDate: initialData?.endDate ? new Date(initialData.endDate) : null,
      scheduleType: initialData?.scheduleType || "songs",
      songInterval: initialData?.songInterval || 1,
      minuteInterval: initialData?.minuteInterval || null,
      specificTimes: initialData?.specificTimes || [],
      immediateInterrupt: initialData?.immediateInterrupt || false,
      targetDevices: initialData?.targetDevices || [],
      targetGroups: initialData?.targetGroups || []
    }
  });

  useEffect(() => {
    if (initialData && mode === 'update') {
      Object.keys(initialData).forEach(key => {
        if (key === 'startDate' || key === 'endDate') {
          form.setValue(key, new Date(initialData[key]));
        } else {
          form.setValue(key, initialData[key]);
        }
      });
    }
  }, [initialData, form, mode]);

  const onSubmit = async (data: any) => {
    try {
      const formData = new FormData();
      
      // Temel bilgiler
      formData.append("title", data.title);
      formData.append("content", data.content);
      if (data.audioFile) {
        formData.append("audioFile", data.audioFile);
      }
      formData.append("duration", data.duration?.toString() || "0");
      
      // Zamanlama bilgileri
      if (data.startDate) formData.append("startDate", data.startDate.toISOString());
      if (data.endDate) formData.append("endDate", data.endDate.toISOString());
      formData.append("scheduleType", data.scheduleType);
      formData.append("immediateInterrupt", data.immediateInterrupt.toString());

      if (data.scheduleType === "songs") {
        formData.append("songInterval", data.songInterval?.toString() || "1");
      } else if (data.scheduleType === "minutes") {
        formData.append("minuteInterval", data.minuteInterval?.toString() || "");
      } else if (data.scheduleType === "specific" && data.specificTimes) {
        data.specificTimes.forEach((time: string) => {
          formData.append("specificTimes[]", time);
        });
      }

      // Hedef cihaz ve gruplar
      data.targetDevices.forEach((deviceId: string) => {
        formData.append("targetDevices[]", deviceId);
      });

      data.targetGroups.forEach((groupId: string) => {
        formData.append("targetGroups[]", groupId);
      });

      const url = mode === 'create' 
        ? "http://localhost:5000/api/announcements"
        : `http://localhost:5000/api/announcements/${initialData._id}`;

      const response = await fetch(url, {
        method: mode === 'create' ? "POST" : "PUT",
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast.success(mode === 'create' ? "Anons başarıyla oluşturuldu" : "Anons başarıyla güncellendi");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      form.reset();
      setCurrentStep("basic");
      onSuccess?.();
    } catch (error: any) {
      toast.error(`Hata: ${error.message}`);
      console.error(mode === 'create' ? "Anons oluşturma hatası:" : "Anons güncelleme hatası:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={currentStep} onValueChange={(value) => setCurrentStep(value as FormSteps)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">
              <Volume2 className="w-4 h-4 mr-2" />
              Temel Bilgiler
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Clock className="w-4 h-4 mr-2" />
              Zamanlama
            </TabsTrigger>
            <TabsTrigger value="targets">
              <Users className="w-4 h-4 mr-2" />
              Hedef Seçimi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <BasicInfo />
          </TabsContent>

          <TabsContent value="schedule">
            <ScheduleSettings />
          </TabsContent>

          <TabsContent value="targets">
            <TargetSelection />
          </TabsContent>
        </Tabs>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const currentIndex = ["basic", "schedule", "targets"].indexOf(currentStep);
              if (currentIndex > 0) {
                setCurrentStep(["basic", "schedule", "targets"][currentIndex - 1] as FormSteps);
              }
            }}
            disabled={currentStep === "basic"}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>

          {currentStep === "targets" ? (
            <Button type="submit">
              {mode === 'create' ? 'Anonsu Oluştur' : 'Anonsu Güncelle'}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => {
                const currentIndex = ["basic", "schedule", "targets"].indexOf(currentStep);
                if (currentIndex < 2) {
                  setCurrentStep(["basic", "schedule", "targets"][currentIndex + 1] as FormSteps);
                }
              }}
            >
              İleri
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};