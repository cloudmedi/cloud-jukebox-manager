import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BasicInfo } from "./BasicInfo";
import { ScheduleSettings } from "./ScheduleSettings";
import { TargetSelection } from "./TargetSelection";
import { Volume2, Clock, Users, ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";

const STEPS = ["basic", "schedule", "targets"] as const;
type Step = typeof STEPS[number];

export const AnnouncementForm = () => {
  const [currentStep, setCurrentStep] = useState<Step>("basic");
  
  const form = useForm({
    defaultValues: {
      title: "",
      content: "",
      audioFile: null,
      startDate: null,
      endDate: null,
      scheduleType: "songs",
      songInterval: 1,
      minuteInterval: null,
      specificTimes: [],
      immediateInterrupt: false,
      targetDevices: [],
      targetGroups: []
    }
  });

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case "basic":
        const { title, content, audioFile } = form.getValues();
        if (!title || !content || !audioFile) {
          toast.error("Lütfen tüm alanları doldurun ve ses dosyası yükleyin");
          return false;
        }
        return true;
      
      case "schedule":
        const { startDate, endDate, scheduleType } = form.getValues();
        if (!startDate || !endDate) {
          toast.error("Lütfen başlangıç ve bitiş tarihlerini seçin");
          return false;
        }
        if (scheduleType === "specific" && form.getValues("specificTimes").length === 0) {
          toast.error("Lütfen en az bir saat seçin");
          return false;
        }
        return true;
      
      case "targets":
        const { targetDevices, targetGroups } = form.getValues();
        if (targetDevices.length === 0 && targetGroups.length === 0) {
          toast.error("Lütfen en az bir hedef seçin");
          return false;
        }
        return true;
    }
  };

  const goToNextStep = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1 && validateStep(currentStep)) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const onSubmit = async (data: any) => {
    if (!validateStep("targets")) return;

    try {
      const formData = new FormData();
      
      // Temel bilgiler
      formData.append("title", data.title);
      formData.append("content", data.content);
      formData.append("audioFile", data.audioFile);
      formData.append("duration", data.duration?.toString() || "0");
      
      // Zamanlama bilgileri
      formData.append("startDate", data.startDate.toISOString());
      formData.append("endDate", data.endDate.toISOString());
      formData.append("scheduleType", data.scheduleType);
      formData.append("immediateInterrupt", data.immediateInterrupt.toString());

      if (data.scheduleType === "songs") {
        formData.append("songInterval", data.songInterval.toString());
      } else if (data.scheduleType === "minutes") {
        formData.append("minuteInterval", data.minuteInterval.toString());
      } else if (data.scheduleType === "specific") {
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

      const response = await fetch("http://localhost:5000/api/announcements", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast.success("Anons başarıyla oluşturuldu");
      form.reset();
      setCurrentStep("basic");
    } catch (error: any) {
      toast.error(`Hata: ${error.message}`);
      console.error("Anons oluşturma hatası:", error);
    }
  };

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={currentStep} onValueChange={(value) => setCurrentStep(value as Step)}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
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
              <BasicInfo form={form} />
            </TabsContent>

            <TabsContent value="schedule">
              <ScheduleSettings form={form} />
            </TabsContent>

            <TabsContent value="targets">
              <TargetSelection form={form} />
            </TabsContent>
          </Tabs>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousStep}
              disabled={currentStep === "basic"}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>

            {currentStep === "targets" ? (
              <Button type="submit">
                Anonsu Oluştur
              </Button>
            ) : (
              <Button type="button" onClick={goToNextStep}>
                İleri
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </form>
      </Form>
    </Card>
  );
};