import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Control } from "react-hook-form";

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
        <FormItem>
          <FormLabel>Playlist</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger>
              <SelectValue placeholder="Playlist seçin" />
            </SelectTrigger>
            <SelectContent>
              {playlists.map((playlist: any) => (
                <SelectItem key={playlist._id} value={playlist._id}>
                  {playlist.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
}