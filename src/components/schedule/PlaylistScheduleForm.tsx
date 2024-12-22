import { useState } from "react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface ScheduleFormData {
  playlist: string;
  repeatType: "once" | "daily" | "weekly" | "monthly";
  targets: string[];
}

export const PlaylistScheduleForm = () => {
  const [selectedType, setSelectedType] = useState<"device" | "group">("device");
  const form = useForm<ScheduleFormData>();

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

  const onSubmit = async (data: ScheduleFormData) => {
    console.log("Form submitted:", data);
    // TODO: Implement schedule creation API call
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
            name="targets"
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