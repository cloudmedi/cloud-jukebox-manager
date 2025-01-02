import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Music2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Control } from "react-hook-form";
import { formatDuration } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface PlaylistSelectProps {
  control: Control<any>;
}

export function PlaylistSelect({ control }: PlaylistSelectProps) {
  const { data: playlists = [] } = useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/playlists");
      if (!response.ok) throw new Error("Playlistler yüklenemedi");
      return response.json();
    }
  });

  return (
    <FormField
      control={control}
      name="playlistId"
      render={({ field }) => (
        <FormItem className="space-y-4">
          <FormLabel>Playlist</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger>
              <SelectValue placeholder="Playlist seçin" />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-[300px]">
                {playlists.map((playlist: any) => (
                  <SelectItem key={playlist._id} value={playlist._id}>
                    <div className="flex items-center gap-3">
                      {playlist.artwork ? (
                        <img 
                          src={`http://localhost:5000${playlist.artwork}`}
                          alt={playlist.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                          <Music2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="font-medium">{playlist.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {playlist.songs?.length || 0} şarkı • {formatDuration(playlist.totalDuration || 0)}
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>

          {field.value && (
            <Card className="mt-4">
              <CardContent className="p-4">
                {playlists.map((playlist: any) => {
                  if (playlist._id === field.value) {
                    return (
                      <div key={playlist._id} className="flex gap-4">
                        {playlist.artwork ? (
                          <img 
                            src={`http://localhost:5000${playlist.artwork}`}
                            alt={playlist.name}
                            className="h-24 w-24 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-muted">
                            <Music2 className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="space-y-2">
                          <h3 className="font-semibold">{playlist.name}</h3>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>{playlist.songs?.length || 0} şarkı</p>
                            <p>Toplam süre: {formatDuration(playlist.totalDuration || 0)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </CardContent>
            </Card>
          )}
        </FormItem>
      )}
    />
  );
}