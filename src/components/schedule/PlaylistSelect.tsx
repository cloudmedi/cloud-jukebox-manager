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
      if (!response.ok) {
        throw new Error("Playlistler yüklenemedi");
      }
      const data = await response.json();
      console.log("Loaded playlists:", data); // Debug için
      return data;
    }
  });

  return (
    <FormField
      control={control}
      name="playlist" // playlistId yerine playlist olarak değiştirildi
      render={({ field }) => (
        <FormItem className="space-y-4">
          <FormLabel>Playlist</FormLabel>
          <Select 
            onValueChange={(value) => {
              console.log("Selected playlist:", value); // Debug için
              field.onChange(value);
            }} 
            value={field.value?._id || field.value}
          >
            <SelectTrigger>
              <SelectValue placeholder="Playlist seçin">
                {field.value?.name || playlists.find(p => p._id === field.value)?.name}
              </SelectValue>
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
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = ""; // Hata durumunda boş div göster
                            target.onerror = null;
                          }}
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
                {(() => {
                  const selectedPlaylist = typeof field.value === 'string' 
                    ? playlists.find(p => p._id === field.value)
                    : field.value;

                  if (!selectedPlaylist) return null;

                  return (
                    <div className="flex gap-4">
                      {selectedPlaylist.artwork ? (
                        <img 
                          src={`http://localhost:5000${selectedPlaylist.artwork}`}
                          alt={selectedPlaylist.name}
                          className="h-24 w-24 rounded-lg object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = ""; // Hata durumunda boş div göster
                            target.onerror = null;
                          }}
                        />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-muted">
                          <Music2 className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="space-y-2">
                        <h3 className="font-semibold">{selectedPlaylist.name}</h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>{selectedPlaylist.songs?.length || 0} şarkı</p>
                          <p>Toplam süre: {formatDuration(selectedPlaylist.totalDuration || 0)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </FormItem>
      )}
    />
  );
}