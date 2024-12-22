import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { PlaylistFormValues } from "../PlaylistForm";
import { Music } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

interface SongSelectorProps {
  form: UseFormReturn<PlaylistFormValues>;
}

export const SongSelector = ({ form }: SongSelectorProps) => {
  const { data: songs = [], isLoading } = useQuery({
    queryKey: ["songs"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/songs");
      if (!response.ok) throw new Error("Şarkılar yüklenemedi");
      return response.json();
    },
  });

  if (isLoading) {
    return <div>Şarkılar yükleniyor...</div>;
  }

  return (
    <FormField
      control={form.control}
      name="songs"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Şarkılar</FormLabel>
          <Card>
            <ScrollArea className="h-[300px] p-4">
              <div className="space-y-4">
                {songs.map((song: any) => (
                  <div
                    key={song._id}
                    className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent"
                  >
                    <Checkbox
                      checked={field.value.includes(song._id)}
                      onCheckedChange={(checked) => {
                        const newValue = checked
                          ? [...field.value, song._id]
                          : field.value.filter((id) => id !== song._id);
                        field.onChange(newValue);
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{song.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {song.artist}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};