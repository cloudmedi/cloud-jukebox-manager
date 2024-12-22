import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { PlaylistFormValues } from "../PlaylistForm";
import { Music2, Music4 } from "lucide-react";
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
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Music4 className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Şarkılar</h2>
        </div>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Şarkılar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <FormField
      control={form.control}
      name="songs"
      render={({ field }) => (
        <FormItem>
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Music4 className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Şarkılar</h2>
            </div>

            <FormDescription className="mb-4">
              Playlistinize eklemek istediğiniz şarkıları seçin
            </FormDescription>

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
                        <Music2 className="h-4 w-4 text-muted-foreground" />
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
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};