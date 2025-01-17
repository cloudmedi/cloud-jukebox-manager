import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Music2, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Control } from "react-hook-form";
import { formatDuration } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface PlaylistSelectProps {
  control: Control<any>;
}

export function PlaylistSelect({ control }: PlaylistSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredPlaylists = playlists.filter(playlist => 
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <div className="p-2">
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Playlist ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <ScrollArea className="h-[300px]">
                    {filteredPlaylists.map((playlist) => (
                      <SelectItem key={playlist._id} value={playlist._id}>
                        <div className="flex items-start gap-2">
                          {playlist.artwork ? (
                            <img 
                              src={`http://localhost:5000${playlist.artwork}`}
                              alt={playlist.name}
                              className="h-8 w-8 rounded-sm object-cover flex-shrink-0"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-muted flex-shrink-0">
                              <Music2 className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex flex-col justify-start">
                            <p className="text-sm font-medium leading-none">{playlist.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {playlist.songs?.length || 0} şarkı • {formatDuration(playlist.totalDuration || 0)}
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </div>
              </SelectContent>
            </Select>
          </FormItem>
        );
      }}
    />
  );
}