import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Music, Calendar, Users, ArrowRight } from "lucide-react";
import { BasicInfo } from "./form/BasicInfo";
import { TimeSettings } from "./form/TimeSettings";
import { TargetSelection } from "./form/TargetSelection";

interface PlaylistScheduleFormProps {
  onSuccess?: () => void;
}

interface ScheduleFormData {
  name: string;
  playlistId: string;
  startDate: Date;
  endDate: Date;
  repeatType: "once" | "daily" | "weekly" | "monthly";
  targetDevices: string[];
  targetGroups: string[];
}

export function PlaylistScheduleForm({ onSuccess }: PlaylistScheduleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");
  
  const form = useForm<ScheduleFormData>({
    defaultValues: {
      name: "",
      playlistId: "",
      startDate: new Date(),
      endDate: new Date(),
      repeatType: "once",
      targetDevices: [],
      targetGroups: []
    }
  });

  const onSubmit = async (data: ScheduleFormData) => {
    if (!data.name.trim()) {
      toast.error("Zamanlama adı zorunludur");
      return;
    }

    if (!data.playlistId) {
      toast.error("Playlist seçimi zorunludur");
      return;
    }

    if (data.targetDevices.length === 0 && data.targetGroups.length === 0) {
      toast.error("En az bir cihaz veya grup seçmelisiniz");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch("http://localhost:5000/api/playlist-schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: data.name,
          playlist: data.playlistId,
          startDate: data.startDate,
          endDate: data.endDate,
          repeatType: data.repeatType,
          targets: {
            devices: data.targetDevices,
            groups: data.targetGroups
          }
        })
      });

      if (!response.ok) {
        throw new Error("Zamanlama oluşturulamadı");
      }

      toast.success("Zamanlama başarıyla oluşturuldu");
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      form.reset();
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error("Schedule creation error:", error);
      toast.error("Zamanlama oluşturulurken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextTab = () => {
    if (activeTab === "basic") setActiveTab("time");
    else if (activeTab === "time") setActiveTab("target");
  };

  const handlePreviousTab = () => {
    if (activeTab === "target") setActiveTab("time");
    else if (activeTab === "time") setActiveTab("basic");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
        <Card>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Playlist Bilgileri
                </TabsTrigger>
                <TabsTrigger value="time" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Zaman Ayarları
                </TabsTrigger>
                <TabsTrigger value="target" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Hedef Seçimi
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[calc(100vh-400px)] px-1">
                <TabsContent value="basic" className="space-y-4 mt-0">
                  <BasicInfo />
                </TabsContent>

                <TabsContent value="time" className="space-y-4 mt-0">
                  <TimeSettings />
                </TabsContent>

                <TabsContent value="target" className="space-y-4 mt-0">
                  <TargetSelection />
                </TabsContent>
              </ScrollArea>

              <div className="flex justify-between pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousTab}
                  disabled={activeTab === "basic"}
                >
                  Geri
                </Button>
                
                {activeTab !== "target" ? (
                  <Button type="button" onClick={handleNextTab}>
                    İleri
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Oluşturuluyor..." : "Zamanlama Oluştur"}
                  </Button>
                )}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
