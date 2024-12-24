import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BasicInfo } from "./BasicInfo";
import { ScheduleSettings } from "./ScheduleSettings";
import { TargetSelection } from "./TargetSelection";
import { Volume2, Clock, Users } from "lucide-react";

export const AnnouncementForm = () => {
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

  const onSubmit = async (data: any) => {
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
    } catch (error: any) {
      toast.error(`Hata: ${error.message}`);
      console.error("Anons oluşturma hatası:", error);
    }
  };

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
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

          <div className="flex justify-end">
            <Button type="submit">Anonsu Oluştur</Button>
          </div>
        </form>
      </Form>
    </Card>
  );
};