import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, Save, Clock, Users, Volume2 } from "lucide-react";

interface AnnouncementForm {
  title: string;
  content: string;
  audioFile?: File;
  schedule: {
    startDate: Date;
    endDate: Date;
    type: "interval" | "specific";
    interval?: number;
    specificTimes?: string[];
  };
  targets: {
    devices: string[];
    groups: string[];
  };
}

const Announcements = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const queryClient = useQueryClient();
  const form = useForm<AnnouncementForm>();

  // Cihazları getir
  const { data: devices = [] } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) throw new Error("Cihazlar yüklenemedi");
      return response.json();
    },
  });

  // Grupları getir
  const { data: groups = [] } = useQuery({
    queryKey: ["device-groups"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/device-groups");
      if (!response.ok) throw new Error("Gruplar yüklenemedi");
      return response.json();
    },
  });

  // Anons oluştur
  const createAnnouncement = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("http://localhost:5000/api/announcements", {
        method: "POST",
        body: formData,
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
      setAudioDuration(0);
      setUploadProgress(0);
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("audio/")) {
        toast.error("Lütfen geçerli bir ses dosyası seçin");
        return;
      }

      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        setAudioDuration(Math.ceil(audio.duration));
        setAudioFile(file);
        toast.success("Ses dosyası yüklendi");
      };
    }
  };

  const onSubmit = async (data: AnnouncementForm) => {
    if (!audioFile) {
      toast.error("Lütfen bir ses dosyası seçin");
      return;
    }

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("content", data.content);
    formData.append("audioFile", audioFile);
    formData.append("duration", String(audioDuration));
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
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Anons Yönetimi</h1>
        <p className="text-muted-foreground">
          Yeni anons oluşturun ve zamanlamayı ayarlayın
        </p>
      </div>

      <Card className="p-6">
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

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <TabsContent value="basic">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Başlık</Label>
                  <Input
                    id="title"
                    {...form.register("title", { required: true })}
                    placeholder="Anons başlığı"
                  />
                </div>

                <div>
                  <Label htmlFor="content">Açıklama</Label>
                  <Textarea
                    id="content"
                    {...form.register("content", { required: true })}
                    placeholder="Anons açıklaması"
                  />
                </div>

                <div>
                  <Label>Ses Dosyası</Label>
                  <div className="border-2 border-dashed rounded-lg p-6">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="bg-primary/10 p-4 rounded-full">
                        <Upload className="h-8 w-8 text-primary" />
                      </div>
                      
                      {audioFile ? (
                        <div className="text-center">
                          <p className="font-medium">{audioFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Süre: {Math.floor(audioDuration / 60)}:{String(audioDuration % 60).padStart(2, "0")}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">
                            MP3 formatında ses dosyası yükleyin
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-2"
                            onClick={() => document.getElementById("audioFile")?.click()}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Dosya Seç
                          </Button>
                        </div>
                      )}
                    </div>

                    <input
                      id="audioFile"
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={handleAudioUpload}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schedule">
              <div className="space-y-4">
                <div>
                  <Label>Zamanlama Tipi</Label>
                  <RadioGroup
                    defaultValue="interval"
                    onValueChange={(value) => form.setValue("schedule.type", value as "interval" | "specific")}
                    className="grid grid-cols-2 gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="interval" id="interval" />
                      <Label htmlFor="interval">Aralıklı</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="specific" id="specific" />
                      <Label htmlFor="specific">Belirli Saatler</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Başlangıç Tarihi</Label>
                    <Calendar
                      mode="single"
                      selected={form.watch("schedule.startDate")}
                      onSelect={(date) => form.setValue("schedule.startDate", date)}
                      className="rounded-md border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bitiş Tarihi</Label>
                    <Calendar
                      mode="single"
                      selected={form.watch("schedule.endDate")}
                      onSelect={(date) => form.setValue("schedule.endDate", date)}
                      className="rounded-md border"
                    />
                  </div>
                </div>

                {form.watch("schedule.type") === "interval" ? (
                  <div className="space-y-2">
                    <Label>Çalma Aralığı (Dakika)</Label>
                    <Input
                      type="number"
                      min="1"
                      {...form.register("schedule.interval", { valueAsNumber: true })}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Çalma Saatleri</Label>
                    <div className="space-y-2">
                      {form.watch("schedule.specificTimes")?.map((time, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            type="time"
                            value={time}
                            onChange={(e) => {
                              const newTimes = [...form.watch("schedule.specificTimes") || []];
                              newTimes[index] = e.target.value;
                              form.setValue("schedule.specificTimes", newTimes);
                            }}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              const newTimes = form.watch("schedule.specificTimes")?.filter((_, i) => i !== index);
                              form.setValue("schedule.specificTimes", newTimes);
                            }}
                          >
                            <span className="sr-only">Sil</span>
                            ×
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const currentTimes = form.watch("schedule.specificTimes") || [];
                          form.setValue("schedule.specificTimes", [...currentTimes, ""]);
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Saat Ekle
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="targets">
              <div className="space-y-6">
                <div>
                  <Label>Hedef Cihazlar</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {devices.map((device: any) => (
                      <label
                        key={device._id}
                        className="flex items-center p-4 border rounded-lg hover:bg-accent cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-3"
                          onChange={(e) => {
                            const currentDevices = form.watch("targets.devices") || [];
                            if (e.target.checked) {
                              form.setValue("targets.devices", [...currentDevices, device._id]);
                            } else {
                              form.setValue(
                                "targets.devices",
                                currentDevices.filter((id) => id !== device._id)
                              );
                            }
                          }}
                        />
                        <div>
                          <p className="font-medium">{device.name}</p>
                          <p className="text-sm text-muted-foreground">{device.location}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Hedef Gruplar</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {groups.map((group: any) => (
                      <label
                        key={group._id}
                        className="flex items-center p-4 border rounded-lg hover:bg-accent cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-3"
                          onChange={(e) => {
                            const currentGroups = form.watch("targets.groups") || [];
                            if (e.target.checked) {
                              form.setValue("targets.groups", [...currentGroups, group._id]);
                            } else {
                              form.setValue(
                                "targets.groups",
                                currentGroups.filter((id) => id !== group._id)
                              );
                            }
                          }}
                        />
                        <div>
                          <p className="font-medium">{group.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {group.devices?.length || 0} cihaz
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-center text-muted-foreground">
                  Yükleniyor... {uploadProgress}%
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={createAnnouncement.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {createAnnouncement.isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </form>
        </Tabs>
      </Card>
    </div>
  );
};

export default Announcements;