import { useState } from "react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ScheduleFormData {
  playlist: string;
  startDate: Date;
  endDate: Date;
  repeatType: "once" | "daily" | "weekly" | "monthly";
  targets: {
    devices: string[];
    groups: string[];
  };
}

export const PlaylistScheduleForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [selectedType, setSelectedType] = useState<"device" | "group">("device");
  const form = useForm<ScheduleFormData>();
  const queryClient = useQueryClient();

  const { data: playlists } = useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/playlists");
      return response.json();
    },
  });

  const { data: devices } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      return response.json();
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["device-groups"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/device-groups");
      return response.json();
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      const response = await fetch("http://localhost:5000/api/playlist-schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          createdBy: "system", // TODO: Implement auth
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success("Zamanlama başarıyla oluşturuldu");
      queryClient.invalidateQueries({ queryKey: ["playlist-schedules"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const onSubmit = (data: ScheduleFormData) => {
    createScheduleMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="playlist"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Playlist</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Playlist seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {playlists?.map((playlist: any) => (
                    <SelectItem key={playlist._id} value={playlist._id}>
                      {playlist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Başlangıç Tarihi</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: tr })
                        ) : (
                          <span>Tarih seçin</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date()
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bitiş Tarihi</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: tr })
                        ) : (
                          <span>Tarih seçin</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || (form.getValues("startDate") && date < form.getValues("startDate"))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="repeatType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tekrar Tipi</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Tekrar tipini seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="once">Bir Kez</SelectItem>
                  <SelectItem value="daily">Günlük</SelectItem>
                  <SelectItem value="weekly">Haftalık</SelectItem>
                  <SelectItem value="monthly">Aylık</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={selectedType === "device" ? "default" : "outline"}
              onClick={() => setSelectedType("device")}
            >
              Cihazlar
            </Button>
            <Button
              type="button"
              variant={selectedType === "group" ? "default" : "outline"}
              onClick={() => setSelectedType("group")}
            >
              Gruplar
            </Button>
          </div>

          <FormField
            control={form.control}
            name={selectedType === "device" ? "targets.devices" : "targets.groups"}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{selectedType === "device" ? "Cihazlar" : "Gruplar"}</FormLabel>
                <Select onValueChange={(value) => field.onChange([value])} defaultValue={field.value?.[0]}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={`${selectedType === "device" ? "Cihaz" : "Grup"} seçin`} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {selectedType === "device"
                      ? devices?.map((device: any) => (
                          <SelectItem key={device._id} value={device._id}>
                            {device.name}
                          </SelectItem>
                        ))
                      : groups?.map((group: any) => (
                          <SelectItem key={group._id} value={group._id}>
                            {group.name}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit">Zamanla</Button>
        </div>
      </form>
    </Form>
  );
};