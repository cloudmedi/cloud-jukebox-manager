import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Music2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Control } from "react-hook-form";
import { formatDuration } from "@/lib/utils";

interface PlaylistSelectProps {
  control: Control<any>;
}

export function PlaylistSelect({ control }: PlaylistSelectProps) {
  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/playlists");
      if (!response.ok) {
        throw new Error("Playlistler yüklenemedi");
      }
      const data = await response.json();
      console.log("Loaded playlists:", data);
      return data;
    }
  });

  return (
    <FormField
      control={control}
      name="playlist"
      render={({ field }) => {
        console.log("Current field value:", field.value);
        return (
          <FormItem className="space-y-4">
            <FormLabel>Playlist</FormLabel>
            <Select 
              onValueChange={field.onChange}
              value={field.value || ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Playlist seçin" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[300px]">
                  {playlists.map((playlist) => (
                    <SelectItem key={playlist._id} value={playlist._id}>
                      <div className="flex items-center gap-3">
                        {playlist.artwork ? (
                          <img 
                            src={`http://localhost:5000${playlist.artwork}`}
                            alt={playlist.name}
                            className="h-10 w-10 rounded object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                            <Music2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium leading-none">{playlist.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {playlist.songs?.length || 0} şarkı • {formatDuration(playlist.totalDuration || 0)}
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </FormItem>
        );
      }}
    />
  );
}