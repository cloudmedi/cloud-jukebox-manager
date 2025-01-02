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
        // Seçili playlist'i bul
        const selectedPlaylist = playlists.find(p => 
          p._id === (typeof field.value === 'string' ? field.value : field.value?._id)
        );

        console.log("Current field value:", field.value);
        console.log("Selected playlist:", selectedPlaylist);

        return (
          <FormItem className="space-y-4">
            <FormLabel>Playlist</FormLabel>
            <Select 
              onValueChange={(value) => {
                console.log("Selected value:", value);
                const playlist = playlists.find(p => p._id === value);
                field.onChange(playlist?._id || value);
              }}
              value={typeof field.value === 'string' ? field.value : field.value?._id}
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

            {selectedPlaylist && (
              <Card className="mt-4">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {selectedPlaylist.artwork ? (
                      <img 
                        src={`http://localhost:5000${selectedPlaylist.artwork}`}
                        alt={selectedPlaylist.name}
                        className="h-24 w-24 rounded-lg object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
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
                </CardContent>
              </Card>
            )}
          </FormItem>
        );
      }}
    />
  );
}