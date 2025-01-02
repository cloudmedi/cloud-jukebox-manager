import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ScheduleFormData } from "./types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, Clock, ListMusic, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { DateRangeSelect } from "./DateRangeSelect";

interface PlaylistScheduleFormProps {
  onSuccess?: () => void;
}

export function PlaylistScheduleForm({ onSuccess }: PlaylistScheduleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deviceSearch, setDeviceSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const queryClient = useQueryClient();
  
  const form = useForm<ScheduleFormData>({
    defaultValues: {
      name: "",
      playlist: "",
      startDate: new Date(),
      endDate: new Date(),
      repeatType: "once",
      targets: {
        devices: [],
        groups: []
      }
    }
  });

  const { data: playlists = [] } = useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/playlists");
      if (!response.ok) throw new Error("Playlistler yüklenemedi");
      return response.json();
    }
  });

  const { data: devices = [] } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) throw new Error("Cihazlar yüklenemedi");
      return response.json();
    }
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/device-groups");
      if (!response.ok) throw new Error("Gruplar yüklenemedi");
      return response.json();
    }
  });

  const filteredDevices = devices.filter((device: any) =>
    device.name.toLowerCase().includes(deviceSearch.toLowerCase()) ||
    device.location?.toLowerCase().includes(deviceSearch.toLowerCase())
  );

  const filteredGroups = groups.filter((group: any) =>
    group.name.toLowerCase().includes(groupSearch.toLowerCase())
  );

  const onSubmit = async (data: ScheduleFormData) => {
    if (!data.name.trim()) {
      toast.error("Zamanlama adı zorunludur");
      return;
    }

    if (!data.playlist) {
      toast.error("Playlist seçimi zorunludur");
      return;
    }

    if (data.targets.devices.length === 0 && data.targets.groups.length === 0) {
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
          playlist: data.playlist,
          startDate: data.startDate,
          endDate: data.endDate,
          repeatType: data.repeatType,
          targets: data.targets
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Yeni Zamanlama Oluştur</CardTitle>
            <CardDescription>
              Playlist zamanlaması oluşturmak için aşağıdaki formu doldurun
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Playlist Bilgileri */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <ListMusic className="h-5 w-5" />
                  <span>Playlist Bilgileri</span>
                </div>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zamanlama Adı</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: Sabah Müzikleri" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="playlist"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Playlist</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Playlist seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {playlists.map((playlist: any) => (
                            <SelectItem key={playlist._id} value={playlist._id}>
                              {playlist.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Zaman Ayarları */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Calendar className="h-5 w-5" />
                  <span>Zaman Ayarları</span>
                </div>
                
                <DateRangeSelect control={form.control} />

                <FormField
                  control={form.control}
                  name="repeatType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tekrar Tipi</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Tekrar tipini seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="once">Tek Seferlik</SelectItem>
                          <SelectItem value="daily">Günlük</SelectItem>
                          <SelectItem value="weekly">Haftalık</SelectItem>
                          <SelectItem value="monthly">Aylık</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Hedef Seçimi */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Users className="h-5 w-5" />
                <span>Hedef Seçimi</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cihazlar */}
                <div className="space-y-2">
                  <FormLabel>Cihazlar</FormLabel>
                  <Input
                    placeholder="Cihaz ara..."
                    value={deviceSearch}
                    onChange={(e) => setDeviceSearch(e.target.value)}
                    className="mb-2"
                  />
                  <ScrollArea className="h-[200px] rounded-md border p-4">
                    <div className="space-y-2">
                      {filteredDevices.map((device: any) => (
                        <div key={device._id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={form.watch("targets.devices")?.includes(device._id)}
                            onCheckedChange={(checked) => {
                              const currentDevices = form.watch("targets.devices") || [];
                              const newDevices = checked
                                ? [...currentDevices, device._id]
                                : currentDevices.filter((id: string) => id !== device._id);
                              form.setValue("targets.devices", newDevices);
                            }}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <span className="text-sm font-medium">{device.name}</span>
                            {device.location && (
                              <span className="text-xs text-muted-foreground">
                                {device.location}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Gruplar */}
                <div className="space-y-2">
                  <FormLabel>Gruplar</FormLabel>
                  <Input
                    placeholder="Grup ara..."
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    className="mb-2"
                  />
                  <ScrollArea className="h-[200px] rounded-md border p-4">
                    <div className="space-y-2">
                      {filteredGroups.map((group: any) => (
                        <div key={group._id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={form.watch("targets.groups")?.includes(group._id)}
                            onCheckedChange={(checked) => {
                              const currentGroups = form.watch("targets.groups") || [];
                              const newGroups = checked
                                ? [...currentGroups, group._id]
                                : currentGroups.filter((id: string) => id !== group._id);
                              form.setValue("targets.groups", newGroups);
                            }}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <span className="text-sm font-medium">{group.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {group.devices?.length || 0} cihaz
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isSubmitting}
              >
                Temizle
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Oluşturuluyor..." : "Zamanlama Oluştur"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}